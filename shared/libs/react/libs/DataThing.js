// import IdleCallback from 'src/libs/IdleCallback';
import md5 from 'spark-md5';
import * as Utils from 'src/libs/Utils';

class ExpirablePromise {
    constructor(...args) {
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

    then(onResolved, onRejected) {
        return new ExpirablePromise(this, this.promise.then(onResolved, onRejected));
    }

    catch(onRejected) {
        return new ExpirablePromise(this, this.promise.catch(onRejected));
    }

    expire() {
        this.resolveExpired();
    }
}

class DataThing {
    constructor(backend) {
        this.backend = backend;

        this.cache = new Map();

        this.requests = {};

        this._additionalKeysCallbacks = [];
        this._expiryCallbacks = [];
    }

    /**
     * Make a request to an endpoint. This is what should be called externally.
     *
     * @param {string} endpoint The full endpoint relative the api base url
     *
     * @param {object} params A simple object containing the params
     *
     * @returns {ExpirablePromise} A expirable promise that resolves when
     * the requested endpoint has returned data, and rejects on error.
     * ExpirablePromise also has a .expired property that itself is a promise,
     * resolving whenever the result expires.
     */
    request(endpoint, params, key) {
        let request_key = this.hashed(endpoint, params);

        return this.cachedRequest(request_key, key, (resolve, reject) => {
            const requestFn = () => this.backend.post(endpoint, params);

            const callback = this.genCallback(requestFn, resolve, reject);

            return requestFn()
                .then(callback)
                .catch(reject);
        });
    }

    isCached(endpoint, params) {
        const request_key = this.hashed(endpoint, params);
        return this.cache.has(request_key);
    }

    registerExternalExpiry(endpoint, params, data, handler) {
        const request_key = this.hashed(endpoint, params);
        // create a new ExpirablePromise with a noop executor since we're
        // really only interested in the expiry promise if we're not making
        // the request within dataThing
        const cache_entry = new ExpirablePromise(() => undefined);
        cache_entry.expired.then(handler);
        this.cache.set(request_key, cache_entry);
        this.addRequest(request_key, data);
    }

    /**
     * Handle caching of request.
     */
    cachedRequest(request_key, data_key, executor) {
        if (!this.cache.has(request_key)) {
            this.cache.set(request_key, new ExpirablePromise(executor));
        }

        const request = this.cache.get(request_key);

        return request
            .then(response => {
                this.addRequest(request_key, response);

                return Utils.extract_data(data_key, response.result);
            })
            .catch(error => {
                this.addRequest(request_key, error);

                this.cache.delete(request_key);

                throw error;
            });
    }

    /**
     * Generate callback to handle polling.
     */
    genCallback(requestFn, resolve, reject, pollingInterval = 500) {
        return response => {
            if (response.status && response.status === 'pending') {
                let nextInterval;

                if (response.polling_interval) {
                    nextInterval = response.polling_interval * 1000;
                } else if (pollingInterval < 10000) {
                    nextInterval = pollingInterval + 500;
                } else {
                    nextInterval = pollingInterval;
                }

                const nextCallback = this.genCallback(requestFn, resolve, reject, nextInterval);

                setTimeout(() => {
                    return requestFn()
                        .then(nextCallback)
                        .catch(reject);
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
    hashed(endpoint, params, ignoreParams = []) {
        const paramsToHash = {...params};
        for (const key of ignoreParams) {
            if (key in paramsToHash) {
                delete paramsToHash[key];
            }
        }
        return md5.hash(`${endpoint}${Utils.serialize(paramsToHash)}`);
    }

    /**
     * Add request to internal structure to enable expiry
     */
    addRequest(key, data) {
        this.requests[key] = {
            query_key: data.query_key,
            timestamp: data.timestamp,
            data_hash: data.data_hash,
        };
    }

    /**
     * Expire request key.
     */
    expireRequest(key) {
        const request = this.cache.get(key);

        if (request) {
            request.expire();
            this.cache.delete(key);
        }

        delete this.requests[key];
    }

    expireRequests(keys) {
        for (const key of keys) {
            this.expireRequest(key);
        }
    }

    addExpiryCallback(callback) {
        if (typeof callback !== 'function') {
            throw `Error: Trying to register non-function expiry callback ${callback}`;
        }
        this._expiryCallbacks.push(callback);
    }

    addAdditionalKeysCallback(callback) {
        if (typeof callback !== 'function') {
            throw `Error: Trying to register non-function key callback ${callback}`;
        }
        this._additionalKeysCallbacks.push(callback);
    }

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
        const additionalKeys = this._additionalKeysCallbacks.map(additionalKey => additionalKey());

        const params = {keys: Object.assign(this.requests, ...additionalKeys)};

        this.backend.post('/dataprovider/status_check', params).then(expired => {
            this.expireRequests(expired);
            for (const callback of this._expiryCallbacks) {
                callback(expired);
            }
        });
    }
}

export default DataThing;
