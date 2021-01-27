import BaseModal from 'src/libs/components/basic/BaseModal';
import ko from 'knockout';
import DataThing from 'src/libs/DataThing';
import {METRIC_VERSION_TYPES} from 'src/libs/Constants';
import NewDropdown from 'src/libs/components/basic/NewDropdown';

class MetricVersionModal extends BaseModal {
    constructor(opts, components) {
        super(opts, components);

        const _dfd = this.new_deferred();
        this.define_template(`
        <div class="modal fade" tabindex="-1" role="dialog" aria-hidden="true">
            <div class="modal-dialog modal-md">
                <div class="modal-content">
                    <div class="modal-header">
                        <h4 data-bind="text: title"></h4>
                    </div>
                    <div class="modal-body">
                        <h5>VERSION NAME</h5>
                        <input class="form-control" type="text" data-bind="textInput: metric_version_name"/>
                        <h5>VERSION TYPE</h5>
                        <!-- ko renderComponent: version_type --><!-- /ko -->
                        <h5>DESCRIPTION</h5>
                        <textarea
                        id="list-description"
                        data-bind="textInput: description"
                        class="form-control"
                        rows="5"></textarea>
                        <label>
                            <input type="checkbox" data-bind="checked: metric_version_default"> Is Default version</input>
                        </label>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-success" data-bind="click:save">Save</button>
                        <button class="btn btn-ghost-default" data-bind="click:cancel">Cancel</button>
                    </div>
                </div>
            </div>
        </div>
        `);

        this.metric_version_name = ko.observable('');
        this.description = ko.observable('');
        this.metric_version_uid = ko.observable();
        this.metric_version_default = ko.observable(false);

        this.version_type = this.new_instance(NewDropdown, {
            default_selected_index: 0,
            options: METRIC_VERSION_TYPES,
        });

        this.edit_mode = opts.edit_mode || false;
        this.title = opts.title;

        this._create = DataThing.backends.useractionhandler({
            url: 'create_metric_version',
        });

        this._update = DataThing.backends.useractionhandler({
            url: 'update_metric_version',
        });

        this.show_and_populate = data => {
            this.metric_version_name(data.name);
            this.description(data.description);
            this.metric_version_uid(data.uid);
            this.metric_version_default(data.default_version);
            this.version_type.set_selected_by_value(data.version_type);
            this.show();
        };

        this.save = () => {
            if (this.edit_mode) {
                this._update({
                    data: {
                        uid: this.metric_version_uid(),
                        attributes: {
                            name: this.metric_version_name(),
                            description: this.description(),
                            version_type: this.version_type.selected_value(),
                        },
                        default_version: this.metric_version_default(),
                    },
                    success: DataThing.api.XHRSuccess(() => {
                        DataThing.status_check();
                        this.cancel();
                    }),
                    error: DataThing.api.XHRError(() => {}),
                });
            } else {
                this._create({
                    data: {
                        name: this.metric_version_name(),
                        description: this.description(),
                        default_version: this.metric_version_default(),
                        version_type: this.version_type.selected_value(),
                    },
                    success: DataThing.api.XHRSuccess(() => {
                        DataThing.status_check();
                        this.cancel();
                    }),
                    error: DataThing.api.XHRError(() => {}),
                });
            }
        };
        this.cancel = () => {
            this.metric_version_name('');
            this.metric_version_default(false);
            this.version_type.clear();
            this.reset();
        };
        _dfd.resolve();
    }
}
export default MetricVersionModal;
