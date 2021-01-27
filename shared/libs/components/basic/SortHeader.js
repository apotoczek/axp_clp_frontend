/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import $ from 'jquery';
import bison from 'bison';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import * as Formatters from 'src/libs/Formatters';
import * as Mapping from 'src/libs/Mapping';
import DataSource from 'src/libs/DataSource';
import NewPopoverButton from 'src/libs/components/popovers/NewPopoverButton';
import Checklist from 'src/libs/components/basic/Checklist';
import * as Utils from 'src/libs/Utils';
import Observer from 'src/libs/Observer';
import LocalStorage from 'src/libs/localstorage';

class Column {
    constructor(column, parent) {
        Object.assign(this, column);

        this.parent = parent;

        this.generated_key = column.key || column.localstorage_key || bison.helpers.uuid();

        this.formatter = ko.observable();

        if (ko.isComputed(column.format)) {
            column.format.subscribe(format => {
                column.format = format;
                this.formatter(Formatters.gen_formatter(column));
            });
        } else {
            this.formatter(column.formatter || Formatters.gen_formatter(column));
        }

        this.text_formatter = Formatters.gen_formatter(column, true);

        this.disable_sorting = column.disable_sorting || false;

        this.label = column.label || '';
        this.definition = column.definition || undefined;
        this.disable_lang_definition = column.disable_lang_definition || false;

        this.visible = column.visible;

        this.tooltip_key = column.tooltip_key;

        this.visibility = ko.observable(true);

        if (this.toggle_visible_event) {
            this.visibility(false);

            Observer.register(this.toggle_visible_event, data => {
                this.visibility(!!Utils.get(data, 'value'));
            });
        }
        if (this.component) {
            if (this.component_callback && this.component_callbacks) {
                throw `Component ${this.component.component} -- Do not define both "component_callback" and "component_callbacks"`;
            }
            if (this.component_callbacks && this.component_mapping) {
                throw `Component ${this.component.component} -- Do not use top level "component_mapping" with "component_callbacks"`;
            }

            if (this.component_callback) {
                this.component_mapping_fn = Mapping.gen_mapping(this.component_mapping);
                this.component_callback = this.component_callback || 'data';
            }

            if (this.component_callbacks) {
                this.component_mapping_fns = [];

                for (let i = 0, l = this.component_callbacks.length; i < l; i++) {
                    this.component_mapping_fns[i] = Mapping.gen_mapping(
                        this.component_callbacks[i].mapping,
                    );
                }
            }

            const dfd = $.Deferred();

            this.parent._component_dfds.push(dfd);

            this.parent.load_component(this.component, mod => {
                this._mod = mod;
                dfd.resolve();
            });

            this.instances = {};
        }

        this.sort_icon =
            this.sort_icon ||
            ko.pureComputed(() => {
                const key = this.parent.get_sort_key(this);
                if (key && !this.disable_sorting && !this.parent.disable_sorting) {
                    const order = this.parent.sort_order()[key];
                    if (order == 'asc') {
                        return 'sort-asc';
                    }
                    if (order == 'desc') {
                        return 'sort-desc';
                    }
                    return 'sort-none';
                }
            });

        this.sort_text = ko.pureComputed(() => {
            const key = this.parent.get_sort_key(this);
            if (key && !this.disable_sorting && !this.parent.disable_sorting) {
                const order = this.parent.sort_order()[key];
                if (order == 'asc') {
                    return 'Asc';
                }
                if (order == 'desc') {
                    return 'Desc';
                }
            }
        });

        this.has_sort = ko.pureComputed(() => {
            const key = this.parent.get_sort_key(this);
            if (key && !this.disable_sorting && !this.parent.disable_sorting) {
                return !!this.parent.sort_order()[key];
            }
            return false;
        });

        this.css =
            this.css ||
            ko.pureComputed(() => {
                switch (this.type) {
                    case 'label':
                        return {'table-field': true};
                    case 'component':
                        return {'table-field': true, component: true};
                    case 'numeric':
                        return {'table-field': true, numeric: true};
                    case 'icon':
                        return {'table-field': true, icon: true};
                    case 'string':
                    default:
                        return {'table-field': true};
                }
            });
    }

