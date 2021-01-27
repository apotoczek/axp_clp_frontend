/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import GrossTable from 'src/libs/components/GrossTable';
import ScoringChart from 'src/libs/components/charts/ScoringChart';
import MetricTimeseries from 'src/libs/components/charts/MetricTimeseries';
import EventRegistry from 'src/libs/components/basic/EventRegistry';
import RadioButtons from 'src/libs/components/basic/RadioButtons';
import Observer from 'src/libs/Observer';
import * as Formatters from 'src/libs/Formatters';
import * as Utils from 'src/libs/Utils';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    self.entity_type = opts.entity_type;
    self.entity_uid_event = opts.entity_uid_event;

    self.define_default_template(`
            <div class="big-message" data-bind="visible: loading">
                <span class="glyphicon glyphicon-cog animate-spin"></span>
                <h1>Loading..</h1>
            </div>
            <!-- ko if: !loading() && error() && error_template() -->
                <!-- ko template: error_template --><!-- /ko -->
            <!-- /ko -->
            <!-- ko if: !loading() && !error() -->
            <div data-bind="attr: { id: html_id() }">
            <!-- ko renderComponent: chart_toggle --><!-- /ko -->
                <div class="component-box">
                    <!-- ko if: active_component -->
                        <!-- ko renderComponent: active_component --><!-- /ko -->
                    <!-- /ko -->
                    <div data-bind='visible: !scoring_error()'>
                    <!-- ko template: {
                        name: 'tpl_data_table_standalone_pagination',
                        data: table
                    } --><!--/ko -->
                    </div>
                </div>
                <div class="page-break"></div>
                <!-- ko renderComponent: table --><!-- /ko -->
            </div>
            <!-- /ko -->
        `);

    self.data_mode = ko.observable(false);

    self.active_mode = ko.observable('snapshot');
    self.events = self.new_instance(EventRegistry, {});
    self.events.resolve_and_add('chart', 'ScoringChart.error', 'scoring_chart_error');
    self.events.resolve_and_add('chart_toggle', 'RadioButtons.state');
    self.scoring_error = Observer.observable(self.events.get('scoring_chart_error'), false);

    self.bubble_metric_event = opts.bubble_metric_event;
    self.base_metrics = opts.base_metrics;

    if (opts.set_mode_event) {
        Observer.register_for_id(self.get_id(), opts.set_mode_event, mode => {
            self.toggle_mode(mode);
        });
    }

    Observer.register(self.events.get('chart_toggle'), payload => {
        self.activate_mode(Utils.get(payload, 'value'));
    });

    self.toggle_mode = function(mode) {
        if (mode) {
            self.data_mode(mode === 'data');
        } else {
            self.data_mode(!self.data_mode());
        }
    };

    self.results_per_page_event = opts.results_per_page_event;

    self.breakdown_vehicles = ko.computed(() => {
        let data = self.data();

        if (data && data.items && data.items.length > 0) {
            return self.set_error(data.items);
        }

        return self.set_error([], 'no_group_values');
    });

    if (opts.register_export_event) {
        let export_csv_event = Utils.gen_event('GrossDealScoring.export', self.get_id());

        Observer.broadcast(
            opts.register_export_event,
            {
                title: 'Table',
                subtitle: 'CSV',
                type: 'Deal Scoring',
                event_type: export_csv_event,
            },
            true,
        );

        Observer.register(export_csv_event, () => {
            self.table.export_csv();
        });
    }
    self.chart_toggle = self.new_instance(RadioButtons, {
        id: 'chart_toggle',
        template: 'tpl_radio_buttons_tabs',
        id_callback: self.events.register_alias('chart_toggle'),
        default_state: 'snapshot',
        button_css: {
            'btn-block': true,
            'btn-transparent': true,
        },
        buttons: [
            {
                label: 'Snapshot',
                state: 'snapshot',
                icon: {'icon-chart-bar': true},
            },
            {
                label: 'Timeseries',
                state: 'timeseries',
                icon: {'icon-chart-line': true},
            },
        ],
    });

    self.render_currency = ko.computed(() => {
        let data = self.data();
        if (data) {
            return data.render_currency;
        }
    });

    self.metrics = self.base_metrics.map(metric => {
        const format = Formatters.format_for_key(metric.value);

        if (format) {
            return {
                ...metric,
                format,
            };
        }

        throw `No format associated with metric ${metric.value}`;
    });

    self.table = self.new_instance(GrossTable, {
        id: 'table',
        label: ko.computed(() => {
            let data = self.data();
            if (data && data.label) {
                return data.label;
            }

            return 'Deals';
        }),
        comp_color: '#61C38C',
        comps: ko.pureComputed(() => {
            let data = self.data();
            return data && data.overview ? [data.overview] : [];
        }),
        url: opts.url,
        set_order_event: opts.set_order_event,
        css: {'table-light': true, 'table-sm': true},
        data: self.breakdown_vehicles,
        enable_column_toggle: true,
        enable_clear_order: true,
        enable_localstorage: true,
        enable_csv_export: true,
        export_type: 'analytics_gross_deal_scoring_table',
        column_toggle_placement: 'left',
        loading: self.loading,
        results_per_page: 15,
        results_per_page_event: self.results_per_page_event,
        inline_data: true,
        entity_type: self.entity_type,
        entity_uid_event: self.entity_uid_event,
        include_aggregate_columns: true,
    });

    self.modes = {
        snapshot: self.new_instance(ScoringChart, {
            id: 'chart',
            id_callback: self.events.register_alias('chart'),
            bubble_metric_event: self.bubble_metric_event,
            data: self.table.rows,
            metrics: self.metrics,
            render_currency: self.render_currency,
        }),
        timeseries: self.new_instance(MetricTimeseries, {
            id: 'timeseries',
            format: 'irr',
            tvpi_key: 'tvpi',
            datasource: opts.timeseries_datasource,
            margin: '0 20px',
            auto_get_data: false,
        }),
    };

    self.activate_mode = function(mode) {
        if (mode in self.modes) {
            self.active_mode(mode);
        } else {
            self.active_mode(undefined);
        }
    };

    self._set_auto_get_data = function(mode, value) {
        if (mode == 'timeseries') {
            self.modes.timeseries.set_auto_get_data(value);
            self._auto_get_data = false;
        } else {
            self.modes.timeseries.set_auto_get_data(false);
            self._auto_get_data = value;
            if (value) {
                self.refresh_data();
            }
        }
    };

    self.set_auto_get_data = function(value) {
        self._set_auto_get_data(self.active_mode(), value);
    };

    self.active_mode.subscribe(mode => {
        self._set_auto_get_data(mode, true);
    });

    self.active_component = ko.pureComputed(() => {
        let mode = self.active_mode();

        if (mode) {
            return self.modes[mode];
        }
    });
    return self;
}
