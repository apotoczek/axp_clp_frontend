// import IdleCallback from 'src/libs/IdleCallback';
import md5 from 'spark-md5';
import {serialize} from 'utils/utils';

import {CobaltBackend, CobaltAPIParams} from './types';
import {CobaltResponse} from './responses';

type PromiseExecutor<T> = (
    resolve: (value?: T | PromiseLike<T>) => void,
    reject: (reason?: any) => void,
) => void;

// NOTE: Types in this promise class might be a little whacky. I didn't have time to
// verify properly. Sorry about that.
class ExpirablePromise<T, R> {
    promise: Promise<T>;
    expired: Promise<R>;
    resolveExpired?: () => void;

    // NOTE: Unknown type OK here since we don't care what it is.
    constructor(...args: [ExpirablePromise<unknown, R>, Promise<T>] | [PromiseExecutor<T>]) {
        if (args.length === 2) {
            const [parent, promise] = args;
            this.promise = promise;

            this.expired = parent.expired;
            this.resolveExpired = parent.resolveExpired;
        } else {
            const [executor] = args;

            this.promise = new Promise(executor);

            this.expired = new Promise(resolve => {
                this.resolveExpired = resolve;
            });
        }
    }

    then<TResult1 = T, TResult2 = never>(
        onResolved?: ((value: T) => TResult1) | undefined | null,
        onRejected?: ((reason: any) => TResult2) | undefined | null,
    ): ExpirablePromise<TResult1 | TResult2, R> {
        return new ExpirablePromise<TResult1 | TResult2, R>(
            this,
            this.promise.then(onResolved, onRejected),
        );
    }

    catch<TResult = never>(
        onRejected?: ((reason: any) => TResult) | undefined | null,
    ): ExpirablePromise<T | TResult, R> {
        return new ExpirablePromise(this, this.promise.catch(onRejected));
    }

    expire() {
        if (this.resolveExpired) {
            this.resolveExpired();
        }
    }
}

export interface Request {
    data_hash: string;
    error?: string;
    query_key: string;
    result?: CobaltResponse;
    status: string;
    timestamp: number;
    polling_interval?: number;
}

type Requests = {
    [key: string]: Request;
};

export default class DataThing {
    backend: CobaltBackend;
    cache: Map<string, ExpirablePromise<Request, Request>>;
    requests: Requests;
    // idleCallback: IdleCallback;

    constructor(backend: CobaltBackend) {
        this.backend = backend;
        this.cache = new Map();
        this.requests = {};
    }

    /**
     * Make a request to an endpoint. This is what should be called externally.
     *
     * @param endpoint The full endpoint relative the api base url
     *
     * @param params A simple object containing the params
     *
     * @returns A expirable promise that resolves when
     * the requested endpoint has returned data, and rejects on error.
     * ExpirablePromise also has a .expired property that itself is a promise,
     * resolving whenever the result expires.
     */
    request<R extends CobaltResponse = CobaltResponse>(endpoint: string, params?: CobaltAPIParams) {
        const requestKey = this.hashed(endpoint, params || {});

        return this.cachedRequest<R>(requestKey, (resolve, reject) => {
            const requestFn = () => this.backend.post(endpoint, params);

            const callback = this.genCallback(requestFn, resolve, reject);

            return requestFn().then(callback).catch(reject);
        });
    }

    isCached(endpoint: string, params: CobaltAPIParams) {
        const requestKey = this.hashed(endpoint, params);
        return this.cache.has(requestKey);
    }

    /**
     * Handle caching of request.
     */
    cachedRequest<R extends CobaltResponse = CobaltResponse>(
        requestKey: string,
        executor: PromiseExecutor<Request>,
    ) {
        let request: ExpirablePromise<Request, Request>;
        if (!this.cache.has(requestKey)) {
            request = new ExpirablePromise(executor);
            this.cache.set(requestKey, new ExpirablePromise(executor));
        } else {
            // We now this is available, so type cast.
            request = this.cache.get(requestKey) as ExpirablePromise<Request, Request>;
        }

        return request
            .then<R>(response => {
                this.addRequest(requestKey, response);

                // Probably possible to avoid this type cast here, but we know
                // result is not undefined here, since we got a (non-pending) response
                // from the backend. (We only resolve into here if we are not pending
                // any more)
                return response.result as R;
            })
            .catch(error => {
                this.addRequest(requestKey, error);
                this.cache.delete(requestKey);
                throw error;
            });
    }

    /**
     * Generate callback to handle polling.
     */
    genCallback(
        requestFn: () => Promise<Request>,
        resolve: (value?: any) => void,
        reject: (reason?: any) => void,
        pollingInterval = 500,
    ) {
        return (response: Request) => {
            if (response?.status === 'pending') {
                let nextInterval;

                if (response.polling_interval) {
                    nextInterval = response.polling_interval * 1000;
                } else if (pollingInterval < 10000) {
                    nextInterval = pollingInterval + 500;
                } else {
                    nextInterval = pollingInterval;
                }

                const nextCallback = this.genCallback(requestFn, resolve, reject, nextInterval);

                setTimeout(async () => {
                    return requestFn().then(nextCallback).catch(reject);
                }, pollingInterval);
            } else if (response.error) {
                reject(response);
            } else {
                resolve(response);
            }
        };
    }

    /**
     * Generate unique hash for endpoint/params
     */
    hashed(endpoint: string, params: CobaltAPIParams, ignoreParams: string[] = []) {
        const paramsToHash = {...params};
        for (const key of ignoreParams) {
            if (key in paramsToHash) {
                delete paramsToHash[key];
            }
        }

        return md5.hash(`${endpoint}${serialize(paramsToHash)}`);
    }

    /**
     * Add request to internal structure to enable expiry
     */
    addRequest(key: string, data: Request) {
        this.requests[key] = {
            data_hash: data.data_hash,
            query_key: data.query_key,
            status: data.status,
            timestamp: data.timestamp,
        };
    }

    /**
     * Expire request key.
     */
    expireRequest(key: string) {
        const request = this.cache.get(key);

        if (request) {
            request.expire();
            this.cache.delete(key);
        }

        delete this.requests[key];
    }

    expireRequests(keys: string[]) {
        for (const key of keys) {
            this.expireRequest(key);
        }
    }

    // TODO: Need to setup idle callback here.
    // setupStatusCheck() {
    //     this.idleCallback = new IdleCallback({
    //         id: 'statusCheck',
    //         callback: () => {
    //             this.statusCheck();
    //         },
    //         idleTimeout: 60000,
    //         interval: 15000,
    //     });
    // }

    statusCheck() {
        const params = {keys: this.requests};

        this.backend.post<string[]>('/dataprovider/status_check', params).then(expired => {
            this.expireRequests(expired);
        });
    }
}
