/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import Observer from 'src/libs/Observer';
import * as Utils from 'src/libs/Utils';
import ReportTextBlock from 'src/libs/components/reports/visual_reports/ReportTextBlock';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    self.__class__ = 'ReportComponentWrapper';

    self.dfd = self.new_deferred();

    self.settings_dfds = [];
    let caption = opts.caption || {};
    self.template = opts.template || 'tpl_report_component_wrapper';
    self.text_block_template = caption.template || 'tpl_report_text_block';
    self._meta_data = ko.observableArray();

    self.can_hide = opts.can_hide === undefined ? true : opts.can_hide;
    self.hide = ko.observable(false);

    self.meta_data_events = opts.meta_data_events || [];
    self.allow_description = opts.allow_description || false;
    self.edit_mode = opts.edit_mode || false;
    self.is_first = opts.is_first || false;

    self.size = opts.size || ['full'];
    self.templates = opts.templates || false;

    self.title = opts.title;
    self.layout_event = opts.layout_event || Utils.gen_event('CalculateLayout', self.get_id());

    self.default_caption = opts.caption || {};
    self.text_body_provider = self.default_caption.text_body_provider || undefined;
    self.text_body = self.default_caption.text_body || undefined;

    // Determine automatic mode or not for the description field
    if (Utils.is_set(self.default_caption.automatic_mode)) {
        self.text_automatic_mode = self.default_caption.automatic_mode;
    } else {
        self.text_automatic_mode = true;
    }

    let init = self.new_deferred();

    if (opts.widget) {
        self.widget = opts.widget;
        self.add_dependency(self.widget);

        self.when(self.widget).done(() => {
            init.resolve();
        });
    } else if (opts.widget_config) {
        self.widget_config = opts.widget_config;

        self.init_component(self.widget_config, widget => {
            self.widget = widget;
            self.when(self.widget).done(() => {
                init.resolve();
            });
            self.add_dependency(self.widget);
        });
    } else {
        throw 'Initializing NewPopoverButton without widget or widget config...';
    }

    init.done(() => {
        self.toggle_widget_data = function(hide) {
            if (hide) {
                self.widget._auto_get_data = false;
            } else {
                self.widget._auto_get_data = true;
                self.widget.refresh_data();
            }
        };

        self.hide.subscribe(self.toggle_widget_data);

        self.toggle_expanded = function() {
            if (self.widget && self.widget.expanded) {
                self.widget.expanded(!self.widget.expanded());
                if (self.widget.expanded()) {
                    self.widgth = ['full'];
                }
            }
        };

        self.meta_data = ko.computed({
            read: function() {
                return self._meta_data();
            },
            write: function(value) {
                self._meta_data.remove(item => {
                    return item.name == value.name;
                });
                self._meta_data.push(value);
            },
        });

        self.description = self.new_instance(ReportTextBlock, {
            heading: self.default_caption.heading,
            text_body_provider: self.text_body_provider || self.text_body,
            mode: self.text_automatic_mode ? 'automatic' : 'manual',
            locked_mode: self.default_caption.locked_mode,
            max_length: self.default_caption.max_length,
            rows: self.default_caption.rows,
        });

        self.button_text = ko.pureComputed(() => {
            return self.hide() ? 'Re-include' : 'Exclude From Report';
        });

        self.toggle_hide = function() {
            self.hide(!self.hide());
        };

        self.extract_dynamic_data = function() {
            if (typeof self.widget.extract_dynamic_data === 'function') {
                return self.widget.extract_dynamic_data();
            }
            return self.widget.data();
        };

        self.restore_dynamic_data = function(snapshot) {
            if (typeof self.widget.restore_dynamic_data === 'function') {
                self.widget.restore_dynamic_data(snapshot);
            } else {
                self.widget.data(snapshot);
            }
        };

        self.extract_static_data = function() {
            let data = {
                // 'heading': self.description.heading(),
                hide: self.hide(),
                meta_data: self.meta_data(),
            };

            if (self.description.mode() == 'manual') {
                data['text_body'] = self.description.text_body();
            }

            if (typeof self.widget.extract_static_data === 'function') {
                data.widget = self.widget.extract_static_data();
            }

            return data;
        };

        self.restore_static_data = function(input) {
            if ('text_body' in input) {
                self.description.mode('manual');
                self.description.text_body(input.text_body);
            } else {
                self.description.mode('automatic');
                self.description.reset();
            }

            self.hide(input.hide);

            if (input.meta_data && Array.isArray(input.meta_data)) {
                for (let {name, data} of input.meta_data) {
                    self.meta_data({name: name, data: data});
                }
            }

            if (input.widget && typeof self.widget.restore_static_data === 'function') {
                self.widget.restore_static_data(input.widget);
            }

            self.toggle_widget_data(input.hide);
        };

        self.text_body = ko.pureComputed(() => {
            return Utils.nl2br(self.description.text_body() || '');
        });

        self.widget.loading.subscribe(loading => {
            if (!loading) {
                setTimeout(() => {
                    Observer.broadcast(self.layout_event);
                }, 500);
            }
        });

        self.when(self.widget, self.description).done(() => {
            for (let meta of self.meta_data_events) {
                if (meta && meta.event) {
                    Observer.register(meta.event, data => {
                        let label = Utils.get(data, 'label');

                        if (label) {
                            self.meta_data({
                                name: meta.name,
                                data: label,
                            });
                        }
                    });
                }
            }

            self.dfd.resolve();
        });
    });

    return self;
}
