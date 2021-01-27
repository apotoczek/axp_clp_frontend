/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import * as Utils from 'src/libs/Utils';
import ReportTextBlock from 'src/libs/components/reports/visual_reports/ReportTextBlock';
import ReportComponentWrapper from 'src/libs/components/reports/visual_reports/ReportComponentWrapper';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    self.__class__ = 'ReportComponentWrapper';

    self.dfd = self.new_deferred();
    self.widget_config = opts.widget_config || {};

    self.can_hide = opts.can_hide === undefined ? true : opts.can_hide;
    self.hide = ko.observable(false);
    self.max_per_page = opts.max_per_page || 30;
    self.min_last_page = opts.min_last_page || 4;

    self.allow_description = opts.allow_description || false;

    self.title = opts.title;
    self.save_event = opts.save_event;
    self.layout_event = opts.layout_event || Utils.gen_event('CalculateLayout', self.get_id());

    self.default_caption = opts.caption || {};
    self.text_body_provider = self.default_caption.text_body_provider || undefined;
    self.text_body = self.default_caption.text_body || undefined;

    self.static_data = ko.observable();

    self.description = self.new_instance(ReportTextBlock, {
        save_event: self.save_event,
        template: self.text_block_template,
        heading: self.default_caption.heading,
        text_body_provider: self.text_body_provider || self.text_body,
        mode: 'automatic',
        max_length: self.default_caption.max_length,
        rows: self.default_caption.rows,
    });

    self.restore_dynamic_data = snapshot => {
        self.data(snapshot);
    };

    self.calculate_table_size = () => {
        let data_len = self.data().length || 0;
        let last_page_len = data_len % self.max_per_page;
        if (last_page_len < self.min_last_page && self.max_per_page < data_len) {
            let pages = (data_len - last_page_len) / self.max_per_page;
            let needed = self.min_last_page - last_page_len;
            return self.max_per_page - Math.ceil(needed / pages);
        }
        return self.max_per_page;
    };

    self.group_data = (data, per_page) => {
        let [current, final] = [[], []];
        for (let i = 0; i < data.length; i++) {
            current.push(data[i]);
            if (current.length >= per_page || data.length === i + 1) {
                final.push(current);
                current = [];
            }
        }
        return final;
    };

    self.into_pages = function() {
        let data = self.data();

        //if data is an object, use the "data" key
        if (typeof data === 'object' && data !== null) {
            data = data.data;
        }

        let table_size = self.calculate_table_size();
        let groups = self.group_data(data, table_size);
        let components = groups.map((data, idx) => {
            let text_body_provider;

            if (idx == groups.length - 1) {
                text_body_provider = ko.pureComputed(() => {
                    return self.description.text_body();
                });
            }

            let widget = self.new_instance(ReportComponentWrapper, {
                title: self.title,
                allow_description: self.allow_description,
                template: 'tpl_report_component_wrapper_view',
                widget_config: opts.widget_config,
                caption: {
                    text_body_provider: text_body_provider,
                },
            });

            self.when(widget).done(() => {
                widget.restore_dynamic_data(data);
                widget.restore_static_data(self.static_data());
            });

            return widget;
        });

        return components;
    };

    self.restore_static_data = function(input) {
        if ('text_body' in input) {
            self.description.mode('manual');
            self.description.text_body(input.text_body);
        } else {
            self.description.mode('automatic');
            self.description.reset();
        }

        // Shallow copy input and delete text body to make sure
        // we don't get a description on each sub component
        let new_input = {...input};
        delete new_input.text_body;

        self.static_data(new_input);
        self.hide(input.hide);
    };

    self.when(self.description).done(() => {
        self.dfd.resolve();
    });

    return self;
}
