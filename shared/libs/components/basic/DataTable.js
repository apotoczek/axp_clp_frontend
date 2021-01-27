/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import $ from 'jquery';
import bison from 'bison';
import config from 'config';
import SortHeader from 'src/libs/components/basic/SortHeader';
import DataSource from 'src/libs/DataSource';
import Observer from 'src/libs/Observer';
import CompSet from 'src/libs/components/CompSet';
import * as Utils from 'src/libs/Utils';
import DataThing from 'src/libs/DataThing';

export default class DataTable extends SortHeader {
    constructor(opts = {}, components = {}) {
        super(opts, components);

        let _dfd = this.new_deferred();

        this.template = opts.template || 'tpl_data_table';
        this.render_currency = opts.render_currency;
        this.loading_template = opts.loading_template || 'tpl_data_table_default_loading';
        this.pagination_template = opts.pagination_template || 'tpl_data_table_default_pagination';
        this.empty_template = opts.empty_template || 'tpl_data_table_default_empty';
        this.results_per_page_event = opts.results_per_page_event;
        this.results_per_page_default = opts.results_per_page_default || 50;
        this.broadcast_page_rows = opts.broadcast_page_rows || false;
        this.broadcast_page_change = opts.broadcast_page_change || false;
        this.broadcast_order_change = opts.broadcast_order_change || false;
        this.hide_header = typeof opts.hide_header !== 'undefined' ? opts.hide_header : false;

        this.row_click_callback = opts.row_click_callback;

        this.pagination_pages = opts.pagination_pages || 9;

        this.inline_data = opts.inline_data || false;
        this.fixed_header = opts.fixed_header || false;

        this.label = opts.label || false;
        this.export_type = opts.export_type || undefined;

        this.css = opts.css || {'table-dark': true, 'table-sm': true};
        this.comp_color = opts.comp_color;

        this.overflow = opts.overflow || 'auto';
        this.hide_empty = ko.observable(false);

        this.checkbox_id = Utils.html_id(bison.helpers.uuid());

        if (opts.comps) {
            this.comps = opts.comps;
        } else if (opts.compset) {
            this.compset = this.new_instance(CompSet, opts.compset);
            this.comps = this.compset.comps;

            this.add_dependency(this.compset);
        } else {
            this.comps = [];
        }

        this.enable_selection = opts.enable_selection || false;
        this.radio_selection = opts.radio_selection || false;
        this.radio_selection_allow_empty = opts.radio_selection_allow_empty || false;
        this.enable_column_toggle = opts.enable_column_toggle || false;
        this.enable_clear_order = opts.enable_clear_order || false;
        this.enable_csv_export = opts.enable_csv_export || false;

        this.results_per_page = ko.observable(opts.results_per_page || 50);

        this.page = ko.observable(0);

        this.export_loading = ko.observable(false);

        this._prepare_csv = DataThing.backends.useractionhandler({
            url: 'prepare_csv',
        });

        if (this.inline_data) {
            this.sorted_data = ko.pureComputed(() => {
                let data = this.data();

                if (data && data.length > 0) {
                    let order_by = this.order()
                        .clone()
                        .reverse();

                    for (let item of order_by) {
                        data = data.mergeSort(
                            Utils.gen_sort_comp_fn(item.name, item.sort === 'desc'),
                        );
                    }

                    return data;
                }

                return [];
            });
            this.rows = ko.pureComputed(() => {
                let data = this.sorted_data();
                let limit = this.results_per_page();

                if (limit === 'all') {
                    limit = data.length;
                }

                let offset = this.page() * limit;

                if (data && data.length > 0) {
                    return data.slice(offset, offset + limit);
                }

                return [];
            });

            this.count = ko.pureComputed(() => {
                let data = this.data();
                if (data) {
                    return data.length;
                }
                return 0;
            });

            this.all = this.sorted_data;
        } else {
            this.rows = ko.pureComputed(() => {
                let data = this.data();

                if (data && data.results) {
                    return data.results;
                }

                return [];
            });

            this.count = ko.pureComputed(() => {
                let data = this.data();
                if (data && data.count !== undefined) {
                    return data.count;
                } else if (data && data.meta && data.meta.count !== undefined) {
                    return data.meta.count;
                }
                return 0;
            });

            if (opts.datasource) {
                this.all_results = this.new_instance(DataSource, {
                    datasource: opts.datasource,
                    auto_get_data: false,
                });

                this.all_results.update_query({
                    results_per_page: 'all',
                    export_csv: true,
                });

                this.all = ko.pureComputed(() => {
                    let data = this.all_results.data();
                    if (data && data.results) {
                        return data.results;
                    }
                    return [];
                });
            }
        }

        this.has_rows = ko.pureComputed(() => {
            let comps = ko.unwrap(this.comps) || [];
            return this.rows().length > 0 || comps.length > 0;
        });

        this.visible_count = ko.pureComputed(() => {
            return this.rows().length;
        });

        /*******************************************************************
         * Selection
         *******************************************************************/
        this._selected = ko.observable({});

        this.selected_count = ko.pureComputed(() => {
            return Object.size(this._selected());
        });

        this.has_selected = ko.pureComputed(() => {
            return this.selected_count() > 0;
        });

        this.selected = ko.pureComputed(() => {
            return this.get_selected();
        });

        this.toggle_select_visible = ko.pureComputed({
            write: value => {
                if (value) {
                    this._set_selected_rows(this.rows());
                } else {
                    this._selected({});
                }
            },
            read: () => {
                let rows = this.rows();
                return Object.size(this._selected()) >= rows.length && rows.length !== 0;
            },
        });

        /*******************************************************************
         * Paging
         *******************************************************************/

        this.page_count = ko.pureComputed(() => Math.ceil(this.count() / this.results_per_page()));

        this.has_pages = ko.pureComputed(() => this.page_count() > 1);

        this.page_numbers = ko.pureComputed(() => {
            let pages = Math.max(this.page_count(), 1);
            let page = this.page();

            let jumps = this.pagination_pages; // 9 or 5
            let split = Math.floor(this.pagination_pages / 2); // 4 or 2

            let high = Math.max(page + split, jumps - 1);
            let low = Math.min(page - split, pages - jumps);

            low = Math.max(low, 0) + 1; // 1
            high = Math.min(high, pages - 1) + 1;

            return low.upto(high);
        });

        this.page_info = ko.pureComputed(() => {
            let page = this.page();
            let visible_count = this.visible_count();
            let count = this.count();

            if (
                this.results_per_page() !== undefined &&
                page !== undefined &&
                visible_count !== undefined &&
                count !== undefined
            ) {
                let start;

                if (this.results_per_page() === 'all') {
                    start = 0;
                } else {
                    start = page * this.results_per_page();
                }

                let first = start + 1;
                let last = start + visible_count;

                return [first, 'to', last, 'of', count].join(' ');
            }
        });

        /*******************************************************************
         * Subscriptions
         *******************************************************************/

        if (this.inline_data) {
            this.order.subscribe(() => {
                this.page(0);
            });

            this.data.subscribe(() => {
                this.page(0);
            });

            this.rows.subscribe(() => {
                this._selected({});
            });
        } else {
            this.update_query({
                results_per_page: this.results_per_page(),
            });

            this.results_per_page.subscribe(results_per_page => {
                this.update_query({
                    results_per_page: results_per_page,
                });
            });

            // Reset page when query updates
            this.register_query_update_callback(key => {
                if (key !== 'page') {
                    this.page(0);
                }
            });

            // Subscribe to order and update query accordingly
            this.order.subscribe(order => {
                if (this.broadcast_order_change) {
                    Observer.broadcast_for_id(this.get_id(), 'DataTable.order', order);
                }
                this.update_query({
                    order_by: order,
                });
                if (this.all_results) {
                    this.all_results.update_query({
                        order_by: order,
                    });
                }
            });

            // Subscribe to page and update query accordingly
            this.page.subscribe(page => {
                if (this.broadcast_page_change) {
                    Observer.broadcast_for_id(this.get_id(), 'DataTable.page', page);
                }
                this.update_query({
                    page: page,
                });
            });

            this.data.subscribe(() => {
                this._selected({});
            });
        }

        this.rows.subscribe(rows => {
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
            if (opts.hide_empty) {
                if (rows.length > 0) {
                    this.hide_empty(false);
                } else {
                    this.hide_empty(true);
                }
            }

            if (opts.is_empty_event_ids) {
                for (let i = 0, l = opts.is_empty_event_ids.length; i < l; i++) {
                    let is_empty_event = Utils.gen_event('Empty.table', opts.is_empty_event_ids[i]);
                    Observer.broadcast(is_empty_event, {
                        empty: rows.length == 0,
                    });
                }
            }
        });

        /*******************************************************************
         * Event broadcasts
         *******************************************************************/

        this.broadcast_count();

        this.data.subscribe(() => {
            this.broadcast_count();
        });

        Observer.register_for_id(this.get_id(), 'new_listener.DataTable.count', () => {
            this.broadcast_count();
        });

        Observer.register_for_id(this.get_id(), 'new_listener.DataTable.results_per_page', () => {
            this.broadcast_results_per_page_options();
        });

        this.broadcast_results_per_page_options();

        this.data.subscribe(() => {
            this.broadcast_results_per_page_options();
        });

        this.broadcast_counts();

        this.counts_watcher = ko.computed(() => {
            this.broadcast_counts();
        });

        Observer.register_for_id(this.get_id(), 'new_listener.DataTable.counts', () => {
            this.broadcast_counts();
        });

        this.broadcast_selected();

        this._selected.subscribe(() => {
            this.broadcast_selected();
        });

        Observer.register_for_id(this.get_id(), 'new_listener.DataTable.selected', () => {
            this.broadcast_selected();
        });

        if (this.broadcast_page_rows) {
            this.page.subscribe(() => {
                Observer.broadcast_for_id(this.get_id(), 'DataTable.rows', this.rows());
            });
        }

        /*******************************************************************
         * Event listeners
         *******************************************************************/

        Observer.register_for_id(this.get_id(), 'DataTable.toggle_select_all', () => {
            this.toggle_select_all();
        });

        if (opts.register_export) {
            let export_csv_event = Utils.gen_event('DataTable.export_csv', this.get_id());
            let exp = opts.register_export;
            let export_event = Utils.gen_event(
                'DynamicActions.register_action',
                exp.export_event_id,
            );

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
                this.export_csv();
            });
        }

        if (this.results_per_page_event) {
            Observer.register(this.results_per_page_event, data => {
                let results_per_page = Utils.get(data, 'results_per_page');
                let value = results_per_page ? results_per_page : Utils.get(data);
                if (value) {
                    this.results_per_page(value);
                } else {
                    this.results_per_page(this.results_per_page_default);
                }

                if (this.page() >= this.page_count()) {
                    this.set_page(0);
                }
            });
        }

        _dfd.resolve();
    }

    row_click(row) {
        if (this.row_click_callback) {
            this.row_click_callback(row);
        } else {
            Observer.broadcast_for_id(this.get_id(), 'DataTable.click_row', row);
        }

        return true;
    }

    _ensure_components(columns, data, callback) {
        let dfds = [];

        for (let j = 0, cl = columns.length; j < cl; j++) {
            if (columns[j].component) {
                for (let i = 0, dl = data.length; i < dl; i++) {
                    let dfd = $.Deferred();

                    dfds.push(dfd);

                    columns[j].gen_instance(data[i], undefined, undefined, instance => {
                        $.when(...instance.dfds).done(() => {
                            dfd.resolve();
                        });
                    });
                }
            }
        }

        $.when(...dfds).done(() => {
            setTimeout(callback, 1000);
        });
    }

    _columns_for_export() {
        let columns = this.columns().clone();

        // Add export_columns to columns for exporting
        for (let i = 0; i < this.export_columns.length; i++) {
            let placement = this.export_columns[i].placement;

            if (placement && placement.relative) {
                let idx = Utils.find_relative_idx(columns, {
                    key: 'label',
                    position: placement.position || 'right',
                    value: placement.relative,
                });

                columns.splice(idx, 0, this.export_columns[i]);
            } else if (placement && placement.index) {
                columns.splice(placement.index, 0, this.export_columns[i]);
            } else {
                columns.push(this.export_columns[i]);
            }
        }

        return columns;
    }

    _export_csv(data, callback) {
        let columns = this._columns_for_export();
        let rows = [];
        let header = [];
        this._ensure_components(columns, data, () => {
            if (data && data.length > 0) {
                for (let i = 0, l = columns.length; i < l; i++) {
                    if (columns[i].type == 'numeric' && columns[i].format) {
                        header.push(`${columns[i].label} Raw`);
                    }
                    header.push(columns[i].label);
                }

                rows.push(header);

                for (let i = 0, dl = data.length; i < dl; i++) {
                    let row = [];
                    for (let j = 0, cl = columns.length; j < cl; j++) {
                        if (columns[j].type == 'numeric' && columns[j].format) {
                            row.push(
                                data[i][
                                    columns[j].key || columns[j].sort_key || columns[j].export_key
                                ],
                            );
                        }
                        row.push(columns[j].gen_text_cell(data[i]));
                    }
                    rows.push(row);
                }

                this._prepare_csv({
                    data: {
                        rows: rows,
                        export_type: this.export_type,
                    },
                    success: DataThing.api.XHRSuccess(key => {
                        DataThing.form_post(config.download_csv_base + key);
                        callback();
                    }),
                    error: DataThing.api.XHRError(() => {}),
                });
            }
        });
    }

    get_all(callback) {
        if (this.inline_data) {
            return this._inline_get_all(callback);
        }

        return this._backend_get_all(callback);
    }

    export_csv() {
        if (this.inline_data) {
            return this._inline_export_csv();
        }

        return this._backend_export_csv();
    }

    _inline_get_all(callback) {
        callback(this.sorted_data());
    }

    _inline_export_csv() {
        this.export_loading(true);
        let comps = ko.unwrap(this.comps) || [];
        this._export_csv(comps.concat(this.sorted_data()), () => {
            this.export_loading(false);
        });
    }

    _backend_get_all(callback) {
        this.all_results._get_data((data, error) => {
            if (data && data.results) {
                callback(data.results);
            } else if (error) {
                callback(undefined, error);
            }
        });
    }

    _backend_export_csv() {
        this.export_loading(true);

        if (this.has_backend_export_support()) {
            let _columns = this.columns();
            let columns = [];

            for (let i = 0, l = _columns.length; i < l; i++) {
                let key = _columns[i].key || _columns[i].sort_key;
                columns.push({
                    key: key,
                    format: _columns[i].format,
                    format_args: _columns[i].format_args,
                    label: _columns[i].label,
                });
            }

            DataThing.get({
                params: {
                    target: 'csv_download_key',
                    columns: columns,
                    comps: ko.unwrap(this.comps) || [],
                    query: this.get_query_params(),
                },
                success: key => {
                    DataThing.form_post(config.download_csv_base + key);
                    this.export_loading(false);
                },
                error: error => {
                    bison.utils.Notify('Invalid Request:', error, 'alert-danger');
                    this.export_loading(false);
                },
                force: true,
            });
        } else {
            this._backend_get_all((data, error) => {
                if (error) {
                    bison.utils.Notify('Invalid Request:', error, 'alert-danger');
                    this.export_loading(false);
                } else {
                    let comps = ko.unwrap(this.comps) || [];
                    this._export_csv(comps.concat(data), () => {
                        this.export_loading(false);
                    });
                }
            });
        }
    }

    set_page(page) {
        let page_count = this.page_count();
        if (page >= 0 && page < page_count) {
            this.page(page);
        }
    }

    is_page(page) {
        return this.page() == page;
    }

    is_first() {
        return this.page() === 0;
    }

    is_last() {
        return this.page() == this.page_count() - 1;
    }

    first() {
        this.set_page(0);
    }

    prev() {
        this.set_page(this.page() - 1);
    }

    last() {
        this.set_page(this.page_count() - 1);
    }

    next() {
        this.set_page(this.page() + 1);
    }

    _set_selected_rows(rows) {
        let selected = {};
        if (rows) {
            for (let i = 0, l = rows.length; i < l; i++) {
                selected[rows[i][this.row_key]] = true;
            }
        }

        this._selected(selected);
    }

    reset_selected() {
        this._selected({});
    }

    get_selected() {
        let selected = this._selected();

        let selected_count = this.selected_count();
        let count = this.count();
        let visible_count = this.visible_count();

        if (selected_count === count && selected_count !== visible_count) {
            let data = this.all();
            if (data) {
                return data.filter(row => selected[row[this.row_key]]);
            }
        }

        return this.rows().filter(row => selected[row[this.row_key]]);
    }

    toggle_select_all() {
        if (this.selected_count() === this.visible_count()) {
            this.get_all(rows => {
                if (rows) {
                    this._set_selected_rows(rows);
                }
            });
        } else {
            this._set_selected_rows(this.rows());
        }
    }

    is_selected(row) {
        return !!this._selected()[row[this.row_key]];
    }

    set_selected(rows) {
        const selected = {};

        for (const row of rows) {
            selected[ko.unwrap(row[this.row_key])] = true;
        }

        this._selected(selected);
    }

    toggle_select(row) {
        if (this.radio_selection) {
            if (this.radio_selection_allow_empty && this.is_selected(row)) {
                this.reset_selected();
                return true;
            }
            this.reset_selected();
        }
        let selected = this._selected();
        if (this.is_selected(row)) {
            delete selected[ko.unwrap(row[this.row_key])];
        } else {
            selected[ko.unwrap(row[this.row_key])] = true;
        }

        this._selected(selected);
        this._selected.valueHasMutated();

        return true;
    }

    broadcast_count() {
        Observer.broadcast_for_id(this.get_id(), 'DataTable.count', this.count());
    }

    broadcast_results_per_page_options() {
        let available_options = [
            {label: '15', value: 15},
            {label: '50', value: 50},
            {label: '100', value: 100},
        ];

        if (this.inline_data) {
            available_options.push({label: '200', value: 200}, {label: '500', value: 500});
        }

        let options = [];

        let count = this.count();

        for (let i = 0, l = available_options.length; i < l; i++) {
            if (available_options[i].value <= count) {
                options.push(available_options[i]);

                if (
                    available_options[i + 1] &&
                    available_options[i + 1].value > count &&
                    available_options[i].value != count
                ) {
                    options.push({label: 'All', value: count});
                }
            }
        }

        if (this.inline_data && count > 500) {
            options.push({label: 'All', value: count});
        }

        Observer.broadcast_for_id(this.get_id(), 'DataTable.results_per_page', options);
    }

    broadcast_counts() {
        Observer.broadcast_for_id(this.get_id(), 'DataTable.counts', {
            count: this.count(),
            selected_count: this.selected_count(),
            visible_count: this.visible_count(),
        });
    }

    broadcast_selected() {
        Observer.broadcast_for_id(this.get_id(), 'DataTable.selected', this.get_selected());
    }
}
