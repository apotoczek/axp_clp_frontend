/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import * as Constants from 'src/libs/Constants';
import * as Utils from 'src/libs/Utils';
import * as Formatters from 'src/libs/Formatters';

export default function(opts) {
    let self = new BaseComponent(opts);

    self.define_template(`
            <div class="row" data-bind="foreach: stats_layout" style="margin-top:30px;">
                <div class="col-md-12">
                    <table class="table" >
                        <tbody data-bind="foreach: $data">
                            <tr>
                                <td style="padding:0px;">
                                    <table class="table table-bison table-light metric-table"  style="border-bottom:0px; margin-bottom:0px;">
                                        <tbody>
                                            <tr>
                                                <td class="table-lbl">
                                                    <span data-bind="text: label"></span>
                                                </td>
                                                <td class="table-data text-right" data-bind="html: value"></td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `);

    let _dfd = self.new_deferred();

    self.stats = ko.computed(() => {
        return self.data();
    });

    self.cashflow_type = opts.cashflow_type || 'net';
    self.entity_type = opts.entity_type || 'user_fund';

    self.row_factory = function(label, key, formatter) {
        formatter = formatter || Utils.identity;

        return ko.computed(() => {
            let value = Utils.recursive_get(self.stats(), key.split('.'));

            return {
                label: label,
                value: value ? formatter(value) : Constants.not_applicable_html,
            };
        });
    };

    self.contributions = self.row_factory('Contributions', 'cashflow_counts.contributions');
    self.distributions = self.row_factory('Distributions', 'cashflow_counts.distributions');
    self.navs = self.row_factory('NAVs', 'cashflow_counts.navs');
    self.total_cashflows = self.row_factory('Total Cash Flows', 'cashflow_counts.total');

    self.latest_date = self.row_factory('Latest Date', 'latest_date', Formatters.backend_date);
    self.latest_nav = self.row_factory('Latest NAV', 'latest_nav', Formatters.backend_date);

    self.fund_count = self.row_factory('Fund Count', 'fund_count');
    self.company_count = self.row_factory('Company Count', 'company_count');

    self.stats_layout = [
        [
            {
                label: 'Entity Type',
                value: Formatters.entity_type(self.entity_type),
            },
            self.latest_date,
            self.latest_nav,

            {
                label: 'Cash Flow Type',
                value: self.cashflow_type.titleize(),
            },
            self.total_cashflows,
            self.contributions,
            self.distributions,
            self.navs,
        ],
    ];

    if (self.entity_type == 'portfolio') {
        self.stats_layout[0].splice(3, 0, self.fund_count);
        if (self.cashflow_type == 'gross') {
            self.stats_layout[0].splice(4, 0, self.company_count);
        }
    } else if (self.entity_type == 'user_fund' && self.cashflow_type == 'gross') {
        self.stats_layout[0].splice(3, 0, self.company_count);
    }

    _dfd.resolve();

    return self;
}
