import ko from 'knockout';

import {gen_mapping} from 'src/libs/Mapping';
import BaseComponent from 'src/libs/components/basic/BaseComponent';

const DEFAULT_TEMPLATE = `
    <div class="report-settings-sections" data-bind="foreach: sections">
        <div class="report-settings-section">
            <h3
                class="report-settings-section-title"
                data-bind="html: title"
            ></h3>
            <p
                class="report-settings-section-description"
                data-bind="html: description"
            ></p>

            <div class="report-settings-section-components">
                <div class="row row-margins" data-bind="foreach: settings">
                    <div
                        data-bind="
                            css: column_css,
                            visible: visible
                        "
                    >
                        <!-- ko renderComponent: component -->
                        <!-- /ko -->
                    </div>
                </div>
            </div>
        </div>
    </div>
`;

class DataReportSettings extends BaseComponent {
    constructor(opts = {}, components = {}) {
        super(opts, components);
        let _dfd = this.new_deferred();

        this.define_default_template(DEFAULT_TEMPLATE);

        this.section_configs = opts.sections;

        this.sections = ko.observableArray([]);

        _dfd.resolve();
    }

    reset_settings() {
        for (let component of Object.values(this.components)) {
            switch (component.__class__) {
                case 'BooleanButton':
                    component.clear();
                    break;
                case 'NewPopoverButton':
                case 'PopoverButton':
                    component.clear();
                    component.restore_defaults();
                    break;
                case 'AttributeFilters':
                    component.clear();
                    break;
                default:
                    break;
            }
        }
    }

    update_sections(sub_type) {
        let sections = [];

        if (sub_type) {
            let configs = this.section_configs[sub_type];

            if (configs) {
                for (let config of configs) {
                    let section = {
                        title: config.title,
                        description: config.description,
                        settings: [],
                    };

                    for (let s of config.settings) {
                        section.settings.push({
                            key: s.key || s.component_id,
                            component: this.components[s.component_id],
                            mapping: gen_mapping(s),
                            column_css: s.column_css || 'col-xs-12 col-md-4',
                            visible: ko.pureComputed(() => {
                                if (s.visible_callback) {
                                    return s.visible_callback(this.get_settings());
                                }

                                return true;
                            }),
                        });
                    }

                    sections.push(section);
                }
            }
        }

        this.sections(sections);
    }

    restore_settings(settings) {
        let sections = this.sections();

        for (let section of sections) {
            for (let s of section.settings) {
                if (s.key in settings) {
                    let value = settings[s.key];

                    switch (s.component.__class__) {
                        case 'BooleanButton':
                            s.component.set_inner_state(value);
                            break;
                        case 'NewPopoverButton':
                            s.component.set_inner_state(value);
                            break;
                        case 'PopoverButton':
                            s.component.set_inner_state(value);
                            break;
                        case 'AttributeFilters':
                            s.component.set_state(value);
                            break;
                        default:
                            throw oneLine`
                            Unknown component ${s.component.id} in
                            settings...
                        `;
                    }
                }
            }
        }
    }

    get_settings() {
        let sections = this.sections();

        let settings = {};

        for (let section of sections) {
            for (let s of section.settings) {
                switch (s.component.__class__) {
                    case 'BooleanButton':
                        if (!s.component.disabled()) {
                            settings[s.key] = s.mapping(s.component.state());
                        }
                        break;
                    case 'NewPopoverButton':
                        settings[s.key] = s.mapping(s.component.get_value());
                        break;
                    case 'PopoverButton':
                        settings[s.key] = s.mapping(s.component.inner_value());
                        break;
                    case 'AttributeFilters':
                        settings[s.key] = s.mapping(s.component.get_value());
                        break;
                    default:
                        throw `
                        Unknown component ${s.component.id}
                        in settings...
                    `;
                }
            }
        }

        return settings;
    }
}

export default DataReportSettings;
