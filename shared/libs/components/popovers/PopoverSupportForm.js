import ko from 'knockout';
import bison from 'bison';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import * as Utils from 'src/libs/Utils';
import Observer from 'src/libs/Observer';
import DataThing from 'src/libs/DataThing';

export default class PopoverSupportForm extends BaseComponent {
    constructor(opts, components) {
        super(opts, components);

        let _dfd = this.new_deferred();

        this.text = ko.observable('');
        this.hide_event = opts.hide_event;
        this.entity = opts.entity;

        this.define_template(`
            <div data-bind="event_horizon:true" class="clearfix" style="margin-bottom: 10px;">
                <h5 style="color: #607EC5;">Describe your issue<h5>
                <form>
                    <textarea size="500" maxlength="255" style="resize:none;width:300px; height:125px;" placeholder="Issue..." data-bind="textInput: text" class="form-control input-sm"></textarea>
                    <button class="btn btn-sm btn-cpanel-success pull-right" style="margin-top:5px;margin-bottom:5px;" data-bind="click: submit">Send Request</button>
                </form>
            </div>
        `);

        this.submit_endpoint = DataThing.backends.useractionhandler({
            url: 'support_form',
        });

        this.clear = function() {
            if (this.hide_event) {
                Observer.broadcast(this.hide_event);
            }
            this.text('');
        };

        _dfd.resolve();
    }

    submit = () => {
        let pixel_ratio = window.devicePixelRatio || 1;
        let resolution;

        if (screen && screen.width && screen.height) {
            resolution = `${screen.width * pixel_ratio}x${screen.height * pixel_ratio}`;
        }

        let data = {
            text: this.text(),
            url: window.location.href,
            browser: Utils.browser(),
            dimensions: `${window.innerWidth}x${window.innerHeight}`,
            pixel_ratio: pixel_ratio,
            resolution: resolution,
            os: Utils.os(),
        };

        if (DataThing.errors.length) {
            data.errors = DataThing.errors;
        }

        let entity = this.entity();

        if (entity && entity['uid'] && entity['entity_type']) {
            data.entity = {
                uid: entity['uid'],
                type: entity['entity_type'],
                name: entity['name'],
            };
        }

        this.submit_endpoint({
            data: data,
            success: DataThing.api.XHRSuccess(() => {
                this.clear();
                bison.utils.Notify(
                    'Submitted!',
                    "Your request has been sent to our support team and you'll be contacted shortly.",
                    'alert-success',
                );
            }),
        });

        this.clear();
    };
}
