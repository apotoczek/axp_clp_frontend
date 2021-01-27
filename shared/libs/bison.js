/* Automatically transformed from AMD to ES6. Beware of code smell. */
/*eslint no-control-regex: "off"*/
import $ from 'jquery';
import ko from 'knockout';
import net from 'bison/net/net';
import utils from 'bison/utils/utils';
import 'bootstrap-sass';

/*!
 * Merge Sort in JavaScript v1.0
 * http://github.com/justinforce/merge-sort
 *
 * Copyright (c) 2011, Justin Force
 * Licensed under the BSD 3-Clause License
 */

/*jslint browser: true, indent: 2 */
/*global jQuery */

(function() {
    'use strict';

    // Add stable merge sort method to Array prototype
    if (!Array.mergeSort) {
        Array.prototype.mergeSort = function(compare) {
            let arr = this.clone(),
                length = arr.length,
                middle = Math.floor(length / 2);

            // define default comparison function if none is defined
            if (!compare) {
                compare = function(left, right) {
                    if (left < right) {
                        return -1;
                    } else if (left === right) {
                        return 0;
                    }
                    return 1;
                };
            }

            if (length < 2) {
                return arr;
            }

            function merge(left, right, compare) {
                let result = [];

                while (left.length > 0 || right.length > 0) {
                    if (left.length > 0 && right.length > 0) {
                        if (compare(left[0], right[0]) <= 0) {
                            result.push(left[0]);
                            left = left.slice(1);
                        } else {
                            result.push(right[0]);
                            right = right.slice(1);
                        }
                    } else if (left.length > 0) {
                        result.push(left[0]);
                        left = left.slice(1);
                    } else if (right.length > 0) {
                        result.push(right[0]);
                        right = right.slice(1);
                    }
                }
                return result;
            }

            return merge(
                arr.slice(0, middle).mergeSort(compare),
                arr.slice(middle, length).mergeSort(compare),
                compare,
            );
        };
    }

    // Add merge sort to jQuery if it's present
    if (window.jQuery !== undefined) {
        jQuery.fn.mergeSort = function(compare) {
            return jQuery(Array.prototype.mergeSort.call(this, compare));
        };
        jQuery.mergeSort = function(array, compare) {
            return Array.prototype.mergeSort.call(array, compare);
        };
    }
})();

window.bison = window.bison || {};

let to_number = function(str) {
    let multiplier = 1;

    if (str === undefined || str === null) {
        str = '';
    }

    str = str.toString().replace('$', '');

    if (str.search(/k/i) != -1) {
        multiplier = 1000;
    } else if (str.search(/m/i) != -1) {
        multiplier = 1000000;
    } else if (str.search(/b/i) != -1 || str.search(/g/i) != -1) {
        multiplier = 1000000000;
    }

    // Check if it has parens == negative number
    let negRegExp = /\(([^)]+)\)/;
    let negMatches = negRegExp.exec(str);

    if (negMatches && negMatches.length > 0) {
        str = `-${negMatches[1]}`;
    }

    let f = parseFloat(str.toNumber());
    if (!isNaN(f)) {
        f = f * multiplier;
        return f;
    }

    return null;
};

