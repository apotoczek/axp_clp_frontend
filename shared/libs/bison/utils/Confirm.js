/* Automatically transformed from AMD to ES6. Beware of code smell. */
import $ from 'jquery';

// send false in dismissable if you DON'T want the close box
export default function(
    message,
    callback,
    description,
    opt_type,
    confirm_text,
    cancel_text,
    top,
    auto_confirm,
) {
    if (message === undefined || callback === undefined) {
        return;
    }

    auto_confirm = auto_confirm || false;

    confirm_text = confirm_text || 'Confirm';

    cancel_text = cancel_text === false ? false : cancel_text || 'Cancel';

    let interval, type;

    if (typeof opt_type === 'string') {
        switch (opt_type) {
            case 'alert-info':
            case 'alert-success':
            case 'alert-error':
            case 'alert-warning':
            case 'alert-danger':
                type = opt_type;
                break;
        }
    } else {
        type = 'alert-info';
    }

    let $notify_container;

    if (top) {
        $notify_container = $('<div class="alert alert-top" style="display:none;"></div>');

        $notify_container.addClass(type);

        let message_html = `<strong>${message}</strong> `;

        if (description !== undefined) {
            message_html += description;
        }

        $notify_container.append(message_html);

        let $confirm_button = $(`<button class="btn btn-sm btn-confirm">${confirm_text}</button>`);

        if (auto_confirm && auto_confirm.timeout && auto_confirm.message) {
            let timer = parseInt(auto_confirm.timeout);

            let $timer = $(`<span>${timer}</span>`);

            let $auto_confirm = $(`<span> ${auto_confirm.message} </span>`);

            $auto_confirm.append($timer).append(' seconds.');

            interval = setInterval(() => {
                timer = timer - 1;
                $timer.text(timer);
                if (timer == 0) {
                    clearInterval(interval);
                    $confirm_button.click();
                }
            }, 1000);

            $notify_container.append($auto_confirm);
        }

        $confirm_button.click(() => {
            clearInterval(interval);

            callback(true);
            $notify_container.slideUp(300, () => {
                $notify_container.remove();
            });
        });

        if (cancel_text) {
            let $cancel_button = $(`<a class="link-cancel">${cancel_text}</a>`);
            $cancel_button.click(() => {
                clearInterval(interval);

                callback(false);
                $notify_container.slideUp(300, () => {
                    $notify_container.remove();
                });
            });

            $notify_container.append($cancel_button);
        }

        $notify_container.append($confirm_button);

        $('body').prepend($notify_container);
    } else {
        $notify_container = $('<div class="alert alert-modal" style="display:none;"></div>');

        $notify_container.addClass(type);
        $notify_container.append(`<strong>${message}</strong>`);

        if (description !== undefined) {
            $notify_container.append(`<div>${description}</div>`);
        }

        $notify_container.on('click', 'a[data-dismiss="confirm"]', () => {
            callback(true);
            $notify_container.remove();
        });

        $notify_container.on('click', 'a[data-dismiss="cancel"]', () => {
            callback(false);
            $notify_container.remove();
        });

        $notify_container.append('<hr class="clearfix">');

        let $confirm_button = $(`<button class="btn btn-sm btn-confirm">${confirm_text}</button>`);
        $confirm_button.click(() => {
            callback(true);
            $notify_container.slideUp(300, () => {
                $notify_container.remove();
            });
        });

        $notify_container.append($confirm_button);

        if (cancel_text) {
            let $cancel_button = $(`<a class="link-cancel">${cancel_text}</a>`);
            $cancel_button.click(() => {
                callback(false);
                $notify_container.slideUp(300, () => {
                    $notify_container.remove();
                });
            });

            $notify_container.append($cancel_button);
        }

        $('body').append($notify_container);
    }

    $notify_container.slideDown(300);

    return {
        remove: function() {
            clearInterval(interval);

            callback(false);
            $notify_container.slideUp(300, () => {
                $notify_container.remove();
            });
        },
    };
}
