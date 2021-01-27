/* Automatically transformed from AMD to ES6. Beware of code smell. */
import Checklist from 'src/libs/components/basic/Checklist';
import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import TextInput from 'src/libs/components/basic/TextInput';
import NewDropdown from 'src/libs/components/basic/NewDropdown';
import ActionButton from 'src/libs/components/basic/ActionButton';
import NewPopoverButton from 'src/libs/components/popovers/NewPopoverButton';
import Observer from 'src/libs/Observer';
import * as Utils from 'src/libs/Utils';
import CustomAttributeModal from 'src/libs/components/modals/CustomAttributeModal';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    let _dfd = self.new_deferred();

    self.template = opts.template || 'tpl_data_manager_top_form';
    self.vehicle_uid_event = opts.vehicle_uid_event;
    self.new_characteristics_event = Utils.gen_event('Characteristics.new', self.get_id());

    self.company_name = self.new_instance(TextInput, {
        id: 'name',
        label: 'Name',
        allow_empty: false,
    });

    self.deal_team_leader = self.new_instance(TextInput, {
        id: 'deal_team_leader',
        label: 'Deal Team leader',
    });

    self.deal_team_second = self.new_instance(TextInput, {
        id: 'deal_team_second',
        label: 'Deal Team second',
    });

    self.sector = self.new_instance(NewDropdown, {
        id: 'sector_input',
        label: 'Sector',
        btn_css: {'btn-ghost-default': true},
        datasource: {
            type: 'dynamic',
            query: {
                target: 'enum_sectors',
            },
        },
    });

    self.industry = self.new_instance(NewDropdown, {
        id: 'industry_input',
        label: 'Industry',
        btn_css: {'btn-ghost-default': true},
        strings: {
            empty: 'Select sector first',
        },
        datasource: {
            type: 'dynamic',
            query: {
                target: 'enum_industries',
                sector_id: {
                    type: 'observer',
                    mapping: 'get_value',
                    event_type: Utils.gen_event('Dropdown.state', self.sector.get_id()),
                    required: true,
                },
            },
        },
    });

    self.deal_source = self.new_instance(NewDropdown, {
        id: 'deal_source_input',
        label: 'Deal Source',
        btn_css: {'btn-ghost-default': true},
        datasource: {
            type: 'dynamic',
            query: {
                target: 'static_enums',
                enum_type: 'company_deal_source',
            },
        },
    });

    self.deal_type = self.new_instance(NewDropdown, {
        id: 'deal_type_input',
        label: 'Deal Type',
        btn_css: {'btn-ghost-default': true},
        datasource: {
            type: 'dynamic',
            query: {
                target: 'static_enums',
                enum_type: 'company_deal_type',
            },
        },
    });

    self.deal_role = self.new_instance(NewDropdown, {
        id: 'deal_role_input',
        label: 'Deal Role',
        btn_css: {'btn-ghost-default': true},
        datasource: {
            type: 'dynamic',
            query: {
                target: 'static_enums',
                enum_type: 'company_deal_role',
            },
        },
    });

    self.seller_type = self.new_instance(NewDropdown, {
        id: 'seller_type_input',
        label: 'Seller Type',
        btn_css: {'btn-ghost-default': true},
        datasource: {
            type: 'dynamic',
            query: {
                target: 'static_enums',
                enum_type: 'company_seller_type',
            },
        },
    });

    self.currency = self.new_instance(NewDropdown, {
        id: 'currency',
        label: 'Investment Currency',
        strings: {
            no_selection: 'Inherit from Fund',
        },
        disabled_property: 'read_only',
        datasource: {
            mapping: 'to_options',
            mapping_args: {
                value_key: 'id',
                label_keys: ['symbol', 'name'],
                additional_keys: ['symbol'],
            },
            type: 'dynamic',
            query: {
                target: 'currency:markets',
            },
        },
        btn_css: {'btn-ghost-default': true},
    });

    self.metric_currency = self.new_instance(NewDropdown, {
        id: 'metric_currency',
        label: 'Metric Currency',
        strings: {
            no_selection: 'Inherit from Investment Currency',
        },
        disabled_property: 'read_only',
        datasource: {
            mapping: 'to_options',
            mapping_args: {
                value_key: 'id',
                label_keys: ['symbol', 'name'],
                additional_keys: ['symbol'],
            },
            type: 'dynamic',
            query: {
                target: 'currency:markets',
            },
        },
        btn_css: {'btn-ghost-default': true},
    });

    self.valid = ko.computed(() => {
        return self.company_name.valid() && Utils.is_set(self.company_name.value(), true);
    });

    self.button = self.new_instance(ActionButton, {
        id: 'add_company',
        action: 'add_company',
        label: 'Add Company',
        css: {
            btn: true,
            'btn-ghost-default': true,
            'btn-sm': true,
            'pull-right': true,
        },
        disabled_callback: function(valid) {
            return !valid;
        },
        data: self.valid,
    });

    self.custom_attributes_button = self.new_instance(NewPopoverButton, {
        id: 'custom_characteristics',
        label: 'Custom Attributes',
        css: {
            'btn-ghost-success': true,
            'btn-popover': false,
            'btn-block': true,
        },
        icon_css: 'glyphicon glyphicon-plus',
        popover_options: {
            title: 'Select Attributes',
            placement: 'bottom',
            css_class: 'popover-cpanel',
        },
        popover_config: {
            component: Checklist,
            event_button: {
                label: 'New',
                event: self.new_characteristics_event,
            },
            datasource: {
                type: 'dynamic',
                mapping: 'to_self_encapsulated_options',
                mapping_args: {
                    label_key: 'name',
                    selected: 'selected_member_key',
                },
                query: {
                    target: 'custom_attributes_with_values',
                },
            },
        },
    });

    self.forms = [
        self.company_name,
        self.deal_team_leader,
        self.deal_team_second,
        self.currency,
        self.metric_currency,
        self.sector,
        self.industry,
        self.deal_source,
        self.deal_type,
        self.deal_role,
        self.seller_type,
    ];

    self.custom_attributes = ko.observableArray([]);

    self.form_layout = ko.computed(() => {
        let form_layout = [];
        let forms = self.forms.concat(self.custom_attributes());

        for (let i = 0, j = forms.length / 4; i < j; i++) {
            form_layout.push(forms.slice(i * 4, (i + 1) * 4));
        }

        if (form_layout[form_layout.length - 1].length <= 3) {
            form_layout[form_layout.length - 1].push(self.custom_attributes_button);
        } else {
            form_layout.push([self.custom_attributes_button]);
        }

        return form_layout;
    });

    self.update_characteristics_form = function(characteristics) {
        let dropdowns = [];
        if (characteristics && characteristics.length) {
            for (let item of characteristics) {
                let uid = item.data.uid;
                let label = item.label;
                let members = item.data.members;
                let selected_member_uid = item.data.selected_member_uid;

                let _dropdown = new NewDropdown({
                    label: label,
                    data: members,
                    label_key: 'name',
                    value_key: 'uid',
                    btn_css: {
                        'btn-ghost-default': true,
                        'vertical-margins': true,
                    },
                    attribute_uid: uid,
                });

                if (selected_member_uid) {
                    _dropdown.set_selected_by_value(selected_member_uid);
                }

                dropdowns.push(_dropdown);
            }
        }

        self.custom_attributes(dropdowns);
    };

    self.column_css = 'col-xs-3';

    self.clear = function() {
        self.form_layout()
            .flatten()
            .forEach(component => {
                component.clear();
            });
    };

    self.new_custom_attribute_modal = self.new_instance(CustomAttributeModal, {
        id: 'new_custom_attribute_modal',
    });
    self.when(...self.forms, self.button).done(() => {
        Observer.register(self.new_characteristics_event, self.new_custom_attribute_modal.show);

        self.custom_attributes_button.popover.selected.subscribe(self.update_characteristics_form);

        Observer.register_for_id(self.button.get_id(), 'ActionButton.action.add_company', () => {
            let custom_attributes = {};
            for (let custom_attribute of self.custom_attributes()) {
                custom_attributes[
                    custom_attribute.opts.attribute_uid
                ] = custom_attribute.selected_value();
            }

            let company_data = {
                name: self.company_name.value(),
                deal_team_leader: self.deal_team_leader.value(),
                deal_team_second: self.deal_team_second.value(),
                industry_id: self.industry.selected_value(),
                sector_id: self.sector.selected_value(),
                deal_source: self.deal_source.selected_value(),
                deal_type: self.deal_type.selected_value(),
                deal_role: self.deal_role.selected_value(),
                seller_type: self.seller_type.selected_value(),
                currency: self.currency.selected_value(),
                metric_currency: self.metric_currency.selected_value(),
                custom_attributes: custom_attributes,
            };

            Observer.broadcast_for_id(self.get_id(), 'CompanyForm.add_company', company_data);
        });

        _dfd.resolve();
    });

    return self;
}