let bison = {
    net: net,
    utils: utils,
    helpers: {
        fmtusd_full: function(n) {
            if (n == undefined) {
                return 'N/A';
            }

            let val = `$${n.format(2, ',')}`;
            if (n < 0) {
                return `(${val})`;
            }
            return val;
        },
        modal: function(template, vm, name, backdrop = true) {
            let html;

            if (vm._has_inline_templates()) {
                html = vm.get_inline_template();
            } else {
                html = $(`#${template}`).html();
            }

            let $modal = $($.parseHTML(html)[1]);

            $modal.modal({
                show: true,
                backdrop: backdrop,
            });

            if (!$modal.parent().length) {
                $modal.appendTo(document.body);
            }

            ko.applyBindings(vm, $modal[0]);

            $('body').click(e => {
                if ($(e.target).hasClass('modal-backdrop')) {
                    bison.helpers.close_modal(name);
                }
            });

            $('body').on(`modal.${name}.hide`, () => {
                $modal.modal('hide');
                $('body').off(`modal.${name}.hide`);
            });

            $modal.on('hidden.bs.modal', () => {
                if (typeof vm.reset === 'function') {
                    vm.reset();
                }
                $modal.data('bs.modal', null);
                ko.cleanNode($modal[0]);
                $modal.remove();
            });

            return $modal;
        },
        close_modal: function(name) {
            $('body').trigger({
                type: `modal.${name}.hide`,
            });
        },
        to_number: to_number,
        set_title: function(title) {
            title = title || 'BISON';
            $('title').text(title);
        },
        set_description: function(text, default_text) {
            text = text || default_text || '';
            $('meta[name=description]').attr('content', text.escapeHTML().truncateOnWord(160));
        },
        uuid: function() {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
                let r = (Math.random() * 16) | 0,
                    v = c == 'x' ? r : (r & 0x3) | 0x8;
                return v.toString(16);
            });
        },
        slugify: function(txt) {
            return txt
                .toLowerCase()
                .replace(/[^\w ]+/g, '')
                .replace(/ +/g, '-');
        },
        is_valid_email: function(email) {
            // See http://rosskendall.com/blog/web/javascript-function-to-check-an-email-address-conforms-to-rfc822
            return /^([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x22([^\x0d\x22\x5c\x80-\xff]|\x5c[\x00-\x7f])*\x22)(\x2e([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x22([^\x0d\x22\x5c\x80-\xff]|\x5c[\x00-\x7f])*\x22))*\x40([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x5b([^\x0d\x5b-\x5d\x80-\xff]|\x5c[\x00-\x7f])*\x5d)(\x2e([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x5b([^\x0d\x5b-\x5d\x80-\xff]|\x5c[\x00-\x7f])*\x5d))*$/.test(
                email,
            );
        },
        extract_hashmap: function(obj_arr, unique_key, val_key, unwrap_val) {
            let hashmap = {};
            obj_arr.map(obj => {
                hashmap[ko.unwrap(obj[unique_key])] = unwrap_val
                    ? ko.unwrap(obj[val_key])
                    : obj[val_key];
            });
            return hashmap;
        },
        unwrap_map: function(arr, key) {
            return ko.unwrap(arr).map(value => {
                return ko.unwrap(value[key]);
            });
        },
        format_array: function(arr, num_show, abbrev) {
            if (arr && arr.length > 0) {
                arr = [...arr];

                if (arr.length > 1) {
                    if (num_show !== undefined && num_show < arr.length) {
                        let others = arr.splice(num_show, arr.length);
                        if (abbrev != undefined) {
                            if (others.length > 1) {
                                arr.push(`${others.length} ${abbrev}s`);
                            } else {
                                arr.push(`${others.length} ${abbrev}`);
                            }
                        }
                    }
                    let last = arr.splice(arr.length - 1, arr.length);
                    return `${arr.join(', ')} and ${last[0]}`;
                }
                return arr[0];
            }
        },
    },
    observable_filter: function(val) {
        let filter = ko.observable(val);
        filter._is_simple_observable = true;
        return filter;
    },
    entity_link: function(data) {
        let entity_type = ko.unwrap(data.entity_type);
        let id;

        switch (entity_type) {
            case 'fund':
                id = ko.unwrap(data.slug) || ko.unwrap(data.uid);
                if (id) {
                    return `#!/fund/${id}`;
                }
                return '#!/funds';
            case 'firm':
                id = ko.unwrap(data.slug) || ko.unwrap(data.uid);
                if (id) {
                    return `#!/firm/${id}`;
                }
                return '#!/firms';
            case 'investment':
                id = ko.unwrap(data.fund_uid);
                if (id) {
                    return `#!/fund/${id}`;
                }
                return '#!/funds';
            case 'investor':
                id = ko.unwrap(data.slug) || ko.unwrap(data.uid);
                if (id) {
                    return `#!/investor/${id}`;
                }
                return '#!/investors';
            case 'diligence':
                id = ko.unwrap(data.slug) || ko.unwrap(data.uid);
                if (id) {
                    return `#!/diligence/${id}`;
                }
                return '#!/diligence';
            default:
                return null;
        }
    },
};

/********************************************************************
 * Convert javascript object to a string of hidden inputs
 *
 ********************************************************************/
bison.helpers.object_to_input = function(obj, arr_key) {
    if (obj === undefined || obj === null) {
        return '';
    }

    if (typeof obj !== 'object') {
        return `<input type="hidden" name="${arr_key}" value="${obj}" />`;
    }
    let separator;

    if (Array.isArray(obj)) {
        separator = '-';
    } else {
        separator = '.';
    }

    return Object.keys(obj)
        .map(key => {
            let value = obj[key];
            let next_key = arr_key;
            if (next_key) {
                next_key = next_key + separator + key;
            } else {
                next_key = key;
            }
            return bison.helpers.object_to_input(value, next_key);
        })
        .join('');
};

$('body').on('net.api.request', event => {
    let data = event.payload;

    if (net.api[data.endpoint] && net.api[data.endpoint].instance) {
        let endpoint = net.api[data.endpoint].instance({
            url: data.url,
        });

        endpoint({
            data: data.data,
            success: net.api.XHRSuccess(() => {}),
            error: net.api.XHRSuccess(() => {}),
        });
    }
});

let getZIndex = function(e) {
    let z = window.document.defaultView.getComputedStyle(e).getPropertyValue('z-index');
    if (isNaN(z)) {
        if (e.parentNode instanceof Element) {
            return getZIndex(e.parentNode);
        }
        return 0;
    }
    return z;
};

$.fn.modal.Constructor.prototype.enforceFocus = function() {
    $(document)
        .off('focusin.bs.modal') // guard against infinite focus loop
        .on(
            'focusin.bs.modal',
            $.proxy(function(e) {
                if (this.$element[0] !== e.target && !this.$element.has(e.target).length) {
                    let modal_z = getZIndex(this.$element[0]);
                    let target_z = getZIndex(e.target);

                    if (modal_z > target_z) {
                        this.$element.focus();
                    }
                }
            }, this),
        );
};

ko.syncedObservable = function(namespace, initialValue, observable = ko.observable()) {
    let event_name = `sync:${namespace}`;

    observable.uuid = bison.helpers.uuid();
    observable.pauseSync = false;

    observable(initialValue);

    observable.subscribe(value => {
        if (!observable.pauseSync) {
            let evt = $.Event(event_name);
            evt.payload = value;
            evt.uuid = observable.uuid;

            $('body').trigger(evt);
        } else {
            observable.pauseSync = false;
        }
    });

    $('body').on(event_name, evt => {
        if (evt.uuid != observable.uuid) {
            observable.pauseSync = true;
            observable(evt.payload);
        }
    });

    return observable;
};

export default bison;