    get_css(row) {
        const tooltip = this.get_tooltip(row);

        const css = ko.unwrap(this.css);

        if (tooltip) {
            return {...css, 'table-field-tooltip': true};
        }

        return css;
    }

    get_tooltip(row) {
        if (this.tooltip_key) {
            const tooltip = Utils.extract_data(this.tooltip_key, row);

            if (tooltip) {
                return {
                    html: tooltip,
                    container: 'body',
                };
            }
        }
    }

    gen_text_cell(row) {
        if (this.component) {
            const key = row[this.parent.row_key];

            if (this.instances[key] && typeof this.instances[key]().value_to_text === 'function') {
                return Utils.unescape_html(this.instances[key]().value_to_text());
            }

            return '';
        }

        if (this.key) {
            const text = this.text_formatter(Utils.extract_data(this.key, row));

            return Utils.unescape_html(text);
        }

        return Utils.unescape_html(this.text_formatter(row));
    }

    gen_instance(row, index, length, callback) {
        const key = row[this.parent.row_key];

        if (!this.instances[key]) {
            this.instances[key] = ko.observable();

            const instance = this.parent.new_instance(
                this._mod,
                Object.assign({query_key_suffix: key}, this.component),
            );

            $.when(...instance.dfds).done(() => {
                this.run_instance_callbacks(instance, row);

                this.run_table_placement_callback(instance, index, length);

                this.instances[key](instance);

                if (typeof callback === 'function') {
                    callback(instance);
                }
            });
        } else {
            const instance = this.instances[key]();

            if (instance) {
                if (!this.initial_callback_only) {
                    this.run_instance_callbacks(instance, row);
                }

                this.run_table_placement_callback(instance, index, length);
            }

            if (typeof callback === 'function') {
                callback(instance);
            }
        }

        return this.instances[key];
    }

    gen_cell(row) {
        if (Utils.is_set(this.key)) {
            return this.formatter()(Utils.extract_data(this.key, row));
        }
        return this.formatter()(row);
    }

    run_instance_callbacks(instance, row) {
        if (this.component_callback) {
            if (typeof this.component_callback === 'function') {
                this.component_callback(instance, this.component_mapping_fn(row));
            } else if (typeof instance[this.component_callback] === 'function') {
                instance[this.component_callback](this.component_mapping_fn(row));
            }
        }

        if (this.component_callbacks) {
            for (let i = 0, l = this.component_callbacks.length; i < l; i++) {
                if (this.component_callbacks[i]) {
                    if (typeof this.component_callbacks[i].callback === 'function') {
                        this.component_callbacks[i].callback(
                            instance,
                            this.component_mapping_fns[i](row),
                        );
                    } else if (
                        typeof instance[this.component_callbacks[i].callback] === 'function'
                    ) {
                        instance[this.component_callbacks[i].callback](
                            this.component_mapping_fns[i](row),
                        );
                    }
                }
            }
        }
    }

    run_table_placement_callback(instance, index, length) {
        if (typeof instance._table_placement === 'function' && length) {
            if (length <= 5) {
                instance._table_placement('top');
            } else if (length <= 25) {
                if (index > 5) {
                    instance._table_placement('bottom');
                } else {
                    instance._table_placement('top');
                }
            } else {
                if (index + 1 > length / 2) {
                    instance._table_placement('bottom');
                } else {
                    instance._table_placement('top');
                }
            }
        }
    }
}

