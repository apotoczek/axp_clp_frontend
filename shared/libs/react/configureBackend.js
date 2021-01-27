import axios from 'axios';

const configureBackend = (baseUrl, csrfCookieName, csrfHeaderName) => {
    const axiosInstance = axios.create({
        baseURL: baseUrl,
        // timeout: 5000, // FIXME: This makes a polled request timeout once it has been cached.
        withCredentials: true,
        headers: {
            'Content-Type': 'application/json',
        },
        xsrfCookieName: csrfCookieName,
        xsrfHeaderName: csrfHeaderName,
    });

    // Backend wrapper to extract body (xhr_response compatability)
    // Still need to implement directives
    const wrapper = method => (...args) =>
        axiosInstance[method](...args).then(response => response.data.body);

    const backend = {};

    for (const key of ['get', 'post']) {
        backend[key] = wrapper(key);
    }

    return backend;
};

export default configureBackend;
