import BaseComponent from 'src/libs/components/basic/BaseComponent';
import ko from 'knockout';
import * as Formatters from 'src/libs/Formatters';

import SegmentedTable from 'components/basic/SegmentedTable';

import 'src/libs/bindings/react';
export default class GroupedMetrics extends BaseComponent {
    constructor(opts, components) {
        super(opts, components);

        this.define_template(`
            <div data-bind="renderReactComponent: SegmentedTable, props: props" />
        `);

        this.enable_selection = opts.enable_selection;
        this.on_click_cell = opts.on_click_cell;
        this.table_css = opts.table_css || {'table-contrast-dark': true};

        this.SegmentedTable = SegmentedTable;

        this.selection = ko.observableArray([]);

        const default_color = '#107aa7';

        const color_by_version_name = {
            Actual: '#1ba1cc',
        };

        this.props = ko.pureComputed(() => {
            const data = this.data();
            const onSelectionChanged = selection => this.selection(selection);
            const onClickCell = this.on_click_cell;

            if (!data) {
                return {
                    onSelectionChanged,
                    onClickCell,
                    segments: [],
                    rows: [],
                    enableSelection: this.enable_selection,
                };
            }

            const segments = [
                {
                    key: 'metrics',
                    columns: [
                        {
                            key: 'metric_name',
                            label: 'Metric',
                            width: '10%',
                        },
                        {
                            key: 'time_frame',
                            label: 'Reporting Period',
                            formatter: row => Formatters.time_frame(row.time_frame),
                            width: '10%',
                        },
                    ],
                },
            ];

            const rows_by_key = {};
            const as_of_dates = {};

            for (const m of data.metrics) {
                if (!as_of_dates[m.version_name]) {
                    as_of_dates[m.version_name] = [];
                }

                if (as_of_dates[m.version_name].indexOf(m.as_of_date) === -1) {
                    as_of_dates[m.version_name].push(m.as_of_date);
                }

                const key = `${m.metric_name}-${m.time_frame}`;

                if (!rows_by_key[key]) {
                    rows_by_key[key] = {...m, mappings: []};
                }

                rows_by_key[key][m.as_of_date] = {
                    note: m.note,
                    mapping_idx: m.mapping_idx,
                    value: m.value,
                };
                rows_by_key[key].mappings.push(m.mapping_idx);
            }

            for (const [version, dates] of Object.entries(as_of_dates)) {
                const color = color_by_version_name[version] || default_color;

                segments.push({
                    label: version,
                    color: color,
                    key: version,
                    columns: dates.map(d => ({
                        key: `${d}`,
                        label: Formatters.backend_month_short(d),
                        textAlign: 'right',
                        formatter: row => {
                            const formatter = Formatters.gen_formatter(row.format);

                            if (row[d]) {
                                return formatter(row[d].value);
                            }
                        },
                        tooltipKey: `${d}:note`,
                    })),
                });
            }

            return {
                onSelectionChanged,
                onClickCell,
                segments,
                rows: Object.values(rows_by_key),
                enableSelection: this.enable_selection,
            };
        });
    }

    get_selected_metrics() {
        const data = this.data();
        const selected_groups = this.selection();

        const mappings = new Set(selected_groups.reduce((res, m) => [...res, ...m.mappings], []));

        return data.metrics.filter(m => mappings.has(m.mapping_idx));
    }
}