export default class SortHeader extends BaseComponent {
    constructor(opts = {}, components = {}) {
        super(opts, components);

        if (!opts.columns) {
            throw `Trying to initialize SortHeader/DataTable (${this.get_id()}) without columns`;
        }

        const _dfd = this.new_deferred();

        this._component_dfds = [];

        this.disable_sorting = opts.disable_sorting || false;

        this.default_order = opts.default_order || [];

        this.sort_index = ko.observableArray([]);
        this.sort_order = ko.observable({});
        this.index_map = {};

        this.row_key = opts.row_key || 'uid';

        this.enable_localstorage = opts.enable_localstorage || false;

        this.clear_order_event = opts.clear_order_event || 'clear_order';
        this.set_order_event = opts.set_order_event || 'set_order';

        this.column_toggle_placement = opts.column_toggle_placement || 'bottom';

        this.raw_columns = this.map_columns(opts.columns);
        this.export_columns = this.map_columns(opts.export_columns || []);

        this._columns = this.raw_columns.map(column => {
            column.value = this.get_column_key(column);
            return column;
        });

        let dynamic_columns = Utils.ensure_array(opts.dynamic_columns);

        this.dynamic_column_sources = [];

        for (let config of dynamic_columns) {
            let source = this.new_instance(DataSource, config);

            this.dynamic_column_sources.push({
                data: source.data,
                placement: config.placement,
                visible: config.visible == undefined ? true : config.visible,
            });
        }

        this.available_columns = ko.pureComputed(() => this._compute_available_columns());

        this.always_visible_columns = this._columns.filter(n => {
            return n.always_visible;
        });

        this.visible_columns = this.new_instance(NewPopoverButton, {
            id: 'visible_columns',
            icon_css: 'glyphicon glyphicon-cog column-toggle-icon',
            css: {
                'btn-column-toggle': true,
                ...opts.column_toggle_css,
            },
            enable_localstorage: this.enable_localstorage,
            popover_options: {
                title: 'Display Columns',
                placement: this.column_toggle_placement,
                css_class: 'popover-ghost-info',
            },
            popover_config: {
                option_disable_untoggle_key: 'disable_untoggle',
                component: Checklist,
                data: ko.pureComputed(() =>
                    this.available_columns().map(column => ({
                        value: column.value,
                        label: column.label,
                        disable_untoggle: column.disable_untoggle,
                    })),
                ),
                enable_clear: false,
                enable_toggle_all: true,
                enable_toggle_all_text: 'Show All Columns',
                disable_toggle_all_text: 'Hide All Columns',
                selected_data: ko.pureComputed(() => {
                    return this.get_column_defaults(this.available_columns());
                }),
            },
        });

        this.columns = ko.pureComputed(() => this._compute_columns());

        this.order = ko.pureComputed(() => this._compute_order());

        this.has_order = ko.pureComputed(() => {
            return this.order().length > 0;
        });

        if (this.set_order_event) {
            Observer.register_for_id(this.get_id(), this.set_order_event, state => {
                this.set_state(state);
            });
        }

        if (this.clear_order_event) {
            Observer.register_for_id(this.get_id(), this.clear_order_event, () => {
                this.clear_order();
            });
        }

        if (this.enable_localstorage) {
            const order_key = Utils.gen_id('SortHeader.order', this.get_id());
            const order = LocalStorage.get(order_key);
            this.set_state(order);
            this.order.subscribe(order => {
                LocalStorage.set(order_key, order);
            });
        }

        $.when($.when(...this.visible_columns.dfds), $.when(...this._component_dfds)).done(() => {
            _dfd.resolve();
        });
    }

    get_column_key(column) {
        return column.unique_key || column.sort_key || column.generated_key;
    }

    get_sort_key(column) {
        return column.sort_key || column.key;
    }

    map_column(column) {
        return new Column(column, this);
    }

    map_columns(columns) {
        const mapped_columns = [];

        for (const [idx, column] of columns.entries()) {
            const mapped = this.map_column(column);

            if (idx == 0 || column.always_visible) {
                mapped.disable_untoggle = true;
            }

            this.index_map[this.get_column_key(mapped)] = idx;

            mapped_columns.push(mapped);
        }

        return mapped_columns;
    }

    get_column_defaults(options) {
        return options
            .filter(option => {
                return option.visible === undefined
                    ? true
                    : ko.utils.unwrapObservable(option.visible);
            })
            .map(option => {
                return {
                    value: option.value,
                };
            });
    }

    get_state() {
        return this.order();
    }

    get_metrics() {
        const roster = {};

        this.order().map(item => {
            roster[`${item.name}_col`] = item.sort;
        });

        return roster;
    }

