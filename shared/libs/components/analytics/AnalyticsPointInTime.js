/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import DataTable from 'src/libs/components/basic/DataTable';
import PointInTimeChart from 'src/libs/components/charts/PointInTimeChart';
import PointInTimeBox from 'src/libs/components/PointInTimeBox';
import Observer from 'src/libs/Observer';
import * as Utils from 'src/libs/Utils';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    self.define_template(`
            <div class="big-message" data-bind="visible: loading">
                <span class="glyphicon glyphicon-cog animate-spin"></span>
                <h1>Loading..</h1>
            </div>
            <!-- ko if: !loading() && error() && error_template() -->
                <!-- ko template: error_template --><!-- /ko -->
            <!-- /ko -->
            <div data-bind="visible: !loading() && !error(), attr: { id: html_id() }">
                <div class="row">
                    <div class="col-xs-12">
                        <div class="col-xs-3">
                            <div data-bind="renderComponent: box.callout"></div>
                        </div>
                        <div class="col-xs-3">
                            <div data-bind="renderComponent: box.callout2"></div>
                        </div>
                    </div>
                </div>
                <div class="row">
                    <div class="col-xs-12 col-md-6 text-center">
                        <div data-bind="with: box" style="padding:0px 20px 10px; margin: 0px 15px;">
                            <div data-bind="renderComponent: metric_table"></div>
                        </div>
                    </div>
                    <div data-bind="visible: missing_navs_table.data" class="col-xs-6 number-box">
                            <span class="text-muted number-highlight">The quarterly TWRR chart can not be displayed. Please add the missing NAVs listed below.</span>
                        </div>
                    <!-- ko ifnot: missing_navs_table.data -->
                    <div class="col-xs-12 col-md-6">
                        <div style="margin:-40px 0px 20px;">
                            <div data-bind="renderComponent: chart"></div>
                        </div>
                    </div>
                    <!-- /ko -->
                </div>

                <!-- ko if: period_table.data -->
                    <!-- ko renderComponent: period_table --><!-- /ko -->
                <!-- /ko -->
                <!-- ko if: missing_navs_table.data -->
                    <!-- ko renderComponent: missing_navs_table --><!-- /ko -->
                <!-- /ko -->
            </div>
        `);

    if (opts.register_export_event) {
        let export_csv_event = Utils.gen_event('AnalyticsPointInTime.export', self.get_id());

        Observer.broadcast(
            opts.register_export_event,
            {
                title: 'Holding Periods',
                subtitle: 'CSV',
                type: 'Point in Time',
                event_type: export_csv_event,
            },
            true,
        );

        Observer.register(export_csv_event, () => {
            self.period_table.export_csv();
        });
    }

    if (opts.request_data_event) {
        self.request_data_event = opts.request_data_event;
        Observer.register(self.request_data_event, action => {
            let data = {
                data: self.data(),
            };
            Observer.broadcast_for_id(self.get_id(), 'Report.data_snapshot', {
                id: self.id,
                data: data,
                action: action,
            });
        });
    }

    if (opts.restore_data_event) {
        self.restore_data_event = opts.restore_data_event;
        Observer.register(self.restore_data_event, data => {
            if (data.id == self.id) {
                self.data(data.data);
            }
        });
    }

    self.box = self.new_instance(PointInTimeBox, {
        data: self.data,
        loading: self.loading,
    });

    self.chart = self.new_instance(PointInTimeChart, {
        render_currency: ko.pureComputed(() => {
            let data = self.data();
            if (data) {
                return data.render_currency;
            }
        }),
        label: 'Total Value across Rate of Return',
        label_in_chart: true,
        data: self.data,
        loading: self.loading,
        exporting: true,
    });

    self.missing_navs_table = self.new_instance(DataTable, {
        css: {'table-light': true, 'table-sm': true},
        inline_data: true,
        results_per_page: 15,
        enable_clear_order: true,
        row_key: 'fund_name',
        columns: [
            {
                label: 'Fund',
                format: 'link',
                format_args: {
                    base_url: '#!/data-manager/vehicles/fund/net',
                    label_key: 'fund_name',
                    url_key: 'user_fund_uid',
                },
            },
            {
                label: 'NAVs required',
                key: 'missing_navs',
                format: 'strings',
                format_args: {
                    len: 5,
                },
            },
        ],
        data: ko.pureComputed(() => {
            let data = self.data();

            if (data && data.error_code == 'missing_navs' && data.error_data) {
                return data.error_data.funds || [];
            }
        }),
    });

    self.period_table = self.new_instance(DataTable, {
        css: {'table-light': true, 'table-sm': true},
        inline_data: true,
        results_per_page: 15,
        enable_clear_order: true,
        enable_csv_export: true,
        export_type: 'analytics_point_in_time',
        row_key: 'start',
        columns: [
            {
                label: 'Holding Period',
                sort_key: 'start',
                type: 'string',
                format: 'backend_date_range',
                definition: 'Sub period for Time-Weighted Rate of Return',
            },
            {
                label: 'Start NAV',
                format: 'money',
                format_args: {
                    currency_key: 'render_currency',
                    value_key: 'start_nav',
                },
            },
            {
                label: 'End NAV',
                format: 'money',
                format_args: {
                    currency_key: 'render_currency',
                    value_key: 'end_nav',
                },
            },
            {
                label: 'Paid In',
                format: 'money',
                format_args: {
                    currency_key: 'render_currency',
                    value_key: 'contrib',
                },
                definition: 'Capital Committed / Paid In during the specified holding period.',
            },
            {
                label: 'Distributed',
                format: 'money',
                format_args: {
                    currency_key: 'render_currency',
                    value_key: 'distrib',
                },
                definition: 'Capital distributed during the specified holding period.',
            },
            {
                label: 'Rate of Return',
                key: 'hpr',
                format: 'percent_highlight_delta',
                type: 'numeric',
                definition: 'Rate of Return for the specified Holding Period',
            },
        ],
        data: ko.pureComputed(() => {
            let data = self.data();

            if (data && data.error_data) {
                return undefined;
            }

            if (data && data.periods) {
                for (let i = 0; i < data.periods.length; i++) {
                    data.periods[i].render_currency = data.render_currency;
                }
                return data.periods;
            }
            return [];
        }),
    });

    return self;
}
