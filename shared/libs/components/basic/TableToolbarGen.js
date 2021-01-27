/* Automatically transformed from AMD to ES6. Beware of code smell. */
/**
 *   Horizontal toolbar often used in conjunction with DataTable
 *
 */
import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import Observer from 'src/libs/Observer';
import ActionButtons from 'src/libs/components/basic/ActionButtons';
import NewPopoverButton from 'src/libs/components/popovers/NewPopoverButton';
import AttributeFilters from 'src/libs/components/AttributeFilters';
import TextInput from 'src/libs/components/basic/TextInput';
import Checklist from 'src/libs/components/basic/Checklist';
import * as Utils from 'src/libs/Utils';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    let dfd = self.new_deferred();

    self.template = opts.template || 'tpl_table_toolbar_gen';
    self.cashflow_types = opts.cashflow_types;

    if (opts.vehicle_uid_event) {
        self.vehicle_uid_event = opts.vehicle_uid_event;
        self.vehicle_uid = ko.observable();
    }

    self.buttons = opts.buttons || [
        self.new_instance(TextInput, {
            id: 'name',
            template: 'tpl_text_input',
            placeholder: 'Search by name',
            css: {
                'input-sm': true,
            },
            enable_data_updates: true,
        }),

        self.new_instance(NewPopoverButton, {
            id: 'portfolio',
            label: 'Portfolio',
            icon_css: 'glyphicon glyphicon-plus',
            css: {
                'btn-table-toolbar': true,
                'btn-block': true,
            },
            popover_options: {
                title: 'Portfolio',
                placement: 'bottom',
                css_class: 'popover-ghost-info',
            },
            popover_config: {
                component: Checklist,
                min_width: 400,
                enable_filter: true,
                strings: {
                    no_selection: 'All',
                },
                label_key: 'name',
                value_key: 'entity_uid',
                datasource: {
                    type: 'dynamic',
                    key: 'results',
                    query: {
                        target: 'vehicles',
                        results_per_page: 'all',
                        filters: {
                            entity_type: ['portfolio'],
                            cashflow_type: self.cashflow_types,
                        },
                    },
                },
            },
        }),

        self.new_instance(NewPopoverButton, {
            id: 'vintage_year',
            label: 'Vintage Year',
            label_track_selection: false,
            icon_css: 'glyphicon glyphicon-plus',
            css: {
                'btn-table-toolbar': true,
                'btn-block': true,
            },
            popover_options: {
                title: 'Vintage Years',
                placement: 'bottom',
                css_class: 'popover-ghost-info',
            },
            popover_config: {
                component: Checklist,
                enable_filter: true,
                strings: {
                    no_selection: 'Any',
                },
                datasource: {
                    type: 'static',
                    mapping: 'list_to_options',
                    data: Utils.valid_vintage_years(),
                },
            },
        }),

        self.new_instance(AttributeFilters, {
            id: 'enum_attributes',
            css: {
                'btn-table-toolbar': true,
                'btn-block': true,
            },
            popover_css_class: 'popover-ghost-info',
            enable_localstorage: true,
            active_template: 'horizontal',
            placement: 'bottom',
            clear_btn_css: {
                'btn-ghost-default': true,
            },
            datasource: {
                type: 'dynamic',
                query: {
                    target: 'filter_configs',
                    public_taxonomy: true,
                    exclude_enums: ['vertical', 'status'],
                },
            },
        }),
    ];

    self.action_buttons = self.new_instance(ActionButtons, {
        id: 'action_buttons',
        template: 'tpl_anchor_action_buttons',
        buttons: self.buttons,
    });

    self.clear = function() {
        for (let button of self.buttons) {
            if (typeof button.clear === 'function') {
                button.clear();
            }
        }
    };

    self.when(...self.buttons, self.action_buttons).done(() => {
        if (self.vehicle_uid_event) {
            Observer.register(self.vehicle_uid_event, uid => {
                self.vehicle_uid(uid);
                self.datasource.refresh_data(true);
            });
        }

        dfd.resolve();
    });

    return self;
}
