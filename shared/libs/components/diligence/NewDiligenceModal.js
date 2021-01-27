import DataThing from 'src/libs/DataThing';
import * as Utils from 'src/libs/Utils';
import ko from 'knockout';
import pager from 'pager';
import BaseModal from 'src/libs/components/basic/BaseModal';
import DataTable from 'src/libs/components/basic/DataTable';
import EventRegistry from 'src/libs/components/basic/EventRegistry';

class NewDiligenceModal extends BaseModal {
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
                                <label class="control-label" for="project-name">Project name*</label>
                                <input class="form-control" id="project-name" type="text"
                                    data-bind="textInput: name"/>
                            </div>
                            <div data-bind="visible: selected_funds().length > 0">
                                <hr class="transparent hr-small">
                                <p style="padding: 0 20px 10px;">
                                    Included Funds
                                </p>
                                <!-- ko renderComponent: funds_table --><!-- /ko -->
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
        this.modal_title = opts.modal_title || 'Create new diligence project';
        this.submit_label = opts.submit_label || 'Save';
        this.datasource = opts.datasource || false;

        this.selected_funds = ko.pureComputed(() => {
            let data = this.data();
            if (data && data.length > 0) {
                return data;
            }
            return [];
        });
        this.events = this.new_instance(EventRegistry, {});
        this.events.resolve_and_add('selected', 'DataTable.selected');

        this.name_has_error = ko.pureComputed(
            () => Utils.is_set(this.name()) && this.name().length == 0,
        );

        this.columns = opts.columns || [
            {
                label: 'Name',
                key: 'name',
            },
            {
                label: 'Created',
                key: 'created',
                format: 'backend_date',
            },
        ];

        this.funds_table = this.new_instance(DataTable, {
            id: 'to_add',
            id_callback: this.events.register_alias('to_add'),
            results_per_page: 5,
            inline_data: true,
            css: 'table-light table-sm',
            data: this.selected_funds,
            dynamic_columns: {
                data: ko.pureComputed(() => {
                    return this.columns.map(column => {
                        return {
                            key: column.key,
                            label: column.label,
                            format: column.format,
                        };
                    });
                }),
            },
            columns: [],
        });

        this._create_project = DataThing.backends.useractionhandler({
            url: 'create_project',
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
            let user_fund_uids = this.selected_funds()
                .map(fund => fund.user_fund_uid)
                .filter(a => a);
            /*
            An external datasource (this.datasource) declared in other components and passed through
            into NewDiligenceModal (e.g. trigger_modal object) is currently understood to be proddata
            funds and this function will collect their uids to be copied into userdata and added to
            a newly generated diligence project upon submission.
            */
            let prod_fund_uids = [];
            if (this.datasource) {
                prod_fund_uids = this.selected_funds()
                    .map(fund => fund.uid)
                    .filter(a => a);
            }
            this._create_project({
                data: {
                    project_data: {
                        name: this.name(),
                        user_fund_uids: user_fund_uids,
                        prod_fund_uids: prod_fund_uids,
                        monitoring: false,
                    },
                },
                success: DataThing.api.XHRSuccess(() => {
                    DataThing.status_check();
                    this.cancel();
                    pager.navigate('#!/diligence');
                }),
                error: DataThing.api.XHRError(() => {}),
            });
        };
        this.when(this.funds_table).done(() => {
            dfd.resolve();
        });
    }
}

export default NewDiligenceModal;
