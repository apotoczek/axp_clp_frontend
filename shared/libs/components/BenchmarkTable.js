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
            <table class="table table-bison metric-table" data-bind="with: table_data, css:css">
                <thead>
                    <tr data-bind="foreach: header">
                        <th class="table-lbl numeric">
                            <span data-bind="html: $data, define: { term: $data, placement: 'bottom' }"></span>
                        </th>
                    </tr>
                </thead>
                <tbody data-bind="foreach: rows">
                    <tr>
                        <td class="table-lbl">
                            <span data-bind="html: label, define: { term: label, placement: 'right' }"></span>
                        </td>
                        <!-- ko foreach: values -->
                        <td class="table-data numeric" data-bind="html: $data"></td>
                        <!-- /ko -->
                    </tr>
                </tbody>
            </table>
        `);

    self.css = opts.css || {
        'table-light': true,
    };

    self.show_fences = opts.show_fences === undefined ? true : opts.show_fences;

    self.metrics = opts.metrics || [
        {
            key: 'irr',
            label: 'IRR',
            format: 'irr',
        },
        {
            key: 'dpi',
            label: 'DPI',
            format: 'multiple',
        },
        {
            key: 'multiple',
            label: 'TVPI',
            format: 'multiple',
        },
    ];

    self.row_defs = opts.row_defs || [
        {
            label: 'Count',
            value_fn: function(data) {
                return data.count;
            },
        },
        {
            label: 'Upper Fence',
            is_fence: true,
            value_fn: function(data, formatter) {
                return formatter(data.fences.inner.upper);
            },
        },
        {
            label: 'Q1',
            value_fn: function(data, formatter) {
                return formatter(data.quartiles[2]);
            },
        },
        {
            label: 'Q2',
            value_fn: function(data, formatter) {
                return formatter(data.quartiles[1]);
            },
        },
        {
            label: 'Q3',
            value_fn: function(data, formatter) {
                return formatter(data.quartiles[0]);
            },
        },
        {
            label: 'Lower Fence',
            is_fence: true,
            value_fn: function(data, formatter) {
                return formatter(data.fences.inner.lower);
            },
        },
    ];

    if (opts.extra_row_defs) {
        self.row_defs.push(...opts.extra_row_defs);
    }

    if (!self.show_fences) {
        self.row_defs = self.row_defs.filter(def => {
            return !def.is_fence;
        });
    }

    self.table_data = ko.computed(() => {
        let data = self.data();
        let header = [''];
        let rows = [];

        for (let i = 0, l = self.row_defs.length; i < l; i++) {
            rows.push({
                label: ko.unwrap(self.row_defs[i].label),
                values: [],
            });
        }

        if (data) {
            for (let i = 0, l = self.metrics.length; i < l; i++) {
                let key = self.metrics[i].benchmark_key || self.metrics[i].key;
                if (key && data[key]) {
                    let formatter = Formatters.gen_formatter(self.metrics[i].format);

                    header.push(self.metrics[i].label);

                    for (let j = 0, l2 = self.row_defs.length; j < l2; j++) {
                        let value = self.row_defs[j].value_fn(data[key], formatter);

                        rows[j].values.push(value);
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
                export_type: 'analytics_benchmark_table',
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

        let export_data = self.table_data();

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
