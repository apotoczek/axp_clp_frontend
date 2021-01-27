/* Automatically transformed from AMD to ES6. Beware of code smell. */
/* eslint no-console: "off" */

import $ from 'jquery';
import * as Utils from 'src/libs/Utils';

export default function({id, callback, interval = 5000, idle_timeout = 10000, verbose = false}) {
    let self = {};

    self.id = id;
    self.verbose = verbose;

    self._callback = callback;

    self.interval = interval;
    self.idle_timeout = idle_timeout;

    self.interval_id = null;
    self.idle_timeout_id = null;
    self.last_callback = null;

    self.callback = function() {
        if (self.verbose) {
            console.log(`Callback id=${self.id} was called...`);
        }

        self.last_callback = Utils.epoch();
        self._callback();
    };

    self.disable_callback = function(reason) {
        if (self.verbose) {
            console.log(`Callback id=${self.id} disabled (${reason})...`);
        }

        clearInterval(self.interval_id);
        self.interval_id = null;
    };

    self.enable_callback = function(reason) {
        if (self.verbose) {
            console.log(`Callback id=${self.id} enabled (${reason})...`);
        }

        if (self.last_callback === null) {
            self.callback();
        } else if (self.last_callback + self.interval < Utils.epoch()) {
            self.callback();
        }

        if (self.interval_id === null) {
            self.interval_id = setInterval(self.callback, self.interval);
        }

        clearTimeout(self.idle_timeout_id);

        if (self.idle_timeout) {
            self.idle_timeout_id = setTimeout(() => {
                self.disable_callback('idle');
            }, self.idle_timeout);
        }
    };

    $(window).on('blur', () => {
        self.disable_callback('blur');
    });

    $(window).on('focus', () => {
        self.enable_callback('focus');
    });

    $(window).on('mousemove', () => {
        self.enable_callback('mousemove');
    });

    self.enable_callback('init');

    return self;
}
