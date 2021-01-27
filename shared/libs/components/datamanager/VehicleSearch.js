/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ActionButton from 'src/libs/components/basic/ActionButton';
import DataTable from 'src/libs/components/basic/DataTable';
import Breadcrumb from 'src/libs/components/basic/Breadcrumb';
import BreadcrumbHeader from 'src/libs/components/basic/BreadcrumbHeader';
import ActionHeader from 'src/libs/components/basic/ActionHeader';
import ko from 'knockout';
import auth from 'auth';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import Aside from 'src/libs/components/basic/Aside';
import DataManagerSearchModal from 'src/libs/components/how_to_modals/DataManagerSearchModal';
import Observer from 'src/libs/Observer';
import * as Utils from 'src/libs/Utils';
import DataManagerHelper from 'src/libs/helpers/DataManagerHelper';
import VehicleHelper from 'src/libs/helpers/VehicleHelper';
import * as Formatters from 'src/libs/Formatters';
import * as Mapping from 'src/libs/Mapping';
import DropdownButtons from 'src/libs/components/basic/DropdownButtons';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    let _dfd = self.new_deferred();

    self.results_per_page = opts.results_per_page || 50;

    self.clear_event = opts.clear_event;

    if (opts.permissions_event) {
        self.permissions_event = Observer.map(opts.permissions_event, payload => {
            if (payload.length == 0) {
                return ['write', 'share'];
            }
            return Mapping.get_values(payload, {});
        });
    }

    self.cpanel_id = opts.cpanel_id;
    self.data_table_id = Utils.gen_id(self.get_id(), 'body', 'entities_table');

    self.unarchive_visible_event = Utils.gen_event(
        'ActionButton.visible',
        self.get_id(),
        'unarchive',
    );
    self.archive_visible_event = Utils.gen_event('ActionButton.visible', self.get_id(), 'archive');

    Observer.register(
        Utils.gen_event(
            'BooleanButton.state',
            self.cpanel_id,
            'tools',
            'vehicles',
            'view_archive_toggle',
        ),
        state => {
            Observer.broadcast(self.unarchive_visible_event, !state);
            Observer.broadcast(self.archive_visible_event, state);
        },
    );

    self.archived = Observer.observable(
        Utils.gen_event(
            'BooleanButton.state',
            self.cpanel_id,
            'tools',
            'vehicles',
            'view_archive_toggle',
        ),
    ).extend({rateLimit: 250});

    DataManagerHelper.register_upload_wizard_event(
        Utils.gen_event(
            'ActionButton.action.upload',
            self.get_id(),
            'body',
            'action_toolbar',
            'upload',
        ),
    );

    DataManagerHelper.register_upload_wizard_event(
        Utils.gen_event(
            'ActionButton.action.upload',
            self.get_id(),
            'body',
            'entities_table',
            'upload',
        ),
    );

    DataManagerHelper.register_create_new_entity_action_button(
        Utils.gen_id(self.get_id(), 'body', 'action_toolbar', 'new'),
    );

    self.register_export_id = Utils.gen_id(
        self.get_id(),
        'body',
        'action_toolbar',
        'export_actions',
    );

    self.toolbar_buttons = [
        DataManagerHelper.buttons.new_entity({
            data_table_id: self.data_table_id,
            disable_on_selection: true,
        }),
        DataManagerHelper.buttons.upload({}),
        {
            component: DropdownButtons,
            label: 'Selection',
            css: {
                'btn-transparent': true,
            },
            icon_css: 'glyphicon glyphicon-option-vertical',
            buttons: [
                DataManagerHelper.buttons.new_portfolio_from_selection({
                    data_table_id: self.data_table_id,
                    label: 'Create Portfolio',
                }),
                DataManagerHelper.buttons.export_attributes({
                    data_table_id: self.data_table_id,
                    label: 'Generate Attribute Template',
                }),
                DataManagerHelper.buttons.archive_entities({
                    data_table_id: self.data_table_id,
                    visible_event: self.archive_visible_event,
                    label: 'Archive',
                }),
                DataManagerHelper.buttons.unarchive_entities({
                    data_table_id: self.data_table_id,
                    visible_event: self.unarchive_visible_event,
                    default_visibility: 'hidden',
                    label: 'Restore',
                }),
                DataManagerHelper.buttons.delete_entities({
                    data_table_id: self.data_table_id,
                    check_permissions: true,
                    label: 'Delete',
                }),
                DataManagerHelper.buttons.share({
                    data_table_id: self.data_table_id,
                    check_permissions: true,
                    label: 'Share',
                }),
            ],
        },
    ];

    if (auth.user_has_feature('diligence')) {
        self.toolbar_buttons.push(
            DataManagerHelper.buttons.diligence({
                data_table_id: self.data_table_id,
            }),
        );
    }
    self.body = self.new_instance(Aside, {
        id: 'body',
        template: 'tpl_body',
        layout: {
            header: 'header',
            toolbar: 'action_toolbar',
            body: 'entities_table',
        },
        components: [
            {
                id: 'action_toolbar',
                component: ActionHeader,
                template: 'tpl_action_toolbar',
                valid_export_features: ['analytics'],
                data_table_id: self.data_table_id,
                datasource: {
                    type: 'observer',
                    event_type: Utils.gen_event('DataTable.selected', self.data_table_id),
                },
                buttons: self.toolbar_buttons,
            },
            {
                component: BreadcrumbHeader,
                id: 'header',
                template: 'tpl_breadcrumb_header',
                buttons: [
                    {
                        id: 'tips',
                        label:
                            'How to Use <span class="glyphicon glyphicon-info-sign" style="margin-right:5px;"></span>',
                        action: 'show_modal',
                    },
                ],
                layout: {
                    breadcrumb: 'breadcrumb',
                },
                components: [
                    {
                        id: 'breadcrumb',
                        component: Breadcrumb,
                        items: [
                            {
                                label: 'Data Manager',
                                link: '#!/data-manager',
                            },
                            {
                                label: 'Vehicles',
                            },
                        ],
                    },
                ],
            },
            {
                component: DataTable,
                id: 'entities_table',
                enable_localstorage: true,
                enable_selection: true,
                enable_column_toggle: true,
                enable_clear_order: true,
                enable_csv_export: false,
                empty_template: ko.pureComputed(() => {
                    if (self.archived()) {
                        return 'tpl_data_table_empty_data_manager_archived';
                    }

                    return 'tpl_data_table_empty_data_manager';
                }),
                column_toggle_css: {'fixed-column-toggle': true},
                css: {'table-light': true, 'table-sm': true},
                results_per_page: self.results_per_page,
                clear_order_event: self.clear_event,
                register_export: {
                    export_event_id: self.register_export_id,
                    title: 'Search Results',
                    subtitle: 'CSV',
                },
                components: [
                    {
                        id: 'upload',
                        component: ActionButton,
                        label: 'Upload <span class="icon-upload"></span>',
                        action: 'upload',
                        css: {
                            btn: true,
                            'btn-lg': true,
                            'btn-success': true,
                        },
                    },
                ],
                dynamic_columns: [
                    {
                        datasource: {
                            type: 'dynamic',
                            query: {
                                target: 'table_columns',
                                public_taxonomy: true,
                            },
                        },
                        placement: {
                            relative: 'Name',
                            position: 'right',
                        },
                    },
                ],
                columns: [
                    {
                        label: 'Name',
                        sort_key: 'name',
                        formatter: function(data) {
                            if (self.archived()) {
                                return data.name;
                            }

                            let args = {
                                base_url: '#!/data-manager/vehicles',
                            };

                            if (data.remote_client_uid) {
                                args.base_url += '/remote';
                            }

                            return Formatters.entity_link(data, false, args);
                        },
                        css: ko.pureComputed(() => {
                            if (self.archived()) {
                                return {'disabled-link': true};
                            }

                            return {
                                'table-field': true,
                                'disabled-link': false,
                            };
                        }),
                    },
                ].concat(VehicleHelper.search_columns),
                datasource: {
                    type: 'dynamic',
                    query: {
                        target: 'vehicles',
                        results_per_page: self.results_per_page,
                        show_hidden: {
                            type: 'observer',
                            event_type: Utils.gen_event(
                                'BooleanButton.state',
                                self.cpanel_id,
                                'tools',
                                'vehicles',
                                'view_archive_toggle',
                            ),
                            default: false,
                        },
                        filters: {
                            type: 'dynamic',
                            query: {
                                permissions: {
                                    type: 'observer',
                                    event_type: self.permissions_event,
                                    default: ['write', 'share'],
                                },
                                exclude_portfolio_only: true,
                                exclude_package_content: true,
                                include_diligence_funds: true,
                                name: {
                                    type: 'observer',
                                    event_type: Utils.gen_event(
                                        'StringFilter.value',
                                        self.cpanel_id,
                                        'tools',
                                        'vehicles',
                                        'name',
                                    ),
                                    default: '',
                                },
                                enums: {
                                    type: 'observer',
                                    event_type: Utils.gen_event(
                                        'AttributeFilters.state',
                                        self.cpanel_id,
                                        'tools',
                                        'vehicles',
                                        'enum_attributes',
                                    ),
                                },
                                diligence: {
                                    type: 'observer',
                                    event_type: Utils.gen_event(
                                        'BooleanButton.state',
                                        self.cpanel_id,
                                        'tools',
                                        'vehicles',
                                        'diligence_toggle',
                                    ),
                                    default: [],
                                },
                                entity_type: {
                                    type: 'observer',
                                    event_type: Utils.gen_event(
                                        'PopoverButton.value',
                                        self.cpanel_id,
                                        'tools',
                                        'vehicles',
                                        'entity_type',
                                    ),
                                    default: ['user_fund', 'portfolio'],
                                },
                                cashflow_type: {
                                    type: 'observer',
                                    event_type: Utils.gen_event(
                                        'PopoverButton.value',
                                        self.cpanel_id,
                                        'tools',
                                        'vehicles',
                                        'cashflow_type',
                                    ),
                                    default: [],
                                },
                                vintage_year: {
                                    type: 'observer',
                                    event_type: Utils.gen_event(
                                        'PopoverButton.value',
                                        self.cpanel_id,
                                        'tools',
                                        'vehicles',
                                        'vintage_year',
                                    ),
                                    default: [],
                                },
                                as_of_date: {
                                    type: 'observer',
                                    event_type: Utils.gen_event(
                                        'PopoverButton.value',
                                        self.cpanel_id,
                                        'tools',
                                        'vehicles',
                                        'as_of_date',
                                    ),
                                    default: [],
                                },
                                shared_by: {
                                    type: 'observer',
                                    event_type: Utils.gen_event(
                                        'PopoverButton.value',
                                        self.cpanel_id,
                                        'tools',
                                        'vehicles',
                                        'shared_by',
                                    ),
                                    default: [],
                                },
                                base_currency_symbol: {
                                    type: 'observer',
                                    event_type: Utils.gen_event(
                                        'PopoverButton.value',
                                        self.cpanel_id,
                                        'tools',
                                        'vehicles',
                                        'base_currency_symbol',
                                    ),
                                    default: [],
                                },
                                commitment: {
                                    type: 'observer',
                                    event_type: Utils.gen_event(
                                        'PopoverButton.value',
                                        self.cpanel_id,
                                        'tools',
                                        'vehicles',
                                        'commitment',
                                    ),
                                    default: [],
                                },
                                total_value: {
                                    type: 'observer',
                                    event_type: Utils.gen_event(
                                        'PopoverButton.value',
                                        self.cpanel_id,
                                        'tools',
                                        'vehicles',
                                        'total_value',
                                    ),
                                    default: [],
                                },
                                irr: {
                                    type: 'observer',
                                    event_type: Utils.gen_event(
                                        'PopoverButton.value',
                                        self.cpanel_id,
                                        'tools',
                                        'vehicles',
                                        'irr',
                                    ),
                                    default: [],
                                },
                                tvpi: {
                                    type: 'observer',
                                    event_type: Utils.gen_event(
                                        'PopoverButton.value',
                                        self.cpanel_id,
                                        'tools',
                                        'vehicles',
                                        'tvpi',
                                    ),
                                    default: [],
                                },
                                dpi: {
                                    type: 'observer',
                                    event_type: Utils.gen_event(
                                        'PopoverButton.value',
                                        self.cpanel_id,
                                        'tools',
                                        'vehicles',
                                        'dpi',
                                    ),
                                    default: [],
                                },
                                in_portfolio_uid: {
                                    type: 'observer',
                                    event_type: Utils.gen_event(
                                        'PopoverButton.value',
                                        self.cpanel_id,
                                        'tools',
                                        'vehicles',
                                        'in_portfolio',
                                    ),
                                    default: [],
                                },
                                remote_clients: {
                                    type: 'observer',
                                    event_type: Utils.gen_event(
                                        'PopoverButton.value',
                                        self.cpanel_id,
                                        'tools',
                                        'vehicles',
                                        'remote_client',
                                    ),
                                    mapping: 'get_values',
                                    mapping_args: {
                                        key: 'uid',
                                    },
                                    default: [],
                                },
                            },
                        },
                    },
                },
            },
        ],
    });

    self.when(self.body).done(() => {
        Observer.register_for_id(
            Utils.gen_id(self.get_id(), 'body', 'header', 'tips'),
            'ActionButton.action.show_modal',
            () => {
                self.tips_modal = self.new_instance(DataManagerSearchModal, {
                    id: 'tips_modal',
                });

                self.tips_modal.show();
            },
        );

        _dfd.resolve();
    });

    return self;
}
