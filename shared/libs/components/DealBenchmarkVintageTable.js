/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import config from 'config';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import * as Formatters from 'src/libs/Formatters';
import Observer from 'src/libs/Observer';
import DataThing from 'src/libs/DataThing';
import * as Utils from 'src/libs/Utils';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    self.define_template(`
            <div style="width:100%; overflow-x:scroll;" data-bind="visible:visible">
                <table class="table table-bison" data-bind="with: table_data, css: css">
                    <thead>
                        <tr data-bind="foreach: header">
                            <th class="table-lbl numeric">
                                <span style="font-weight:700;" data-bind="html: $data, define: { term: $data, placement: 'bottom' }"></span>
                            </th>
                        </tr>
                    </thead>
                    <tbody data-bind="foreach: rows">
                        <tr>
                            <td class="table-lbl">
                                <span data-bind="html: label, define: { term: label, placement: 'right' }"></span>
                            </td>
                            <!-- ko foreach: values -->
                                <td style="font-size:1em;" class="table-data numeric" data-bind="html: $data"></td>
                            <!-- /ko -->
                        </tr>
                    </tbody>
                </table>
                <div class="row">
                    <div class="col-xs-12 text-right">
                        <!-- ko if: enable_csv_export && export_csv -->
                            <button type="button" class="btn btn-white btn-sm" data-bind="click: export_csv, css: { disabled: export_loading }">
                                <!-- ko if: export_loading -->
                                    <span class="glyphicon glyphicon-cog animate-spin"></span> Exporting
                                <!-- /ko -->
                                <!-- ko ifnot: export_loading -->
                                    Export CSV
                                <!-- /ko -->
                            </button>
                        <!-- /ko -->
                    </div>
                </div>
            </div>
        `);

    self.css = opts.css || {
        'table-light': true,
    };
    self.visible = typeof opts.visible === 'undefined' ? true : opts.visible;
    self.enable_csv_export = opts.enable_csv_export;

    self.vertical = opts.vertical;

    self.show_fences = opts.show_fences === undefined ? true : opts.show_fences;
    self.default_metric = opts.default_metric;
    self.metric_key = ko.observable(self.default_metric);

    Observer.register(opts.metric_event, metric => {
        let metric_key = Utils.get(metric, 'value') || self.default_metric;
        self.metric_key(metric_key);
    });

    self.value_labels = ['Count', 'Mean', 'Upper Fence', 'Q1', 'Q2', 'Q3', 'Lower Fence'];

    if (!self.show_fences) {
        self.value_labels = self.value_labels.filter(label => {
            return label.indexOf('Fence') < 0;
        });
    }

    self.horizontal_data = function(data, value_labels, metric_key, formatter) {
        let header = [''];
        let rows = [];

        for (let i = 0, l = value_labels.length; i < l; i++) {
            rows.push({
                label: value_labels[i],
                values: [],
            });
        }

        if (data) {
            for (let i = 0, l = data.labels.length; i < l; i++) {
                header.push(data.labels[i]);
            }

            for (let x = 0, y = value_labels.length; x < y; x++) {
                for (let i = 0, l = data.labels.length; i < l; i++) {
                    let metrics = data.metrics[metric_key][i];
                    if (x == 0) {
                        rows[x].values.push(data.counts_by_metric[metric_key][i] || 0);
                    } else if (x == 1) {
                        rows[x].values.push(formatter(data.averages_by_metric[metric_key][i]));
                    } else {
                        if (metrics) {
                            rows[x].values.push(formatter(metrics[y - x - 1]));
                        } else {
                            rows[x].values.push(formatter(null));
                        }
                    }
                }
            }
        }

        if (opts.register_export) {
            let enable_export_item_event = Utils.gen_event(
                'DynamicActions.enabled',
                opts.register_export.export_event_id,
            );
            Observer.broadcast(enable_export_item_event, {
                enabled: rows.length > 0,
                title: opts.register_export.title,
                type: opts.register_export.type,
            });
        }

        return {
            header: header,
            rows: rows,
        };
    };

    self.invert_data = function(data) {
        let header = [''];

        for (let i = 0, l = data.rows.length; i < l; i++) {
            header.push(data.rows[i].label);
        }

        let rows = [];

        for (let i = 0, l = data.header.length - 1; i < l; i++) {
            let values = [];
            for (let j = 0, k = data.rows.length; j < k; j++) {
                values.push(data.rows[j].values[i]);
            }

            rows.push({
                label: data.header[i + 1],
                values: values,
            });
        }

        return {
            header: header,
            rows: rows,
        };
    };

    self.vertical_data = function(data, value_labels, metric_key, formatter) {
        return self.invert_data(self.horizontal_data(data, value_labels, metric_key, formatter));
    };

    self.table_data = ko.computed(() => {
        let data = self.data();
        let metric_key = self.metric_key();
        let formatter;

        if (metric_key == 'acq_avg_ownership' || metric_key == 'acq_ebitda_margin') {
            formatter = Formatters.gen_formatter({format: 'percent'});
        } else {
            formatter = Formatters.gen_formatter({format: 'multiple'});
        }

        if (self.vertical) {
            return self.vertical_data(data, self.value_labels, metric_key, formatter);
        }
        return self.horizontal_data(data, self.value_labels, metric_key, formatter);
    });

    self.export_loading = ko.observable(false);

    self._export_csv = function(data, callback) {
        let rows = [];

        rows.push(data.header);

        for (let i = 0, l = data.rows.length; i < l; i++) {
            let row = [];

            row.push(data.rows[i].label);

            for (let j = 0, k = data.rows[i].values.length; j < k; j++) {
                row.push(data.rows[i].values[j]);
            }

            rows.push(row);
        }

        self._prepare_csv({
            data: {
                rows: rows,
                export_type: 'deal_benchmark_vintage_table',
            },
            success: DataThing.api.XHRSuccess(key => {
                DataThing.form_post(config.download_csv_base + key);
                callback();
            }),
            error: DataThing.api.XHRError(() => {}),
        });
    };

    self._prepare_csv = DataThing.backends.useractionhandler({
        url: 'prepare_csv',
    });

    self.export_csv = function() {
        self.export_loading(true);

        let data = self.data();
        let metric_key = self.metric_key();
        let export_data;

        let formatter = function(x) {
            return x ? x.round(4) : x;
        };

        if (self.vertical) {
            export_data = self.vertical_data(data, self.value_labels, metric_key, formatter);
        } else {
            export_data = self.horizontal_data(data, self.value_labels, metric_key, formatter);
        }

        self._export_csv(export_data, () => {
            self.export_loading(false);
        });
    };

    if (opts.register_export) {
        let export_csv_event = Utils.gen_event('DataTable.export_csv', self.get_id());
        let exp = opts.register_export;
        let export_event = Utils.gen_event('DynamicActions.register_action', exp.export_event_id);

        Observer.broadcast(
            export_event,
            {
                title: exp.title,
                subtitle: exp.subtitle,
                type: exp.type,
                event_type: export_csv_event,
            },
            true,
        );

        Observer.register(export_csv_event, () => {
            self.export_csv();
        });
    }

    return self;
}
