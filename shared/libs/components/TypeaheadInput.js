/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import * as Utils from 'src/libs/Utils';
import Observer from 'src/libs/Observer';
import DataThing from 'src/libs/DataThing';
import DataSource from 'src/libs/DataSource';

import 'src/libs/bindings/typeahead';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);
    let endpoint_opts = opts.endpoint || {};
    self.template = opts.template || 'tpl_typeahead_input';
    self._css = opts.css || {};

    // Input Config
    self.disabled = opts.disabled || false;
    self.placeholder = opts.placeholder || null;
    self.error_message = opts.error_message || opts.allow_empty ? undefined : 'Can not be empty';
    self.allow_empty = opts.allow_empty === undefined ? true : opts.allow_empty;

    // Typeahead Config
    self.highlight = opts.highlight || false;
    self.min_length = opts.min_length || 1;
    self.fetch_event = opts.fetch_event;

    // Endpoint Config
    self.target = endpoint_opts.target || undefined;
    self.default_filters = endpoint_opts.default_filters || {};
    self.return_key = endpoint_opts.return_key || 'uid';
    self.display_key = endpoint_opts.display_key || undefined;
    self.query_key = endpoint_opts.query_key || null;
    self.order_by = endpoint_opts.order_by || undefined;

    if (opts.selected_datasource) {
        self.selected_datasource = self.new_instance(DataSource, {
            datasource: opts.selected_datasource,
        });
        self.selected_datasource.data.subscribe(data => {
            self.result(data);
        });
    }

    self.clear_event = opts.clear_event;
    self.select_event = opts.select_event || undefined;

    self.results_per_page = opts.list_length || 5;

    self.result = ko.observable({});

    self.valid = ko.computed(() => {
        let result = self.result();

        if (Object.isObject(result)) {
            return true;
        }
        if (self.allow_empty) {
            return true;
        }
        return false;
    });

    self.can_submit = ko.pureComputed(() => {
        let valid = self.valid();
        let allow_empty = self.allow_empty;

        if (!valid) {
            return false;
        }
        if (!allow_empty && !Utils.is_set(self.value())) {
            return false;
        }
        return true;
    });

    self.value = ko.computed(() => {
        let data = self.result();

        if (data) {
            return data[self.return_key];
        }
    });

    self.css = ko.pureComputed(() => {
        let css = Utils.ensure_css_object(self._css);
        css['nonempty'] = Utils.is_set(self.result(), true) || !self.valid();
        return css;
    });

    self.clear = function() {
        self.result({});
    };

    let source = function(query, callback) {
        let filters = self.default_filters;
        filters[self.query_key] = query;
        DataThing.get({
            params: {
                target: self.target,
                filters: filters,
                results_per_page: self.results_per_page,
                order_by: self.order_by,
            },
            success: function(data) {
                if (data.results) {
                    callback(data.results);
                }
            },
            error: function() {},
        });
    };

    self.typeahead_options = {
        default_value: self.result,
        minLength: self.min_length,
        datasets: {
            display: self.display_key,
            source: source,
            templates: {
                suggestion: function(data) {
                    return `<strong>${data[self.display_key]}</strong>`;
                },
            },
        },
        on_select: function(event, value) {
            self.result(value);
            if (self.select_event) {
                Observer.broadcast(self.select_event, value[self.return_key]);
            }
        },
        on_close: function(value) {
            let data = self.result();
            if (data && data[self.display_key] != value) {
                self.result(undefined);
                return true;
            }
            return false;
        },
    };

    if (self.clear_event) {
        Observer.register(self.clear_event, () => {
            self.clear();
        });
    }
    if (self.fetch_event) {
        Observer.register(self.fetch_event, data => {
            self.typeahead_options.on_select(null, data);
        });
    }

    return self;
}
