/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import NewDropdown from 'src/libs/components/basic/NewDropdown';
import BarChart from 'src/libs/components/charts/BarChart';
import * as Formatters from 'src/libs/Formatters';
import * as Utils from 'src/libs/Utils';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    self.define_default_template(`
            <div class="allocations-controls">
                <!-- ko renderComponent: metric_dropdown --><!-- /ko -->
                by
                <!-- ko renderComponent: breakdown_dropdown --><!-- /ko -->
            </div>
            <div class="row" style="min-height:400px">
                <div class="col-xs-12">
                    <!-- ko renderComponent: chart --><!-- /ko -->
                </div>
            </div>
        `);

    let _dfd = self.new_deferred();

    self.investor_uid_event = opts.investor_uid_event;

    self.metrics = [
        {
            label: 'Investments',
            aggregation_type: 'count',
            value: 'investments',
            aggregation_key: undefined,
            percent: false,
        },
        {
            label: '% Investments',
            aggregation_type: 'count',
            value: 'percent_investments',
            aggregation_key: undefined,
            percent: true,
            format: 'percent',
        },
        {
            label: 'Commitment',
            aggregation_type: 'sum',
            value: 'commitments',
            aggregation_key: 'commitment_value_usd',
            percent: false,
            format: 'money',
        },
        {
            label: '% Commitment',
            aggregation_type: 'sum',
            value: 'percent_commitment',
            aggregation_key: 'commitment_value_usd',
            percent: true,
            format: 'percent',
        },
    ];

    self.breakdown_dropdown = self.new_instance(NewDropdown, {
        id: 'breakdown',
        default_selected_index: 0,
        datasource: {
            type: 'dynamic',
            query: {
                target: 'market_data:funds:breakdown_options',
            },
        },
        inline: true,
        min_width: '150px',
    });

    self.metric_dropdown = self.new_instance(NewDropdown, {
        id: 'metric',
        default_selected_index: 0,
        options: self.metrics,
        inline: true,
        min_width: '150px',
    });

    self.chart = self.new_instance(BarChart, {
        id: 'chart',
        y_label: ko.computed(() => {
            let selected = self.metric_dropdown.selected();

            if (selected) {
                return selected.label;
            }
        }),
        formatter: function(value) {
            let selected = self.metric_dropdown.selected();

            if (selected && selected.format) {
                let formatter = Formatters.gen_formatter(selected);
                return formatter(value);
            }

            return value;
        },
        datasource: {
            type: 'dynamic',
            query: {
                target: 'market_data:investments:aggregate',
                investor_uid: {
                    type: 'observer',
                    event_type: self.investor_uid_event,
                    required: true,
                },
                aggregation_type: {
                    type: 'observer',
                    mapping: 'get',
                    mapping_args: {
                        key: 'aggregation_type',
                    },
                    event_type: Utils.gen_event('Dropdown.state', self.metric_dropdown.get_id()),
                    required: true,
                },
                breakdown_key: {
                    type: 'observer',
                    mapping: 'get',
                    mapping_args: {
                        key: 'breakdown_key',
                    },
                    event_type: Utils.gen_event('Dropdown.state', self.breakdown_dropdown.get_id()),
                    required: true,
                },
                attribute_tree_limit: {
                    type: 'observer',
                    event_type: Utils.gen_event('Dropdown.state', self.breakdown_dropdown.get_id()),
                    mapping: 'get',
                    mapping_args: {
                        key: 'attribute_tree_limit',
                    },
                },
                aggregation_key: {
                    type: 'observer',
                    mapping: 'get',
                    mapping_args: {
                        key: 'aggregation_key',
                    },
                    event_type: Utils.gen_event('Dropdown.state', self.metric_dropdown.get_id()),
                },
                percent: {
                    type: 'observer',
                    mapping: 'get',
                    mapping_args: {
                        key: 'percent',
                    },
                    event_type: Utils.gen_event('Dropdown.state', self.metric_dropdown.get_id()),
                    default: false,
                },
            },
        },
    });

    self.when(self.breakdown_dropdown, self.metric_dropdown, self.chart).done(() => {
        _dfd.resolve();
    });

    return self;
}
