/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import Aside from 'src/libs/components/basic/Aside';

export default function(opts = {}, components = {}) {
    let self = new BaseComponent(opts, components);

    /*********************************************************
     *                    Variables                          *
     *********************************************************/

    let _dfd = self.new_deferred();

    self.report = opts.report;

    self.body_config = opts.body;
    self.body_only = opts.body_only;
    self.image_string = ko.observable();
    self.report_name = ko.observable();

    self.report_body_config = {
        id: 'body',
        template: self.body_only ? 'tpl_aside_body' : 'tpl_report_body',
        layout: {
            header: self.body_config.header ? self.body_config.header.id : undefined,
            toolbar: self.body_config.toolbar ? self.body_config.toolbar.id : undefined,
            body: self.body_only
                ? [self.body_config.layout_engine.id]
                : self.body_config.layout_engine.id,
        },
        components: [self.body_config.layout_engine],
    };
    if (self.body_config.header) {
        self.report_body_config.components.push(self.body_config.header);
    }
    if (self.body_config.toolbar) {
        self.report_body_config.components.push(self.body_config.toolbar);
    }

    self.body = self.new_instance(Aside, self.report_body_config, self.shared_components);

    /*********************************************************
     *                      Functions                        *
     *********************************************************/

    self.restore_data = function(report, restore_dynamic = true, restore_static = true) {
        let json_data = report.json_data || {};
        let static_data = json_data.static_data || {};
        let dynamic_data = json_data.dynamic_data || {};

        for (let [key, component] of Object.entries(self.body.components)) {
            if (component.__class__ === 'ReportComponentWrapper') {
                if (restore_dynamic && dynamic_data && dynamic_data[key]) {
                    component.restore_dynamic_data(dynamic_data[key]);
                }
                if (restore_static && static_data && static_data[key]) {
                    component.restore_static_data(static_data[key]);
                }
            } else {
                if (restore_dynamic && typeof component.restore_dynamic_data === 'function') {
                    component.restore_dynamic_data(dynamic_data);
                }
                if (restore_static && typeof component.restore_static_data === 'function') {
                    component.restore_static_data(static_data);
                }
            }
        }

        if (static_data.logo) {
            self.image_string(static_data.logo);
        } else {
            self.image_string(require('src/img/fake_logo.png'));
        }

        self.report_name(report.name);
    };

    /*********************************************************
     *                     Templates                         *
     *********************************************************/

    self.define_default_template(`
            <!-- ko renderComponent: body --><!-- /ko -->
        `);

    self.when(self.body).done(() => {
        _dfd.resolve();
    });

    return self;
}
