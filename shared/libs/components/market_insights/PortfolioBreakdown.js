/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import NewDropdown from 'src/libs/components/basic/NewDropdown';
import TimeseriesChart from 'src/libs/components/charts/TimeseriesChart';
import Observer from 'src/libs/Observer';
import * as Utils from 'src/libs/Utils';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    let _dfd = self.new_deferred();

    self.template = opts.template || 'tpl_portfolio_breakdown';

    let breakdown_datasource = opts.breakdown_datasource || {};
    let performance_breakdown_datasource = opts.performance_breakdown_datasource || {};

    let breakdowns = [
        {
            value: undefined,
            label: 'None',
        },
        {
            value: 'geography',
            label: 'Geography',
        },
        {
            value: 'style',
            label: 'Style',
        },
        {
            value: 'investor_name',
            label: 'Investor',
        },
    ];

    let commitment_values = [
        {
            value: 'avg_commitment',
            label: 'Average',
        },
        {
            value: 'total_commitment',
            label: 'Total',
        },
    ];

    self.breakdown_dropdown = self.new_instance(NewDropdown, {
        id: 'breakdown_dropdown',
        default_selected_index: 0,
        options: breakdowns,
    });

    self.commitment_values_dropdown = self.new_instance(NewDropdown, {
        id: 'commitment_values_dropdown',
        default_selected_index: 0,
        options: commitment_values,
    });

    self.investments = self.new_instance(TimeseriesChart, {
        id: 'investments',
        exporting: true,
        format: 'number',
        datasource: Utils.deep_merge(breakdown_datasource, {
            query: {
                breakdown_key: {
                    type: 'observer',
                    event_type: Utils.gen_event('Dropdown.state', self.breakdown_dropdown.get_id()),
                    mapping: 'get_value',
                },
            },
        }),
    });

    self.commitments = self.new_instance(TimeseriesChart, {
        id: 'commitments',
        format: 'usd',
        exporting: true,
        datasource: Utils.deep_merge(breakdown_datasource, {
            query: {
                breakdown_key: {
                    type: 'observer',
                    event_type: Utils.gen_event('Dropdown.state', self.breakdown_dropdown.get_id()),
                    mapping: 'get_value',
                },
                val_key: {
                    type: 'observer',
                    event_type: Utils.gen_event(
                        'Dropdown.state',
                        self.commitment_values_dropdown.get_id(),
                    ),
                    mapping: 'get_value',
                    required: true,
                },
            },
        }),
    });

    self.performance = {
        irr: self.new_instance(TimeseriesChart, {
            id: 'performance_irr',
            format: 'irr',
            title: 'IRR',
            exporting: true,
            datasource: Utils.deep_merge(performance_breakdown_datasource, {
                key: 'irr',
                query: {
                    breakdown_key: {
                        type: 'observer',
                        event_type: Utils.gen_event(
                            'Dropdown.state',
                            self.breakdown_dropdown.get_id(),
                        ),
                        mapping: 'get_value',
                    },
                },
            }),
        }),
        tvpi: self.new_instance(TimeseriesChart, {
            id: 'performance_tvpi',
            format: 'multiple',
            title: 'TVPI',
            exporting: true,
            datasource: Utils.deep_merge(performance_breakdown_datasource, {
                key: 'multiple',
                query: {
                    breakdown_key: {
                        type: 'observer',
                        event_type: Utils.gen_event(
                            'Dropdown.state',
                            self.breakdown_dropdown.get_id(),
                        ),
                        mapping: 'get_value',
                    },
                },
            }),
        }),
    };

    self.chart_type = ko.observable();

    self.charts = ko.pureComputed(() => {
        let chart_type = self.chart_type();

        switch (chart_type) {
            case 'investments':
                return [self.investments];
            case 'commitments':
                return [self.commitments];
            case 'performance':
                return [self.performance.irr, self.performance.tvpi];
            default:
                return [];
        }
    });

    self.column_css = ko.pureComputed(() => {
        let chart_count = self.charts().length || 1;

        return `col-md-${12 / chart_count}`;
    });

    self.show_commitments_dropdown = ko.pureComputed(() => {
        return self.chart_type() == 'commitments';
    });

    Observer.register(opts.select_chart, e => {
        self.chart_type(Utils.get(e));
    });

    self.when(self.investments, self.commitments, self.performance).done(() => {
        _dfd.resolve();
    });

    return self;
}
