import BaseComponent from 'src/libs/components/basic/BaseComponent';
import DataThing from 'src/libs/DataThing';
import {backend_local_datetime} from 'src/libs/Formatters';
import ko from 'knockout';

class NotificationArea extends BaseComponent {
    constructor(opts, components) {
        super(opts, components);

        const _dfd = this.new_deferred();

        this.endpoints = {
            dismiss: DataThing.backends.reporting({
                url: 'actions/dismiss-notification',
            }),
        };

        this._dismissing = ko.observable(new Set());
        this.on_action = opts.on_action;

        this.notifications = this.data;

        this.define_template(`
            <div
                class="notification-area"
                data-bind="foreach: notifications"
            >
                <div class="notification" data-bind="visible: !$parent.dismissing(uid)">
                    <button
                        class="notification-btn"
                        data-bind="click: $parent.action, css: $parent.notification_css($data)"
                    >
                        <!-- ko if: style.icon -->
                            <span
                                class="glyphicon"
                                data-bind="css: $parent.icon_css($data)"
                            ></span>
                        <!-- /ko -->
                        {{{ action }}}
                    </button>
                    {{{ body }}}
                    <span class="notification-date">
                        {{{ $parent.format_date(created) }}}
                    </span>
                    <i
                        class="close icon-cancel-circled"
                        data-bind="click: $parent.dismiss"
                    ></i>
                </div>
            </div>
        `);

        _dfd.resolve();
    }

    dismissing(uid) {
        return this._dismissing().has(uid);
    }

    dismiss({uid}) {
        if (!this.dismissing(uid)) {
            this._dismissing().add(uid);
            this._dismissing.valueHasMutated();

            this.endpoints.dismiss({
                data: {
                    uid: uid,
                },
                success: DataThing.api.XHRSuccess(() => {
                    DataThing.status_check();
                }),
                error: DataThing.api.XHRError(() => {}),
            });
        }
    }

    format_date(date) {
        return backend_local_datetime(date);
    }

    action(notification) {
        if (notification.dismiss_on_action) {
            this.dismiss(notification);
        }

        this.on_action(notification);
    }

    icon_css({style}) {
        if (style.icon) {
            return {
                [`glyphicon-${style.icon}`]: true,
            };
        }
    }

    notification_css({style}) {
        return {
            'notification-btn-warning': style.type == 'warning',
            'notification-btn-info': style.type == 'info',
        };
    }
}

export default NotificationArea;
