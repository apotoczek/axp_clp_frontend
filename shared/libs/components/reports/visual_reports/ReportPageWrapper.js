/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import * as Utils from 'src/libs/Utils';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    self.template = opts.template || 'tpl_report_page_wrapper';

    let _dfd = self.new_deferred();

    self._css = opts.css;

    self.page_number = ko.observable(opts.page_number);
    self.title = opts.title;
    self.sub_title = opts.sub_title;

    self.is_cover = opts.is_cover || false;

    self.css = ko.pureComputed(() => {
        let css = Utils.ensure_css_object(self._css);

        css['report-cover'] = self.is_cover;

        return css;
    });

    self.hide = ko.observable(false);

    self.restore_dynamic_data = function(dynamic_data) {
        for (let [key, data] of Object.entries(dynamic_data)) {
            if (self.components[key]) {
                self.components[key].restore_dynamic_data(data);
            }
        }
    };

    self.restore_static_data = function(static_data) {
        for (let [key, data] of Object.entries(static_data)) {
            if (self.components[key]) {
                self.components[key].restore_static_data(data);
            }
        }

        let hide = true;

        for (let component of Object.values(self.components)) {
            if (component.__class__ === 'ReportComponentWrapper' && !component.hide()) {
                hide = false;
                break;
            }
        }

        self.hide(hide);
    };

    _dfd.resolve();

    return self;
}
