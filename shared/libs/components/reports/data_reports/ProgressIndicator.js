/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import Observer from 'src/libs/Observer';
import * as Utils from 'src/libs/Utils';
import * as Formatters from 'src/libs/Formatters';

class Status {
    constructor(task_uid, name) {
        this.task_uid = task_uid;
        this.name = name;

        let now = Utils.epoch();

        this.start_time = ko.observable(now);
        this.now = ko.observable(now);

        this.STATUS = {
            PENDING: Symbol('p'),
            FAILED: Symbol('f'),
        };

        this.status = ko.observable(this.STATUS.PENDING);
        this.error_text = ko.observable();

        this.is_failed = ko.pureComputed(() => {
            return this.status() === this.STATUS.FAILED;
        });

        this.is_pending = ko.pureComputed(() => {
            return this.status() === this.STATUS.PENDING;
        });

        this.status_text = ko.pureComputed(() => {
            if (this.is_pending()) {
                return 'Pending';
            } else if (this.is_failed()) {
                return 'Failed';
            }
            return 'Unknown';
        });

        this.seconds_elapsed = ko.pureComputed(() => {
            let elapsed_ms = this.now() - this.start_time();

            return Math.round(elapsed_ms / 1000);
        });

        this.start_time_text = ko.pureComputed(() => {
            return Formatters.local_datetime(this.start_time());
        });
    }

    set_error(error) {
        this.error_text(error);
        this.status(this.STATUS.FAILED);
    }
}

export default class ProgressIndicator extends BaseComponent {
    constructor(opts, components) {
        super(opts, components);

        let _dfd = this.new_deferred();

        this.title = opts.title || 'Pending';
        this.progress_update_event = opts.progress_update_event;

        this.define_default_template(`
                <!-- ko if: has_items -->
                    <!-- ko foreach: in_progress -->
                        <div data-bind="css: { 'widget-alert-success': is_pending(), 'widget-alert-error': is_failed() }">
                            <div class="row row-margins">
                                <div class="col-xs-4">
                                    <span data-bind="text: name"></span>
                                </div>
                                <div class="col-xs-4">
                                    <strong data-bind="text: status_text"></strong>
                                    <!-- ko if: is_pending -->
                                        - <span data-bind="text: seconds_elapsed"></span>s
                                    <!-- /ko -->
                                    <!-- ko if: is_failed -->
                                        - <span data-bind="text: error_text"></span>
                                    <!-- /ko -->
                                </div>
                                <div class="col-xs-4 text-right">
                                    <span data-bind="text: start_time_text, visible: is_pending"></span>
                                    <span class="glyphicon glyphicon-remove clickable" data-bind="visible: is_failed, click: $parent.dismiss"></span>
                                </div>
                            </div>
                        </div>
                    <!-- /ko -->
                <!-- /ko -->
            `);

        this._in_progress = ko.observable({});

        this.in_progress = ko.pureComputed(() => {
            return Object.values(this._in_progress());
        });

        this.has_items = ko.pureComputed(() => this.in_progress().length > 0);

        if (this.progress_update_event) {
            Observer.register(this.progress_update_event, payload => {
                this.progress_update(payload.task_uid, payload.action, {
                    error: payload.error,
                    name: payload.name,
                });
            });
        }

        setInterval(() => {
            this.time_update(Utils.epoch());
        }, 1000);

        _dfd.resolve();
    }

    time_update(now) {
        for (let status of Object.values(this._in_progress())) {
            status.now(now);
        }
    }

    progress_update(task_uid, action, kwargs) {
        let in_progress = this._in_progress();

        if (action === 'start') {
            in_progress[task_uid] = new Status(task_uid, kwargs.name);
        } else if (action === 'finish' && in_progress[task_uid]) {
            delete in_progress[task_uid];
        } else if (action === 'fail' && in_progress[task_uid]) {
            in_progress[task_uid].set_error(kwargs.error);
        } else if (action === 'dismiss') {
            delete in_progress[task_uid];
        }

        this._in_progress(in_progress);
    }

    dismiss(status) {
        this.progress_update(status.task_uid, 'dismiss');
    }
}
