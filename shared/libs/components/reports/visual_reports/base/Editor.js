/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import Aside from 'src/libs/components/basic/Aside';
import TextInput from 'src/libs/components/basic/TextInput';
import ImageCropper from 'src/libs/components/ImageCropper';
import CpanelExtract from 'src/libs/components/basic/CpanelExtract';
import * as Utils from 'src/libs/Utils';

export default function(opts = {}, components = {}) {
    let self = new BaseComponent(opts, components);

    /*********************************************************
     *                    Variables                          *
     *********************************************************/

    let _dfd = self.new_deferred();

    self.report = opts.report;

    self.report_name = self.new_instance(TextInput, {
        id: 'report_name',
        data: self.report,
        initial_value_property: 'name',
        enable_data_updates: true,
        css: {'input-lg': true},
    });

    self.report_logo = self.new_instance(ImageCropper, {
        id: 'report_logo',
        export_original_size: true,
        save_event: opts.save_event,
    });

    self.shared_components = {
        report_name: self.report_name,
        report_logo: self.report_logo,
    };

    self.cpanel_config = opts.cpanel;
    self.body_config = opts.body;

    if (self.cpanel_config) {
        self.cpanel = self.new_instance(
            CpanelExtract,
            {
                id: 'cpanel',
                template: 'tpl_analytics_cpanel',
                extract_keys: Utils.get_cpanel_extract_keys(self.cpanel_config.components),
                layout: {
                    body: self.cpanel_config.components.map(component => component.id),
                },
                components: self.cpanel_config.components,
            },
            self.shared_components,
        );
    } else {
        self.cpanel = false;
    }

    self.body = self.new_instance(
        Aside,
        {
            id: 'body',
            template: 'tpl_report_body',
            layout: {
                header: self.body_config.header.id,
                toolbar: self.body_config.toolbar.id,
                body: self.body_config.layout_engine.id,
            },
            components: [
                self.body_config.header,
                self.body_config.toolbar,
                self.body_config.layout_engine,
            ],
        },
        self.shared_components,
    );

    /*********************************************************
     *                      Functions                        *
     *********************************************************/

    self.get_dynamic_data = function() {
        let data = {};

        for (let [key, component] of Object.entries(self.body.components)) {
            if (component.__class__ === 'ReportComponentWrapper') {
                data[key] = component.extract_dynamic_data();
            } else if (typeof component.extract_dynamic_data === 'function') {
                let wrapper_data = component.extract_dynamic_data();

                for (let [inner_key, value] of Object.entries(wrapper_data)) {
                    data[inner_key] = value;
                }
            }
        }

        return data;
    };

    self.get_static_data = function() {
        let data = {};

        for (let [key, component] of Object.entries(self.body.components)) {
            if (component.__class__ === 'ReportComponentWrapper') {
                data[key] = component.extract_static_data();
            } else if (typeof component.extract_static_data === 'function') {
                let wrapper_data = component.extract_static_data();

                for (let [inner_key, value] of Object.entries(wrapper_data)) {
                    data[inner_key] = value;
                }
            }
        }

        data.logo = self.report_logo.chosen_image();

        return data;
    };

    self.get_params = function() {
        if (self.cpanel) {
            return self.cpanel.extract_data();
        }

        return {};
    };

    self.get_full_snapshot = function() {
        return {
            name: self.report_name.value(),
            params: self.get_params(),
            json_data: {
                dynamic_data: self.get_dynamic_data(),
                static_data: self.get_static_data(),
            },
        };
    };

    self.get_static_snapshot = function() {
        return {
            name: self.report_name.value(),
            params: self.get_params(),
            json_data: {
                static_data: self.get_static_data(),
            },
        };
    };

    self.restore_data = function(report) {
        // Restore all defaults values first
        if (self.cpanel) {
            self.cpanel.restore_defaults();

            if (report.params) {
                self.cpanel.update_data(report.params);
            }
        }

        let json_data = report.json_data || {};
        let static_data = json_data.static_data || {};

        for (let [key, component] of Object.entries(self.body.components)) {
            if (component.__class__ === 'ReportComponentWrapper') {
                if (static_data && static_data[key]) {
                    component.restore_static_data(static_data[key]);
                }
            } else if (typeof component.restore_static_data === 'function') {
                component.restore_static_data(static_data);
            }
        }

        self.report_logo.chosen_image(undefined);

        if (static_data.logo) {
            self.report_logo.chosen_image(static_data.logo);
        }
    };

    /*********************************************************
     *                     Templates                         *
     *********************************************************/

    self.define_default_template(`
            <!-- ko if: loading -->
                <div class="big-message" style="color: #616e83;">
                    <span class="glyphicon glyphicon-cog animate-spin" style="margin: 50px 0px 30px;"></span>
                    <h1>Generating preview...</h1>
                    <p class="lead">This may take up to a minute.</p>
                </div>
            <!-- /ko -->
            <!-- ko ifnot: loading -->
                <!-- ko if: cpanel -->
                    <!-- ko renderComponent: cpanel --><!-- /ko -->
                <!-- /ko -->
                <!-- ko renderComponent: body --><!-- /ko -->
            <!-- /ko -->
        `);

    let dfd_components = [self.body];

    if (self.cpanel) {
        dfd_components.push(self.cpanel);
    }

    self.when(...dfd_components).done(() => {
        self.init_loading = ko.observable(true);

        self.toggle_loading = () => {
            self.init_loading(true);
            self.init_loading.valueHasMutated();
            setTimeout(() => self.init_loading(false), 500);
        };

        self.body_loading = ko.pureComputed(() => {
            if (self.init_loading()) {
                return true;
            }

            for (let component of Object.values(self.body.layout.body.components)) {
                if (typeof component.loading === 'function' && component.loading()) {
                    return true;
                }
            }

            return false;
        });

        self.toggle_loading();

        _dfd.resolve();
    });

    return self;
}
