import {html} from 'common-tags';
import DataTable from 'src/libs/components/basic/DataTable';
import Observer from 'src/libs/Observer';
import ko from 'knockout';
import * as Formatters from 'src/libs/Formatters';
import {is_set} from 'src/libs/Utils';
import DataThing from 'src/libs/DataThing';
import config from 'config';

class DiligenceDataTable extends DataTable {
    constructor(opts = {}, components = {}) {
        super(opts, components);
        const dfd = this.new_deferred();
        this.diligence_rows = ko.observableArray([]);
        this._dropdown_columns = opts.dropdown_columns || [];
        this.view_details_event = opts.view_details_event;
        this.download_attachment = opts.download_attachment;
        this.dropdown_data_list = opts.dropdown_data_list;
        this.click_row_expand = opts.click_row_expand || false;
        this.dropdown_css = opts.dropdown_css;
        this.dropdown_enable_selection = opts.dropdown_enable_selection;
        this.dropdown_empty_template = opts.dropdown_empty_template;
        this.dropdown_row_key = opts.dropdown_row_key;
        this.enable_fund_creation = opts.enable_fund_creation || false;
        this.compact_columns_event = opts.compact_columns_event;
        this.compact_columns = ko.observable(false);

        let static_formatters = {
            percent: Formatters.gen_formatter({format: 'percent'}),
            multiple: Formatters.gen_formatter({format: 'multiple'}),
            entity_type: Formatters.gen_formatter('entity_type'),
            integer: Formatters.gen_formatter({format: 'number', format_args: {decimals: 0}}),
            float: Formatters.gen_formatter({format: 'number', format_args: {decimals: 2}}),
            boolean_highlight: Formatters.gen_formatter({format: 'boolean_highlight'}),
            boolean: Formatters.gen_formatter({format: 'boolean'}),
            backend_date: Formatters.gen_formatter({format: 'backend_date'}),
        };

        const formatter_for_column = (column, fund) => {
            if (!column.format) {
                return null;
            }

            if (column.format === 'money') {
                const currency = fund[column.format_args.currency_key] || 'USD';
                return Formatters.gen_formatter({
                    format: 'money',
                    format_args: {render_currency: currency},
                });
            }

            return static_formatters[column.format];
        };

        this.dropdown_columns = ko.pureComputed(() => this._calculate_dropdown_columns());

        this.rows.subscribe(rows => {
            // Filters the dropdown columns -
            // absolute mess.
            for (const row of rows) {
                for (const fund of row.funds) {
                    for (const column of this.dropdown_columns()) {
                        const column_formatter = formatter_for_column(column, fund);

                        fund[`${column.key}_format`] = column_formatter
                            ? column_formatter(fund[column.key])
                            : fund[column.key];
                    }
                }
            }
            this.diligence_rows(
                rows.map(r => {
                    r.dropdown_table_visible = ko.observable(false);
                    return r;
                }),
            );
        });

        this.template = html`
            <!-- ko if: !hide_empty() && visible-->
            <!-- ko if: label -->
            <div class="row data-table-header">
                <div class="col-xs-12 col-md-6 text-left" style="padding: 10px 15px;">
                    <span data-bind="html: label" style="font-weight: 300;color: #555;"> </span>
                    <!-- ko if: !loading() && has_rows() -->
                    <span
                        data-bind="html: page_info"
                        style="font-size: 12px; font-weight: 300;color: #999;"
                    ></span>
                    <!-- /ko -->
                </div>
                <div class="col-xs-12 col-md-6 text-right" style="padding: 10px 15px;">
                    <!-- ko if: enable_clear_order && has_order()-->
                    <a
                        data-bind="click: clear_order"
                        class="table-clear-order clickable"
                        style="font-size:12px; margin-right:10px;"
                    >
                        Clear Order
                    </a>
                    <!-- /ko -->
                    <!-- ko if: enable_column_toggle -->
                    <!-- ko renderComponent: visible_columns --><!-- /ko -->
                    <!-- /ko -->
                </div>
            </div>
            <!-- /ko -->
            <div class="table-responsive full-height" data-bind="style: { overflow: overflow }">
                <table
                    class="table table-bison"
                    data-bind="css: css, fixedTableHeader: $data, visible: has_rows() && !loading()"
                >
                    <thead data-bind="visible: (has_rows && !hide_header)">
                        <tr>
                            <!-- ko if: enable_selection && !radio_selection-->
                            <th
                                style="width: 1%"
                                data-bind="css: { clickable: $parent.enable_selection }"
                                class="no-selection"
                            >
                                <div class="round-checkbox">
                                    <input
                                        type="checkbox"
                                        data-bind="checked: toggle_select_visible, attr: { id: checkbox_id }"
                                    />
                                    <label data-bind="attr: { for: checkbox_id }"></label>
                                </div>
                            </th>
                            <!-- /ko -->
                            <!-- ko if: !enable_selection || radio_selection -->
                            <th style="width: 1%;"></th>
                            <!-- /ko -->
                            <!-- ko ifnot: compact_columns -->
                            <!-- ko foreach: columns -->
                            <th
                                data-bind="click: $parent.toggle_order, css: css, style: { width: $data.width }"
                            >
                                <span
                                    data-bind="html: label, css: sort_icon, define: { term: label, placement: 'bottom', definition: definition }"
                                ></span>
                            </th>
                            <!-- /ko -->
                            <!-- /ko -->
                            <!-- ko if: compact_columns -->
                            <!-- ko foreach: columns -->
                            <th
                                data-bind="click: $parent.toggle_order, css: css, style: { width: $data.width }"
                                class="compacted"
                            >
                                <span
                                    data-bind="html: label, css: sort_icon, define: { term: label, placement: 'bottom', definition: definition }"
                                ></span>
                            </th>
                            <!-- /ko -->
                            <!-- /ko -->
                            <!-- ko if: enable_clear_order && has_order() && !label-->
                            <th style="width: 1%">
                                <a data-bind="click: clear_order" class="table-clear-order">
                                    <span class="glyphicon glyphicon-remove"></span>
                                </a>
                            </th>
                            <!-- /ko -->
                            <!-- ko if: enable_column_toggle && !label -->
                            <th style="width: 1%" data-bind="with: visible_columns">
                                <div style="position: relative;">
                                    <!-- ko renderComponent: $data --><!-- /ko -->
                                </div>
                            </th>
                            <!-- /ko -->
                            <th data-bind="visible: $data.click_row_expand"></th>
                        </tr>
                    </thead>
                    <tbody data-bind="foreachWithLength: { data: diligence_rows, as: 'row' }">
                        <tr
                            data-bind="css: { dropped-down: dropdown_table_visible}, style: { cursor: $parent.click_row_expand ? 'pointer' : 'auto' },click:$parent.row_click "
                        >
                            <!-- ko if: $parent.enable_selection -->
                            <td
                                data-bind="click: $parent.toggle_select, event_horizon: true, css: { clickable: $parent.enable_selection }"
                                class="no-selection"
                            >
                                <div class="round-checkbox">
                                    <input
                                        type="checkbox"
                                        data-bind="checked: $parent.is_selected(row)"
                                    />
                                    <label for="checkboxInput"></label>
                                </div>
                            </td>
                            <!-- /ko -->
                            <!-- ko ifnot: $parent.enable_selection -->
                            <td></td>
                            <!-- /ko -->

                            <!-- ko foreach: { data: $parent.columns, as: 'column' } -->
                            <!-- ko if: column.component -->
                            <!-- ko with: column.gen_instance(row, $parentContext.$index(), $parentContext.$length) -->
                            <td data-bind="renderComponent: $data, css: column.css"></td>
                            <!-- /ko -->
                            <!-- /ko -->
                            <!-- ko ifnot: column.component -->
                            <td
                                data-bind="html: column.gen_cell(row), css: column.css, style: { color: $parent.is_comps ? $parents[2].comp_color || row.color : undefined }"
                            ></td>
                            <!-- /ko -->

                            <!-- /ko -->
                            <!-- ko if: $parent.enable_clear_order && $parent.has_order() && !$parent.label -->

                            <!-- /ko -->
                            <!-- ko if: $parent.enable_column_toggle && !$parent.label -->
                            <td></td>
                            <!-- /ko -->

                            <td data-bind="visible: $parent.click_row_expand">
                                <!-- ko ifnot: dropdown_table_visible -->
                                <span class="glyphicon glyphicon-menu-down"></span>
                                <!-- /ko -->
                                <!-- ko if: dropdown_table_visible -->
                                <span class="glyphicon glyphicon-menu-up"></span>
                                <!-- /ko -->
                            </td>
                        </tr>

                        <tr data-bind="if: dropdown_table_visible">
                            <!-- ko if: $data[$parent.dropdown_data_list].length > 0 -->
                            <td></td>
                            <td colspan="100">
                                <table
                                    class="table table-bison"
                                    data-bind="css: $parent.dropdown_css"
                                >
                                    <thead>
                                        <tr>
                                            <!-- ko if: $parent.dropdown_enable_selection -->
                                            <th width="15px"></th>
                                            <!-- /ko -->
                                            <!-- ko foreach:{data: $parent.dropdown_columns, as: 'dropdown_column' }-->
                                            <th data-bind="if: dropdown_column.visible">
                                                <span
                                                    data-bind="html: dropdown_column.label"
                                                ></span>
                                            </th>
                                            <!-- /ko -->
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <!-- ko foreach: { data: $data[$parent.dropdown_data_list], as: 'dropdown' }-->
                                        <tr>
                                            <!-- ko if: $parents[1].dropdown_enable_selection -->
                                            <td
                                                width="15px"
                                                data-bind="click: $parents[1].toggle_select_inner_row, css: { clickable: $parents[1].dropdown_enable_selection }"
                                                class="no-selection"
                                            >
                                                <div class="round-checkbox">
                                                    <input
                                                        type="checkbox"
                                                        data-bind="checked: $parents[1].is_selected_inner_row(dropdown)"
                                                    />
                                                    <label for="checkboxInput"></label>
                                                </div>
                                            </td>
                                            <!-- /ko -->
                                            <!-- ko foreach:{data: $parents[1].dropdown_columns, as: 'dropdown_column' }-->
                                            <td data-bind="if: dropdown_column.visible">
                                                <!-- ko if: dropdown_column.url -->
                                                <!-- ko if: dropdown.uf_type -->
                                                <a
                                                    data-bind="html: dropdown[dropdown_column.key], attr:{href:dropdown_column.url + row.uid + '/' + dropdown.uid + '/' + dropdown.uf_type + '/analytics'}"
                                                ></a>
                                                <!-- /ko -->
                                                <!-- ko ifnot: dropdown.uf_type -->
                                                <a
                                                    data-bind="html: dropdown[dropdown_column.key], attr:{href:dropdown_column.url + dropdown.uid}"
                                                ></a>
                                                <!-- /ko -->
                                                <!-- /ko -->
                                                <!-- ko ifnot: dropdown_column.url -->
                                                <span
                                                    data-bind="html: dropdown[dropdown_column.key + '_format']"
                                                ></span>
                                                <!-- /ko -->
                                            </td>
                                            <!-- /ko -->
                                        </tr>
                                        <!-- /ko -->
                                        <tr>
                                            <!-- ko if: $parent.enable_fund_creation -->
                                            <td colspan="100" style="background-color:#eceff4">
                                                <div>
                                                    <a
                                                        data-bind="attr: {href:'#!/provisional-fund/' + $data.uid}"
                                                    >
                                                        <button
                                                            type="button"
                                                            class="btn btn-default btn-sm pull-right"
                                                        >
                                                            Edit Fund Performance
                                                        </button>
                                                    </a>
                                                </div>
                                            </td>
                                            <!-- /ko -->
                                        </tr>
                                    </tbody>
                                </table>
                            </td>
                            <!-- /ko -->
                            <!-- ko ifnot: $data[$parent.dropdown_data_list].length > 0 -->
                            <td></td>
                            <td colspan="100">
                                <div
                                    data-bind="template: {
                                        name: $parent.dropdown_empty_template,
                                        data: $parent,
                                    }"
                                ></div>
                            </td>
                            <!-- /ko -->
                        </tr>
                    </tbody>
                </table>
                <div
                    data-bind="visible: loading, template: {
                            name: loading_template,
                            data: $data,
                        }"
                ></div>
                <div class="row" data-bind="visible: has_rows() && !loading()">
                    <div class="col-xs-12 col-md-2 text-left"></div>
                    <div class="col-xs-12 col-md-8 text-center">
                        <div
                            data-bind="visible: has_pages, template: {
                                    name: pagination_template,
                                    data: $data,
                                }"
                        ></div>
                    </div>
                    <div class="col-xs-12 col-md-2 text-right">
                        <!-- ko if: enable_csv_export && export_csv -->
                        <button
                            type="button"
                            class="btn btn-white btn-sm"
                            data-bind="click: export_csv, css: { disabled: export_loading }"
                        >
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
                <div
                    data-bind="visible: !has_rows() && !loading(), template: {
                            name: empty_template,
                            data: $data,
                        }"
                ></div>
            </div>
            <!-- /ko -->
        `;

        if (this.click_row_expand) {
            Observer.register_for_id(this.get_id(), 'DataTable.click_row', row => {
                row.dropdown_table_visible(!row.dropdown_table_visible());
            });
        }

        if (this.compact_columns_event) {
            Observer.register(this.compact_columns_event, compacted => {
                this.compact_columns(compacted);
            });
        }

        if (this.view_details_event) {
            Observer.register(this.view_details_event, row => {
                row.dropdown_table_visible(!row.dropdown_table_visible());
            });
        }

        if (this.download_attachment) {
            Observer.register(this.download_attachment, data => {
                DataThing.get({
                    params: {
                        target: 'market_data:family',
                        uid: data.uid,
                    },
                    success: result => {
                        let asset_uid = result.attachment[0].asset_uid;
                        let doc_uid = result.attachment[0].uid;
                        if (data && asset_uid && doc_uid) {
                            let download_attachment = DataThing.backends.download({
                                url: 'download_attachment',
                            });
                            download_attachment({
                                data: {
                                    uid: doc_uid,
                                    asset_uid: asset_uid,
                                },
                                success: DataThing.api.XHRSuccess(key => {
                                    DataThing.form_post(config.download_pdf_base + key);
                                }),
                                error: DataThing.api.XHRError(() => {}),
                            });
                        }
                    },
                    error: err => {
                        console.log('error', err);
                    },
                });
            });
        }

        this._selected_dropdown = ko.observable({});

        this._selected_dropdown.subscribe(() => {
            this.broadcast_selected_inner_rows();
        });

        dfd.resolve();
    }

