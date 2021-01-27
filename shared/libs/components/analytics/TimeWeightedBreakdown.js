/* Automatically transformed from AMD to ES6. Beware of code smell. */
import GroupedBarChart from 'src/libs/components/charts/GroupedBarChart';
import * as Formatters from 'src/libs/Formatters';
import DataSource from 'src/libs/DataSource';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import Aside from 'src/libs/components/basic/Aside';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    let _dfd = self.new_deferred();

    self.reset_event = opts.reset_event;
    self.base_query = opts.base_query;
    self.chart_height = opts.chart_height;

    self.template = opts.template || 'tpl_market_insights_body';

    self.formatter = function(value) {
        let formatter = Formatters.gen_formatter(self.format());

        return formatter(value);
    };

    self.css_style = opts.css_style;

    if (self.base_query) {
        self._datasource = {
            type: 'dynamic',
            query: {
                ...self.base_query,
                target: 'vehicle:time_weighted_breakdown',
            },
        };
    } else {
        self._datasource = undefined;
    }

    self.datasource = self.new_instance(DataSource, {
        auto_get_data: self._auto_get_data,
        datasource: self._datasource,
    });

    self.set_auto_get_data = value => {
        self.datasource.set_auto_get_data(value);
    };

    self.hide_label = typeof opts.hide_label != undefined ? opts.hide_label : false;

    self.chart = {
        id: 'chart',
        dependencies: [self.datasource.get_id()],
        template: 'tpl_chart_box',
        component: GroupedBarChart,
        label: self.hide_label ? '' : 'Time-Weighted Breakdown',
        label_in_chart: true,
        format: 'percent',
        height: self.chart_height,
        data: self.datasource.data,
    };

    self.body = self.new_instance(Aside, {
        id: 'body',
        template: 'tpl_aside_body',
        layout: {
            body: ['chart'],
        },
        components: [self.chart],
    });

    self.add_dependency(self.datasource);

    self.when(self.datasource, self.body).done(() => {
        // Observer.register(self.reset_event, function() {
        //     self.reset();
        // });

        _dfd.resolve();
    });

    return self;
}
