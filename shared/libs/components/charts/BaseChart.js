/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import Observer from 'src/libs/Observer';
import * as Utils from 'src/libs/Utils';
import Customizations from 'src/libs/Customizations';

export default function(opts, components) {
    opts.height = opts.height || 400;
    opts.template = opts.template || 'tpl_chart';

    let self = new BaseComponent(opts, components);
    let _dfd = self.new_deferred();

    self.get_color = Customizations.get_color;
    self.get_color_set = Customizations.get_color_set;
    self.get_color_from_int = Customizations.get_color_from_int;
    self.use_custom_colors = Customizations.use_custom_colors;
    self.plotlines = opts.plotlines;

    self.datatable_page_event = opts.datatable_page_event;
    self.datatable_order_event = opts.datatable_order_event;
    self.label_in_chart = opts.label_in_chart;

    self._container_style = {};

    self.loading_style = {
        height: `${opts.height.toString()}px`,
        'padding-top': `${(opts.height / 2 - 20).toString()}px`,
    };

    if (opts.label && opts.label.subscribe && opts.label_in_chart) {
        self.label = opts.label();
        self.label_computed = opts.label;
    } else {
        self.label = opts.label;
    }

    if (opts.sublabel && opts.sublabel.subscribe && opts.label_in_chart) {
        self.sublabel = opts.sublabel();
        self.sublabel_computed = opts.sublabel;
    } else if (opts.sublabel_fn) {
        self.sublabel = opts.sublabel_fn(self.data());
        self.sublabel_computed = ko.pureComputed(() => opts.sublabel_fn(self.data()));
    } else {
        self.sublabel = opts.sublabel;
    }

    if (opts.y_label && opts.y_label.subscribe) {
        self.y_label = opts.y_label();
        self.y_label_computed = opts.y_label;
    } else {
        self.y_label = opts.y_label;
    }

    if (opts.x_label && opts.x_label.subscribe) {
        self.x_label = opts.x_label();
        self.x_label_computed = opts.x_label;
    } else {
        self.x_label = opts.x_label;
    }

    if (self.datatable_page_event) {
        Observer.register(self.datatable_page_event, page => {
            self.update_query({
                page: page,
            });
        });
    }

    if (self.datatable_order_event) {
        Observer.register(self.datatable_order_event, order => {
            self.update_query({
                order_by: order,
            });
        });
    }

    self.options = {
        colors: (opts.colors || ['first']).map(self.get_color),
        title: {
            text: opts.label_in_chart ? opts.label : null,
            style: {
                fontFamily: 'Lato',
                fontWeight: 200,
            },
        },
        subtitle: {
            text: opts.label_in_chart ? opts.sublabel : null,
            style: {
                fontFamily: 'Lato',
                fontWeight: 200,
            },
        },
        chart: {
            height: opts.height || 400,
            events: opts.highchart_callbacks,
            animation: opts.redraw_animations === undefined ? true : opts.redraw_animations,
        },
        xAxis: {
            title: {
                text: self.x_label || null,
            },
            labels: {
                style: {
                    fontSize: opts.axis_font_size || '10px',
                },
            },
        },
        yAxis: {
            title: {
                text: self.y_label || null,
            },
            labels: {
                style: {
                    fontSize: opts.axis_font_size || '10px',
                },
            },
        },
        plotOptions: {
            series: {
                animation: opts.animation === undefined ? false : opts.animation,
            },
        },
        legend: {
            enabled: opts.legend === undefined ? false : opts.legend,
            symbolRadius: 0,
        },
        credits: {
            enabled: opts.credits === undefined ? false : opts.credits,
        },
        exporting: {
            enabled: opts.exporting === undefined ? false : opts.exporting,
        },
        series: [],
        updateColorEvent: Utils.gen_event('UpdateChartColors', 'global'),
    };

    _dfd.resolve();

    return self;
}
