import ko from 'knockout';

import * as Utils from 'src/libs/Utils';

import BarChart from 'src/libs/components/charts/BarChart';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import ReportComponentWrapper from 'src/libs/components/reports/visual_reports/ReportComponentWrapper';

class ReportMultiComponentWrapper extends BaseComponent {
    constructor(opts = {}, components = {}) {
        super(opts, components);

        this.__class__ = 'ReportMultiComponentWrapper';
        this.supported_components = {
            BarChart: BarChart,
            ReportComponentWrapper: ReportComponentWrapper,
        };

        this.template = opts.template || 'tpl_report_multi_component_wrapper';
        this.measurements = {
            approx_page_content_height: opts.approx_page_content_height || 1010,
            component_wrapper_margin: 10,
        };

        this.settings_dfds = [];
        this.layout_event = opts.layout_event || Utils.gen_event('CalculateLayout', this.get_id());
        this.size = opts.size || ['full'];

        this.edit_mode = opts.edit_mode || false;
        this.is_first = opts.is_first || false;
        this.title = opts.title;

        this.widget_configs_computed = opts.widget_configs_computed || ko.pureComputed(() => []);
        this.snapshots = ko.observable([]);

        this.components = ko.pureComputed(() => {
            let configs = this.edit_mode ? this.widget_configs_computed() : this.snapshots();
            if (!(configs.length > 0)) {
                return;
            }
            let components = [];
            for (let i = 0; i < configs.length; i++) {
                this.init_component(configs[i], comp => {
                    components.push(comp);
                    this.add_dependency(comp);
                });
            }
            return components;
        });
    }

    into_page_groups() {
        let pages = [[]];
        let component_arr = this.components();
        let vertical_space = this.measurements.approx_page_content_height;
        let page_number = 0;

        if (component_arr) {
            for (let i = 0; i < component_arr.length; i++) {
                let component = component_arr[i];
                let component_height = component.opts.height;

                if (component_height > this.measurements.approx_page_content_height) {
                    throw 'component is larger than containing page';
                }

                vertical_space -= component_height;
                if (vertical_space < 0) {
                    page_number++;
                    pages[page_number] = [];
                    vertical_space = this.measurements.approx_page_content_height;
                    vertical_space -= component_height;
                }

                pages[page_number].push(component);
            }

            return pages;
        }
    }

    extract_dynamic_data() {
        let data_arr = [];
        let component_arr = this.components();
        let widget_configs = this.widget_configs_computed();

        for (let i = 0; i < widget_configs.length; i++) {
            let component = component_arr[i];
            let config = widget_configs[i];

            if (typeof config.data === 'function') {
                config.data = config.data();
            }

            if (config.component_type === 'ReportComponentWrapper') {
                config.height =
                    config.widget_config.height + this.measurements.component_wrapper_margin;
                config.template = 'tpl_report_component_wrapper_view';

                if (typeof config.widget_config.data === 'function') {
                    config.widget_config.data = config.widget_config.data();
                }
            }

            if (!component.hide()) {
                data_arr.push(config);
            }
        }

        return data_arr;
    }

    restore_dynamic_data(snapshot) {
        let snapshots = snapshot.map(config => {
            config.component = this.supported_components[config.component_type];
            return config;
        });
        this.snapshots(snapshots);
    }
}

export default ReportMultiComponentWrapper;
