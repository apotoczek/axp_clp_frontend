import DataThing from 'src/libs/DataThing';
import * as Utils from 'src/libs/Utils';
import ko from 'knockout';
import BaseModal from 'src/libs/components/basic/BaseModal';
import EventRegistry from 'src/libs/components/basic/EventRegistry';

class RenameDiligenceModal extends BaseModal {
    constructor(opts = {}, components = {}) {
        super(opts, components);

        const dfd = this.new_deferred();

        this.define_template(`
        <div class="modal fade" tabindex="-1" role="dialog" aria-hidden="true">
            <div class="modal-dialog modal-md">
                <div class="modal-content">
                    <div class="modal-header">
                        <h4 data-bind="text: modal_title"></h4>
                    </div>
                    <div class="modal-body">
                        <form data-bind="submit: on_submit">
                            <div class="form-group"
                                data-bind="css: { 'has-error': name_has_error }">
                                <label class="control-label" for="project-name">Rename project*</label>
                                <input class="form-control" id="project-name" type="text"
                                    data-bind="attr: { placeholder: initial_project_name}, textInput: name"/>
                            </div>
                            <div class="modal-footer">
                                <button
                                    type="button"
                                    class="btn btn-ghost-default"
                                    data-dismiss="modal"
                                    data-bind="css: { disabled: loading } ,
                                    click: cancel">
                                    Cancel
                                </button>
                                <button
                                    type="submit" class="btn btn-success"
                                    data-bind="
                                        css: { disabled: disable_submit },
                                        disable: disable_submit
                                    ">
                                    <!-- ko if: loading -->
                                        <span class="glyphicon glyphicon-cog animate-spin"></span>
                                        Loading...
                                    <!-- /ko -->
                                    <!-- ko ifnot: loading -->
                                        <span data-bind="text: submit_label"></span>
                                    <!-- /ko -->
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
        `);

        this.name = ko.observable();
        this.modal_title = opts.modal_title;
        this.submit_label = opts.submit_label || 'Save';

        this.events = this.new_instance(EventRegistry, {});
        this.events.resolve_and_add('selected', 'DataTable.selected');
        this.initial_project_name = ko.observable('');
        this.name_has_error = ko.pureComputed(
            () => Utils.is_set(this.name()) && this.name().length == 0,
        );

        // data from selected row in datatable
        this.selected = ko.computed(() => {
            let data = this.data();
            if (data && data.length > 0) {
                this.initial_project_name(data[0].name);
                return data[0].uid;
            }
            return [];
        });

        this._edit_project = DataThing.backends.useractionhandler({
            url: 'edit_project',
        });

        this.disable_submit = ko.pureComputed(
            () =>
                !Utils.is_set(this.name(), true) ||
                this.name().replace(/\s*/g, '').length == 0 ||
                this.loading(),
        );

        this.cancel = function() {
            this.name('');
            this.reset();
        };
        this.on_submit = function() {
            this._edit_project({
                data: {
                    name: this.name(),
                    project_uid: this.selected(),
                },
                success: DataThing.api.XHRSuccess(() => {
                    DataThing.status_check();
                    this.cancel();
                }),
                error: DataThing.api.XHRError(() => {
                    this.cancel();
                }),
            });
        };
        this.when().done(() => {
            dfd.resolve();
        });
    }
}

export default RenameDiligenceModal;