    set_state(state) {
        if (state && state.length > 0) {
            const sort_order = {};
            const sort_index = [];
            state.map(order => {
                const index = this.index_map[order.name];

                if (index !== undefined) {
                    sort_index.push(index);
                    sort_order[order.name] = order.sort;
                }
            });
            this.sort_index(sort_index);
            this.sort_order(sort_order);
        } else {
            this.sort_index([]);
            this.sort_order({});
        }
    }

    toggle_order(column, event) {
        let tmp_sort_index = this.sort_index();
        let tmp_sort_order = this.sort_order();

        const key = this.get_sort_key(column);

        if (key && !column.disable_sorting && !this.disable_sorting) {
            const order = tmp_sort_order[key];

            // If shift is not pressed, or this is inline sort, reset order
            if (!event.shiftKey) {
                tmp_sort_index = [];
                tmp_sort_order = {};
            }

            if (order == undefined) {
                tmp_sort_order[key] = ko.unwrap(column.first_sort) || 'asc';
            } else if (order == 'asc') {
                tmp_sort_order[key] = 'desc';
            } else {
                tmp_sort_order[key] = 'asc';
            }

            tmp_sort_index.push(this.index_map[key]);

            this.sort_index(tmp_sort_index.unique());
            this.sort_order(tmp_sort_order);
        }
    }

    clear_order() {
        this.sort_order({});
        this.sort_index([]);
    }

    _compute_available_columns() {
        let options = this._columns.filter(n => {
            return !n.always_visible;
        });

        for (let source of this.dynamic_column_sources) {
            let dynamic_options = source.data();
            let placement = source.placement;

            if (dynamic_options) {
                for (let i = 0, l = dynamic_options.length; i < l; i++) {
                    dynamic_options[i].visible = source.visible;
                    dynamic_options[i].disable_sorting = true;
                    dynamic_options[i].value = dynamic_options[i].value || dynamic_options[i].key;
                }

                if (placement && placement.relative) {
                    let idx = Utils.find_relative_idx(options, {
                        key: placement.key || 'label',
                        position: placement.position || 'right',
                        value: placement.relative,
                    });

                    options.splice(idx, 0, ...dynamic_options);
                } else if (placement && Utils.is_set(placement.index)) {
                    options.splice(placement.index, 0, ...dynamic_options);
                } else {
                    for (const dynamic_option of dynamic_options) {
                        let dynamic_option_placement = dynamic_option?.placement;
                        if (dynamic_option_placement?.relative) {
                            let idx = Utils.find_relative_idx(options, {
                                key: dynamic_option_placement.key || 'label',
                                position: dynamic_option_placement.position || 'right',
                                value: dynamic_option_placement.relative,
                            });

                            options.splice(idx, 0, dynamic_option);
                        } else {
                            options.push(dynamic_option);
                        }
                    }
                }
            }
        }

        return options;
    }

    _compute_columns() {
        const columns = [];
        const selected = this.visible_columns.get_value();

        const selectedKeys = new Set(selected.map(s => s.value));

        const visible_columns = this.available_columns()
            .filter(c => selectedKeys.has(c.value))
            .concat(this.always_visible_columns);

        for (let i = 0, l = visible_columns.length; i < l; i++) {
            const column_key = this.get_column_key(visible_columns[i]);
            if (column_key) {
                const idx = this.index_map[column_key];
                if (idx !== undefined && this.raw_columns[idx]) {
                    if (this.raw_columns[idx].visibility()) {
                        columns.push(this.raw_columns[idx]);
                    }
                }
            } else {
                columns.push(this.map_column(visible_columns[i]));
            }
        }

        return columns;
    }

    _compute_order() {
        const sort_index = this.sort_index();
        const sort_order = this.sort_order();
        const order = [];

        for (let i = 0, l = sort_index.length; i < l; i++) {
            const key = this.get_sort_key(this.raw_columns[sort_index[i]]);
            if (key) {
                order[i] = {
                    name: key,
                    sort: sort_order[key],
                };
            }
        }

        return order;
    }
}
