/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import bison from 'bison';
import pager from 'pager';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import DataTable from 'src/libs/components/basic/DataTable';
import * as Formatters from 'src/libs/Formatters';
import DataThing from 'src/libs/DataThing';
import * as Utils from 'src/libs/Utils';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    self.define_default_template(`
            <div class="modal fade" tabindex="-1" role="dialog" aria-hidden="true">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                            <h4 class="modal-title">Create Portfolio</h4>
                        </div>
                        <div class="modal-body">
                            <!-- ko renderComponent: table --><!-- /ko -->
                            <hr class="transparent hr-small">
                            <p style="padding: 0 10px 20px;">
                                <span data-bind="text: funds_to_be_added_pct"></span> of the funds you selected have <strong><span data-bind="text: cashflow_type"></span> Cash Flows</strong>. Are you sure you want to create a <strong><span data-bind="text: cashflow_type"></span> Portfolio</strong> from these funds?<br />
                                    <em>Funds not in the table above have the wrong cash flow type and will not be included.</em>
                            </p>
                            <hr class="transparent hr-small">
                            <button type="button" class="btn btn-cpanel-success" data-bind="click: create_portfolio, css: { disabled: loading }">
                                <!-- ko if: loading -->
                                    <span class="glyphicon glyphicon-cog animate-spin"></span> Loading...
                                <!-- /ko -->
                                <!-- ko ifnot: loading -->
                                    Create Portfolio
                                <!-- /ko -->
                            </button>
                            <button type="button" class="btn btn-ghost-default" data-dismiss="modal" data-bind="css: { disabled: loading }">Cancel</button>
                        </div>
                    </div>
                </div>
            </div>
        `);

    self.loading = ko.observable(false);

    /********************************************************************
     * Table of stuff to be deleted
     *******************************************************************/

    self.funds = ko.computed(() => {
        let data = self.data();

        if (data) {
            if (Object.isArray(data)) {
                return data;
            }

            return [data];
        }

        return [];
    });

    self.most_common_cashflow_type = ko.computed(() => {
        return Utils.mode(self.funds(), fund => {
            return fund.cashflow_type;
        });
    });

    self.cashflow_type = ko.computed(() => {
        let cashflow_type = self.most_common_cashflow_type();
        if (cashflow_type) {
            return cashflow_type.titleize();
        }
    });

    self.funds_to_be_added = ko.computed(() => {
        let cashflow_type = self.most_common_cashflow_type();

        return self.funds().filter(fund => {
            return fund.cashflow_type === cashflow_type;
        });
    });

    self.funds_to_be_added_pct = ko.computed(() => {
        return Formatters.percent(self.funds_to_be_added().length / self.funds().length);
    });

    self.table = self.new_instance(DataTable, {
        parent_id: self.get_id(),
        id: 'to_delete',
        results_per_page: 10,
        inline_data: true,
        css: 'table-light table-sm',
        data: self.funds_to_be_added,
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

    /********************************************************************
     * Modal functionality
     *******************************************************************/

    self.show = function() {
        bison.helpers.modal(self.template, self, self.get_id());
    };

    self.reset = function() {
        bison.helpers.close_modal(self.get_id());
        self.loading(false);
    };

    self._ensure_portfolio_and_add_funds = DataThing.backends.useractionhandler({
        url: 'ensure_portfolio_and_add_funds',
    });

    self.create_portfolio = function() {
        self.loading(true);
        let user_fund_uids = self.funds_to_be_added().map(fund => {
            return Utils.get_vehicle_uid(fund);
        });

        self._ensure_portfolio_and_add_funds({
            data: {
                user_fund_uids: user_fund_uids,
                cashflow_type: self.most_common_cashflow_type(),
            },
            success: DataThing.api.XHRSuccess(response => {
                self.loading(false);
                self.reset();

                let url = Formatters.entity_edit_url({
                    entity_type: 'portfolio',
                    portfolio_uid: response.portfolio.uid,
                    cashflow_type: response.portfolio.cashflow_type,
                });

                if (url) {
                    pager.navigate(url);
                }
            }),
            error: DataThing.api.XHRError(() => {
                self.loading(false);
                self.reset();
            }),
        });
    };

    return self;
}