    _inner_rows(rows) {
        let expanded_rows = [];
        for (let row of rows) {
            expanded_rows.append(row.funds);
        }
        return expanded_rows;
    }

    is_selected_inner_row(row) {
        return !!this._selected_dropdown()[row[this.dropdown_row_key]];
    }

    get_selected_inner_rows() {
        let selected = this._selected_dropdown();
        let dropdown_rows = this._inner_rows(this.rows());
        return dropdown_rows.filter(row => selected[row[this.dropdown_row_key]]);
    }

    broadcast_selected_inner_rows() {
        Observer.broadcast_for_id(
            this.get_id(),
            'DataTable.selected_dropdown',
            this.get_selected_inner_rows(),
        );
    }

    toggle_select_inner_row(row) {
        let selected = this._selected_dropdown();
        if (this.is_selected_inner_row(row)) {
            delete selected[ko.unwrap(row[this.dropdown_row_key])];
        } else {
            selected[ko.unwrap(row[this.dropdown_row_key])] = true;
        }

        this._selected_dropdown(selected);
        this._selected_dropdown.valueHasMutated();

        return true;
    }

    _calculate_dropdown_columns() {
        return this._dropdown_columns.map(column => {
            return {
                ...column,
                visible: is_set(column.visible) ? column.visible : true,
            };
        });
    }
}
export default DiligenceDataTable;
