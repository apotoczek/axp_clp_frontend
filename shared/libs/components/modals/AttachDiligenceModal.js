import ko from 'knockout';
import bison from 'bison';
import pager from 'pager';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import DataTable from 'src/libs/components/basic/DataTable';
import DataThing from 'src/libs/DataThing';
import Observer from 'src/libs/Observer';
import * as Utils from 'src/libs/Utils';
import 'src/libs/bindings/typeahead';

class AttachDiligenceModal extends BaseComponent {
    constructor(opts = {}, components = {}) {
        super(opts, components);

        const dfd = this.new_deferred();

        this.define_template(`
            <div class="modal fade" tabindex="-1" role="dialog" aria-hidden="true">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                            <h4 class="modal-title">Attach Funds to Existing Diligence Project</h4>
                        </div>
                        <div class="modal-body">
                            <!-- ko renderComponent: funds_table --><!-- /ko -->
                            <hr class="hr-small">
                            <div class="fund-quick-search">
                            <input class="form-control"  type="text" data-bind="
                                typeahead: typeahead_options,
                                attr:{placeholder:placeholder}"
                                style="position: relative"/>
                            </div>
                            <hr class="transparent hr-small">
                            <button type="button" class="btn btn-cpanel-success"
                                data-bind="click: attach_to_diligence,
                                css: { disabled: loading }">
                                <!-- ko if: loading -->
                                    <span class="glyphicon glyphicon-cog animate-spin"></span> Loading...
                                <!-- /ko -->
                                <!-- ko ifnot: loading -->
                                    Attach Funds to Diligence Project
                                <!-- /ko -->
                            </button>
                            <button type="button" class="btn btn-ghost-default" data-dismiss="modal" data-bind="css: { disabled: loading }">Cancel</button>
                        </div>
                    </div>
                </div>
            </div>
        `);

        this.loading = ko.observable(false);
        let selected_entity = ko.observable();
        this.columns = opts.columns;
        this.entity_type = opts.entity_type;
        this.reroute_to_diligence = opts.reroute_to_diligence;
        this.funds = ko.computed(() => {
            let data = this.data();

            if (data) {
                if (Object.isArray(data)) {
                    return data;
                }
                return [data];
            }

            return [];
        });

        this.most_common_cashflow_type = ko.computed(() => {
            return Utils.mode(this.funds(), fund => {
                return fund.cashflow_type;
            });
        });

        this.cashflow_type = ko.computed(() => {
            let cashflow_type = this.most_common_cashflow_type();
            if (cashflow_type) {
                return cashflow_type.titleize();
            }
        });

        this.selected_entity_uid = ko.computed(() => {
            return selected_entity() ? selected_entity().uid : '';
        });

        this.funds_to_be_added = ko.computed(() => {
            let cashflow_type = this.most_common_cashflow_type();

            return this.funds().filter(fund => {
                return fund.cashflow_type === cashflow_type;
            });
        });

        this.typeahead_options = {
            minLength: 1,
            datasets: {
                source: function(query, callback) {
                    DataThing.get({
                        params: {
                            target: 'diligence_list',
                            results_per_page: 5,
                        },
                        success: function(data) {
                            if (data.results) {
                                callback(data.results);
                            }
                        },
                        error: function() {},
                    });
                },
                templates: {
                    suggestion: function(data) {
                        return `<strong>${data.name}</strong>`;
                    },
                },
            },
            on_select: function(event, vehicle) {
                selected_entity(vehicle);
            },
        };

        this.placeholder = ko.computed(() => {
            const default_placeholder = 'Search for diligence project to attach fund to';
            return selected_entity() ? selected_entity().name : default_placeholder.titleize();
        });

        this.funds_table = this.new_instance(DataTable, {
            parent_id: this.get_id(),
            id: 'to_delete',
            results_per_page: 10,
            inline_data: true,
            css: 'table-light table-sm',
            data: this.funds_to_be_added,
            columns: this.columns || [
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

        this._attach_funds_to_diligence = DataThing.backends.useractionhandler({
            url: 'attach_funds_to_diligence',
        });

        this.attach_to_diligence = function() {
            let user_fund_uids = this.funds_to_be_added()
                .map(fund => fund.user_fund_uid)
                .filter(a => !!a);
            let prod_fund_uids = this.funds_to_be_added().map(fund => fund.uid);
            if (selected_entity()) {
                let data = {
                    project_uid: this.selected_entity_uid(),
                };
                if (this.entity_type === 'bison_fund') {
                    data.prod_fund_uids = prod_fund_uids;
                } else {
                    data.user_fund_uids = user_fund_uids;
                }
                this._attach_funds_to_diligence({
                    data: data,
                    success: DataThing.api.XHRSuccess(() => {
                        DataThing.status_check();
                        this.loading(false);
                        selected_entity('');
                        this.reset();
                        if (this.reroute_to_diligence) {
                            pager.navigate('#!/diligence');
                        }
                    }),
                });
                Observer.broadcast_for_id(this.get_id(), 'attach_funds_to_diligence', data);

                // clear out the modal
                Observer.broadcast_for_id(this.get_id(), 'close_modal', true);
            }
        };

        this.when().done(() => {
            dfd.resolve();
        });
    }
}

export default AttachDiligenceModal;
