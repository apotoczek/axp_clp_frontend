import config from 'config';

if (config.enableHeapTracking && config.heapAnalyticsId) {
    /* eslint-disable no-restricted-syntax */
    (window.heap = window.heap || []),
        (heap.load = function (e, t) {
            (window.heap.appid = e), (window.heap.config = t = t || {});
            let r = document.createElement('script');
            (r.type = 'text/javascript'),
                (r.async = !0),
                (r.src = `https://cdn.heapanalytics.com/js/heap-${e}.js`);
            let a = document.getElementsByTagName('script')[0];
            a.parentNode.insertBefore(r, a);
            for (
                let n = function (e) {
                        return function () {
                            heap.push([e].concat(Array.prototype.slice.call(arguments, 0)));
                        };
                    },
                    p = [
                        'addEventProperties',
                        'addUserProperties',
                        'clearEventProperties',
                        'identify',
                        'resetIdentity',
                        'removeEventProperty',
                        'setEventProperties',
                        'track',
                        'unsetEventProperty',
                    ],
                    o = 0;
                o < p.length;
                o++
            ) {
                heap[p[o]] = n(p[o]);
            }
        });

    heap.load(config.heapAnalyticsId, {
        secureCookie: true,
    });
    /* eslint-enable no-restricted-syntax */
}
