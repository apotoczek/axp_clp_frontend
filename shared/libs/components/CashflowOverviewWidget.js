/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import CashflowChart from 'src/libs/components/charts/CashflowChart';
import NumberBox from 'src/libs/components/basic/NumberBox';
import MetricTable from 'src/libs/components/MetricTable';
import * as Formatters from 'src/libs/Formatters';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    self._template = opts.template || 'tpl_cashflow_overview_widget';
    self.expanded = ko.observable(false);
    self.template = ko.computed(() => {
        if (self.expanded()) {
            return 'tpl_cashflow_overview_widget_expanded';
        }
        return self._template;
    });

    self.cashflow_chart_height = opts.cashflow_chart_height || 300;
    self.cashflow_chart_legend = opts.cashflow_chart_legend || false;

    self.cashflow_type = opts.cashflow_type || 'net';

    self.irr_label = opts.irr_label || (self.cashflow_type == 'gross' ? 'Gross IRR' : 'Net IRR');

    self.entity = opts.entity;

    self.enable_actions = opts.enable_actions || false;

    self.css_style = opts.css_style;

    self.name = ko.computed(() => {
        let data = self.data();
        if (data) {
            return data.name;
        }
    });

    self.analytics_url = ko.computed(() => {
        if (self.entity) {
            return Formatters.entity_url(self.entity);
        }
    });

    opts.callouts = opts.callouts || [
        {
            label: self.irr_label,
            value_key: 'irr',
            format: 'irr_highlight',
        },
        {
            label: 'TVPI',
            value_key: 'tvpi',
            format: 'multiple_highlight',
        },
        {
            label: 'DPI',
            value_key: 'dpi',
            format: 'multiple_neutral',
        },
        {
            label: 'RVPI',
            value_key: 'rvpi',
            format: 'multiple_neutral',
        },
    ];

    opts.metrics = opts.metrics || [
        {
            label: 'Distributed',
            value_key: 'distributed',
            format: 'usd',
        },
        {
            label: 'Remaining (NAV)',
            value_key: 'nav',
            format: 'usd',
        },
        {
            label: 'Total Value',
            value_key: 'total_value',
            format: 'usd',
        },
        {
            label: 'Vintage Year',
            value_key: 'vintage_year',
        },
        {
            label: 'As of Date',
            value_key: 'as_of_date',
            format: 'backend_date',
        },
    ];

    if (opts.metrics) {
        self.metric_table = new MetricTable({
            template: opts.metric_table_template || 'tpl_metric_table',
            // css: opts.metric_table_css || { 'table-light': true },
            metrics: opts.metrics,
            data: self.data,
            loading: self.loading,
        });
    }

    self.cashflow_chart = new CashflowChart({
        template: opts.cashflow_chart_template || 'tpl_chart_box',
        height: self.cashflow_chart_height,
        data: ko.computed(() => {
            let data = self.data();
            if (data) {
                return data['chart_data'];
            }
            return [];
        }),
        exporting: opts.exporting || false,
        loading: self.loading,
        legend: self.cashflow_chart_legend,
    });

    self.callouts = [];

    self.init_callout = function(opts) {
        return new NumberBox({
            template: 'tpl_number_box',
            label: opts.label,
            format: opts.format,
            subtext: opts.subtext,
            data: ko.computed(() => {
                let data = self.data();
                if (data) {
                    return data[opts.value_key];
                }
            }),
            loading: self.loading,
        });
    };

    for (let i = 0, l = opts.callouts.length; i < l; i++) {
        self.callouts.push(self.init_callout(opts.callouts[i]));
    }

    return self;
}
