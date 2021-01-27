/* Automatically transformed from AMD to ES6. Beware of code smell. */
import $ from 'jquery';

export default function(message, description, opt_type, delay, callback, template) {
    if (typeof message === 'undefined') {
        if (typeof callback === 'function') {
            callback();
        }

        return;
    }

    let type = 'alert-danger';

    if (typeof opt_type === 'string') {
        switch (opt_type) {
            case 'alert-info':
            case 'alert-success':
            case 'alert-warning':
            case 'alert-danger':
            case 'alert-info-light':
                type = opt_type;
                break;
        }
    }

    let $notify_container;

    if (template) {
        $notify_container = $(template);
    } else {
        $notify_container = $(
            '<div class="system_notification alert alert-dismissable" style="display:none;"><button type="button" class="close" data-dismiss="alert">&times;</button></div>',
        );
    }

    $notify_container.addClass(type);
    $notify_container.append(`<strong>${message}</strong>`);

    if (typeof description != 'undefined') {
        $notify_container.append(` <span>${description}</span>`);
    }

    delay = typeof delay !== 'undefined' && delay > -1 ? delay : 3500;

    $('body').append($notify_container);
    $notify_container.slideDown();
    (function() {
        if (delay != 0) {
            $notify_container.slideUp(300, () => {
                $notify_container.remove();
            });
        }

        if (typeof callback === 'function') {
            callback();
        }
    }.delay(delay));
}
