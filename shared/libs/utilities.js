/* Automatically transformed from AMD to ES6. Beware of code smell. */
/* eslint no-console: "off" */

import ko from 'knockout';
import $ from 'jquery';
import pager from 'pager';
import bison from 'bison';

// Add getComputedStyle to IE8
if (!window.getComputedStyle) {
    window.getComputedStyle = function(el) {
        this.el = el;
        this.getPropertyValue = function(prop) {
            let re = /(-([a-z]){1})/g;
            if (prop == 'float') {
                prop = 'styleFloat';
            }
            if (re.test(prop)) {
                prop = prop.replace(re, function() {
                    return arguments[2].toUpperCase();
                });
            }
            return el.currentStyle[prop] ? el.currentStyle[prop] : null;
        };
        return this;
    };
}

window.oneLine = function(strings, ...values) {
    // Interweave the strings with the
    // substitution vars first.
    let output = '';
    for (let i = 0; i < values.length; i++) {
        output += strings[i] + values[i];
    }
    output += strings[values.length];

    // Split on newlines.
    let lines = output.split(/(?:\r\n|\n|\r)/);

    // Rip out the leading whitespace.
    return lines
        .map(line => {
            return line.replace(/^\s+/gm, '');
        })
        .join(' ')
        .trim();
};

window.oneLineTrim = function(strings, ...values) {
    // Interweave the strings with the
    // substitution vars first.
    let output = '';
    for (let i = 0; i < values.length; i++) {
        output += strings[i] + values[i];
    }
    output += strings[values.length];

    // Split on newlines.
    let lines = output.split(/(?:\r\n|\n|\r)/);

    // Rip out the leading whitespace.
    return lines
        .map(line => {
            return line.replace(/^\s+/gm, '');
        })
        .join('')
        .trim();
};

window.responsive =
    window.getComputedStyle(document.body, ':after').getPropertyValue('content') == 'responsive';

$(window).on('resize', () => {
    let responsive =
        window.getComputedStyle(document.body, ':after').getPropertyValue('content') ==
        'responsive';

    if (window.responsive != responsive) {
        window.responsive = responsive;
        $(window).trigger('responsive.change');
    }
});

window.getScrollBarWidth = function() {
    let $outer = $('<div>')
            .css({visibility: 'hidden', width: 100, overflow: 'scroll'})
            .appendTo('body'),
        widthWithScroll = $('<div>')
            .css({width: '100%'})
            .appendTo($outer)
            .outerWidth();
    $outer.remove();
    return 100 - widthWithScroll;
};

window.showOnLoad = function(page, callback) {
    $(page.element).attr('style', '');

    if (!window.ActiveXObject && 'ActiveXObject' in window) {
        $('#mainbody').css({display: 'block'});
        $('.aside.page').css({display: 'block'});
    }

    if (typeof callback === 'function') {
        callback();
    }
};

window.isCurrentPage = function(pageids) {
    pager.activePage$(); // Listen to the active page observable

    if (typeof pageids === 'string') {
        pageids = [pageids];
    }

    return ko.computed(() => {
        return pageids.reduce((res, pageid) => {
            let page = pager.page.find(pageid);
            return res || page.isVisible();
        }, false);
    });
};

window.format_irr = function(n) {
    return n == undefined ? 'N/A' : `${(100 * n).format(2)}%`;
};
window.format_tvpi = function(n) {
    return n == undefined ? 'N/A' : `${n.format(2)}x`;
};

window.irr_css = function(irr, fl) {
    if (irr > 0) {
        return 'text-success';
    }
    return fl ? 'text-info' : 'text-danger';
};
window.tvpi_css = function(tvpi, fl) {
    if (tvpi > 1) {
        return 'text-success';
    }
    return fl ? 'text-info' : 'text-danger';
};

window.redirect = function(url) {
    window.location.href = url;
};

window.network_alert = false;

window.reset_network_alert = function() {
    if (window.network_alert && typeof window.network_alert.remove === 'function') {
        window.network_alert.remove();
    }
    window.network_alert = false;
};

window.show_network_alert = function() {
    if (!window.network_alert) {
        window.network_alert = bison.utils.Confirm(
            'Oops!',
            confimed => {
                if (confimed) {
                    window.location.reload(true);
                }
            },
            "We're having trouble communicating with the server. Please make sure your internet connection is working and reload the page.",
            'alert-danger',
            'Reload',
            'Dismiss',
            true,
        );
    }
};

pager.onBindingError.add(event => {
    if (window.console && window.console.error) {
        window.console.error(event);
    }
});

pager.afterShow.add(() => {
    $(window).trigger('resize');
    $('.tooltip').remove();
});
