import ko from 'knockout';
import bison from 'bison';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import DataTable from 'src/libs/components/basic/DataTable';
import DataThing from 'src/libs/DataThing';
import Observer from 'src/libs/Observer';
import DataSource from 'src/libs/DataSource';
import EventRegistry from 'src/libs/components/basic/EventRegistry';

class DetachDiligenceModal extends BaseComponent {
    constructor(opts = {}, components = {}) {
        super(opts, components);

        this.define_default_template(`
            <div class="modal fade" tabindex="-1" role="dialog" aria-hidden="true">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                            <h4 class="modal-title">Detach Funds from Existing Diligence Project</h4>
                        </div>
                        <div class="modal-body">
                            <p style="padding: 0 20px 10px;">
                                Funds
                            </p>
                            <!-- ko renderComponent: funds_table --><!-- /ko -->
                            <hr class="hr-small">
                            <hr class="transparent hr-small">
                            <p style="padding: 0 20px 10px;">
                                Projects
                            </p>
                            <!-- ko renderComponent: project_table --><!-- /ko -->
                            <hr class="transparent hr-small">
                            <button type="button" class="btn btn-cpanel-success"
                                data-bind="click: detach_from_diligence,
                                    css: { disabled: loading },
                                    enable: has_selected
                                    ">
                                <!-- ko if: loading -->
                                    <span class="glyphicon glyphicon-cog animate-spin"></span> Loading...
                                <!-- /ko -->
                                <!-- ko ifnot: loading -->
                                    Detach Funds from Diligence Project
                                <!-- /ko -->
                            </button>
                            <button type="button" class="btn btn-ghost-default" data-dismiss="modal" data-bind="css: { disabled: loading }">Cancel</button>
                        </div>
                    </div>
                </div>
            </div>
        `);

        this.from_diligence_search = opts.from_diligence_search;

        this.loading = ko.observable(false);

        this.events = this.new_instance(EventRegistry, {});
        this.events.resolve_and_add('selected', 'DataTable.selected');

        this._funds = ko.pureComputed(() => {
            let data = this.data();
            if (data) {
                return data.unique(data => {
                    return data.uid;
                });
            }
            return [];
        });

        this.funds = ko.pureComputed(() => {
            return this._funds();
        });

        this.fund_uids = ko.pureComputed(() => {
            const result = [];
            for (const fund of this._funds()) {
                if (this.from_diligence_search) {
                    result.append(fund.uid);
                } else {
                    result.append(fund.user_fund_uid);
                }
            }
            return result;
        });

        this.datasource = this.new_instance(DataSource, {
            datasource: {
                type: 'dynamic',
                query: {
                    target: 'diligence_list',
                },
                event_type: this.events.get('selected'),
            },
        });

        this.selected_entity = ko.observable();

        this.selected_entity_uid = ko.pureComputed(() => {
            return this.selected_entity() ? this.selected_entity().uid : '';
        });

        this.project_uids = ko.observable();

        this.has_selected = ko.observable();

        this.projects = ko.pureComputed(() => {
            const result = [];
            let data = this.datasource.data();
            let fund_uids = ko.unwrap(this.fund_uids);
            if (data) {
                for (const project of data.results) {
                    const project_fund_uids = [];
                    for (const fund of project.funds) {
                        project_fund_uids.append(fund.uid);
                    }
                    let contains_all_selected = fund_uids.every(uid => {
                        return project_fund_uids.indexOf(uid) >= 0;
                    });
                    if (contains_all_selected) {
                        result.append(project);
                    }
                }
                return result;
            }

            return [];
        });

        this.funds_table = this.new_instance(DataTable, {
            parent_id: this.get_id(),
            id: 'to_delete',
            results_per_page: 10,
            inline_data: true,
            css: 'table-light table-sm',
            data: this.funds,
            columns: [
                {
                    label: 'Name',
                    key: 'name',
                },
                {
                    label: 'Shared By',
                    key: 'shared_by',
                    format: 'strings',
                },
                {
                    label: 'Cashflow Type',
                    key: 'cashflow_type',
                    format: 'titleize',
                },
            ],
        });

        this.project_table = this.new_instance(DataTable, {
            parent_id: this.get_id(),
            data_table_id: this.data_table_id,
            id: 'selected',
            id_callback: this.events.register_alias('selected'),
            results_per_page: 10,
            inline_data: true,
            enable_selection: true,
            css: 'table-light table-sm',
            data: this.projects,
            columns: [
                {
                    label: 'Name',
                    key: 'name',
                },
                {
                    label: 'Created',
                    key: 'created',
                    format: 'backend_date',
                },
            ],
        });
        /********************************************************************
         * Modal functionality
         *******************************************************************/
        this.show = function() {
            bison.helpers.modal(this.template, this, this.get_id());
        };

        this.reset = function() {
            bison.helpers.close_modal(this.get_id());
            this.loading(false);
        };

        this._detach_funds_from_diligence = DataThing.backends.useractionhandler({
            url: 'detach_funds_from_diligence',
        });

        this.detach_from_diligence = function() {
            let entity_uids = this.fund_uids();
            if (this.selected_entity() || this.funds()) {
                let data = {
                    entity_uids: entity_uids,
                    project_uids: this.project_uids(),
                };
                this._detach_funds_from_diligence({
                    data: {
                        entity_uids: entity_uids,
                        project_uids: this.project_uids(),
                    },
                    success: DataThing.api.XHRSuccess(() => {
                        DataThing.status_check();
                        this.loading(false);
                        this.selected_entity('');
                        this.reset();
                    }),
                });

                Observer.broadcast_for_id(this.get_id(), 'detach_funds_from_diligence', data);
                Observer.broadcast_for_id(this.get_id(), 'selected', data);
                // clear out the modal
                Observer.broadcast_for_id(this.get_id(), 'close_modal', true);
            }
        };

        this.when(this.funds_table, this.project_table).done(() => {
            Observer.register(this.events.get('selected'), payload => {
                if (payload && payload.length > 0) {
                    let uids = payload.map(project => project.uid);
                    this.project_uids(uids);
                    return this.has_selected(true);
                }

                return this.has_selected(false);
            });
        });
    }
}

export default DetachDiligenceModal;
