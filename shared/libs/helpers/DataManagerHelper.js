/* Automatically transformed from AMD to ES6. Beware of code smell. */
import pager from 'pager';
import BaseHelper from 'src/libs/helpers/BaseHelper';
import * as Formatters from 'src/libs/Formatters';
import DataThing from 'src/libs/DataThing';
import Observer from 'src/libs/Observer';
import * as Utils from 'src/libs/Utils';
import SpreadsheetUploadWizard from 'src/libs/components/upload/SpreadsheetUploadWizard';
import AttributeFilters from 'src/libs/components/AttributeFilters';
import NewPopoverButton from 'src/libs/components/popovers/NewPopoverButton';
import ActionButton from 'src/libs/components/basic/ActionButton';
import PopoverInputRange from 'src/libs/components/popovers/PopoverInputRange';
import ActionButtons from 'src/libs/components/basic/ActionButtons';
import CreatePortfolioModal from 'src/libs/components/modals/CreatePortfolioModal';
import AttachDiligenceModal from 'src/libs/components/modals/AttachDiligenceModal';
import DetachDiligenceModal from 'src/libs/components/modals/DetachDiligenceModal';
import ConfirmModal from 'src/libs/components/modals/ConfirmModal';
import ShareModal from 'src/libs/components/modals/ShareModal';
import DeleteModal from 'src/libs/components/modals/DeleteModal';
import ArchiveModal from 'src/libs/components/modals/ArchiveModal';
import UnArchiveModal from 'src/libs/components/modals/UnArchiveModal';
import ExportAttributesModal from 'src/libs/components/modals/ExportAttributesModal';
import NewDiligenceModal from 'src/libs/components/diligence/NewDiligenceModal';
import RenameDiligenceModal from 'src/libs/components/diligence/RenameDiligenceModal';
import DataSource from 'src/libs/DataSource';
import auth from 'auth';

let self = new BaseHelper();

self.view_in_analytics = function(data) {
    const url = Formatters.entity_analytics_url(data);
    if (url) {
        pager.navigate(url);
    }
};

self.view_in_datamanager = function(data) {
    let url = Formatters.entity_edit_url(data);
    if (url) {
        pager.navigate(url);
    }
};

// self.view_in_analytics_event = Utils.gen_event('DataManager.view_in_analytics', self.get_id())
// self.view_in_datamanager_event = Utils.gen_event('DataManager.view_in_datamanager', self.get_id())
// self.create_new_entity_event = Utils.gen_event('DataManager.crete_new_entity', self.get_id())

self._ensure_portfolio = DataThing.backends.useractionhandler({
    url: 'ensure_portfolio',
});

self._ensure_user_fund = DataThing.backends.useractionhandler({
    url: 'ensure_user_fund',
});

if (auth.user_has_feature('diligence')) {
    self.diligence_datasource = self.new_instance(DataSource, {
        datasource: {
            type: 'dynamic',
            query: {
                target: 'diligence_list',
            },
        },
    });
}

self.upload_wizard = self.new_instance(SpreadsheetUploadWizard, {});

self.create_new_entity = function(action) {
    switch (action) {
        case 'create_company':
            pager.navigate('#!/data-manager/companies/new');
            return;
        case 'create_net_fund':
        case 'create_gross_fund':
            return self._ensure_user_fund({
                data: {
                    cashflow_type: action.includes('net') ? 'net' : 'gross',
                },
                success: DataThing.api.XHRSuccess(response => {
                    let url = Formatters.entity_edit_url({
                        entity_type: 'user_fund',
                        user_fund_uid: response.user_fund.uid,
                        cashflow_type: response.user_fund.cashflow_type,
                    });

                    if (url) {
                        pager.navigate(url);
                    }
                }),
            });
        case 'create_net_portfolio':
        case 'create_gross_portfolio':
            return self._ensure_portfolio({
                data: {
                    cashflow_type: action.includes('net') ? 'net' : 'gross',
                },
                success: DataThing.api.XHRSuccess(response => {
                    let url = Formatters.entity_edit_url({
                        entity_type: 'portfolio',
                        portfolio_uid: response.portfolio.uid,
                        cashflow_type: response.portfolio.cashflow_type,
                    });

                    if (url) {
                        pager.navigate(url);
                    }
                }),
            });
    }
};

self.diligence = function(action) {
    switch (action) {
        case 'create_diligence':
        case 'attach_to_diligence':
        case 'detach_diligence':
            return {};
    }
};

self.register_upload_wizard_event = function(evt) {
    Observer.register(evt, () => {
        self.upload_wizard.show();
    });
};

self.register_upload_wizard_events = function(evts) {
    for (let i = 0, l = evts.length; i < l; i++) {
        self.register_upload_wizard_event(evts[i]);
    }
};

self.register_view_in_analytics_event = function(evt) {
    Observer.register(evt, data => {
        self.view_in_analytics(data);
    });
};

self.register_view_in_analytics_events = function(evts) {
    for (let i = 0, l = evts.length; i < l; i++) {
        self.register_view_in_analytics_event(evts[i]);
    }
};

self.register_view_in_datamanager_event = function(evt) {
    Observer.register(evt, data => {
        self.view_in_datamanager(data);
    });
};

self.register_view_in_datamanager_events = function(evts) {
    for (let i = 0, l = evts.length; i < l; i++) {
        self.register_view_in_datamanager_event(evts[i]);
    }
};

self.register_create_new_entity_event = function(evt, action) {
    Observer.register(evt, () => {
        self.create_new_entity(action);
    });
};

self.register_diligence_event = function(evt, action) {
    Observer.register(evt, () => {
        self.diligence(action);
    });
};

self.register_diligence_action_button = function(action_buttons_id) {
    let diligence_actions = ['create_diligence', 'attach_to_diligence', 'detach_diligence'];

    diligence_actions.forEach(action => {
        let evt = Utils.gen_event(`ActionButtons.action.${action}`, action_buttons_id);
        self.register_diligence_event(evt, action);
    });
};

self.register_create_new_entity_action_button = function(action_buttons_id) {
    let new_entity_actions = [
        'create_company',
        'create_net_fund',
        'create_gross_fund',
        'create_net_portfolio',
        'create_gross_portfolio',
    ];

    new_entity_actions.forEach(action => {
        let evt = Utils.gen_event(`ActionButtons.action.${action}`, action_buttons_id);
        self.register_create_new_entity_event(evt, action);
    });
};

self.register_create_new_entity_action_buttons = function(action_buttons_ids) {
    for (let i = 0, l = action_buttons_ids.length; i < l; i++) {
        self.register_create_new_entity_action_button(action_buttons_ids[i]);
    }
};

self.buttons = {
    export_attributes: function(opts) {
        return {
            id: 'export_attributes',
            label: opts.label || 'Generate Attribute Template <span class="icon-chart-bar"></span>',
            action: 'export_attributes',
            trigger_modal: {
                id: 'attributes_modal',
                component: ExportAttributesModal,
            },
            use_header_data: true,
            disabled_callback: function(data) {
                return data.length <= 0;
            },
            css: {
                btn: true,
                'btn-transparent-info': true,
            },
            datasource: {
                type: 'observer',
                default: [],
                mapping: entities =>
                    entities.filter(({entity_type, vehicle_count}) => {
                        if (entity_type === 'portfolio') {
                            return vehicle_count > 0;
                        }

                        return entity_type === 'user_fund';
                    }),
                event_type: Utils.gen_event('DataTable.selected', opts.data_table_id),
            },
        };
    },
    view_in_analytics: function(opts) {
        opts = opts || {};
        let config = {
            id: 'view_in_analytics',
            label: 'View in Analytics <span class="icon-chart-bar"></span>',
            action: 'view_in_analytics',
            use_header_data: true,
            disabled_callback: function(data) {
                return !data;
            },
            css: {
                btn: true,
                'btn-transparent-info': true,
            },
        };

        if (opts.visible_event) {
            config['visible_event'] = opts.visible_event;
        }

        return config;
    },
    view_in_datamanager: function(opts) {
        opts = opts || {};
        let config = {
            id: 'view_in_datamanager',
            label: 'Edit <span class="icon-wrench"></span>',
            action: 'view_in_datamanager',
            use_header_data: true,
            css: {
                btn: true,
                'btn-transparent': true,
            },
        };

        if (opts.check_permissions) {
            config['disabled_callback'] = function(data) {
                return !data || !data.write;
            };
        }

        return config;
    },
    upload: function() {
        return {
            id: 'upload',
            label: 'Upload <span class="icon-upload"></span>',
            action: 'upload',
            css: {
                btn: true,
                'btn-transparent-success': true,
            },
        };
    },
    share: function(opts) {
        opts = opts || {};
        let config = {
            id: 'share',
            action: 'share_vehicles',
            trigger_modal: {
                id: 'share_modal',
                component: opts.component || ShareModal,
            },
            css: {
                btn: true,
                'btn-transparent': true,
            },
            disabled_callback: function(data) {
                return data.length < 1;
            },
        };

        if (opts.check_permissions) {
            config['disabled_callback'] = function(data) {
                if (Object.isArray(data)) {
                    return (
                        data.filter(entity => {
                            return entity.share;
                        }).length < 1
                    );
                }

                return !data || !data.share;
            };
        } else {
            config['disabled_callback'] = function(data) {
                if (Object.isArray(data)) {
                    return data.length < 1;
                }
            };
        }

        if (opts.data_table_id) {
            config['label'] = opts.label || 'Share Selected <span class="icon-share"></span>';
            config['datasource'] = {
                type: 'observer',
                default: [],
                event_type: Utils.gen_event('DataTable.selected', opts.data_table_id),
            };
        } else {
            config['label'] = opts.label || 'Share <span class="icon-share"></span>';
            config['use_header_data'] = true;
        }

        return config;
    },
    confirm: function(opts) {
        opts = opts || {};
        let confirm_event = Observer.gen_event_type();

        let config = {
            action: 'confirm',
            label: opts.label || 'Confirm',
            trigger_modal: {
                component: ConfirmModal,
                confirm_event: confirm_event,
                payload_from_data: true,
                text: opts.text,
            },
            css: {
                btn: true,
                'btn-transparent-danger': true,
            },
        };

        if (opts.check_permissions) {
            config['disabled_callback'] = function(data) {
                if (Object.isArray(data)) {
                    return (
                        data.filter(entity => {
                            return entity.write;
                        }).length < 1
                    );
                }

                return !data || !data.write;
            };
        } else {
            config['disabled_callback'] = function(data) {
                if (Object.isArray(data)) {
                    if (opts.single_selection) {
                        return data.length != 1;
                    }
                    return data.length < 1;
                }
            };
        }

        if (opts.data_table_id) {
            config['datasource'] = {
                type: 'observer',
                default: [],
                event_type: Utils.gen_event('DataTable.selected', opts.data_table_id),
            };
        } else if (opts.data) {
            config.data = opts.data;
        } else {
            config['use_header_data'] = true;
        }

        if (opts.visible_event) {
            config['visible_event'] = opts.visible_event;
        }

        Observer.register(confirm_event, payload => {
            opts.callback(payload);
        });

        return config;
    },
    delete_entities: function(opts) {
        opts = opts || {};
        let config = {
            id: 'delete',
            action: 'delete_selected',
            trigger_modal: {
                id: 'delete_modal',
                component: opts.component || DeleteModal,
                to_delete_table_columns: opts.table_columns,
                origin_url: opts.origin_url,
                vehicle_uid_event: opts.vehicle_uid_event,
                list_uid_event: opts.list_uid_event,
            },
            css: {
                btn: true,
                'btn-transparent-danger': true,
            },
        };

        if (opts.attribute_uid_event) {
            config.trigger_modal['attribute_uid_event'] = opts.attribute_uid_event;
        }

        if (opts.check_permissions) {
            config['disabled_callback'] = function(data) {
                if (Object.isArray(data)) {
                    return (
                        data.filter(entity => {
                            return entity.write;
                        }).length < 1
                    );
                }

                return !data || !data.write;
            };
        } else {
            config['disabled_callback'] = function(data) {
                if (Object.isArray(data)) {
                    return data.length < 1;
                }
            };
        }

        if (opts.data_table_id) {
            config['label'] = opts.label || 'Delete Selected <span class="icon-trash-1"></span>';
            config['datasource'] = {
                type: 'observer',
                default: [],
                event_type: Utils.gen_event('DataTable.selected', opts.data_table_id),
            };
        } else {
            config['label'] = opts.label || 'Delete <span class="icon-trash-1"></span>';
            config['use_header_data'] = true;
        }

        if (opts.visible_event) {
            config['visible_event'] = opts.visible_event;
        }

        return config;
    },
    delete_projects: function(opts) {
        opts = opts || {};

        let config = {
            id: 'delete_projects',
            action: 'delete_projects',
            trigger_modal: {
                id: 'delete_project_modal',
                component: opts.component || DeleteModal,
                to_delete_table_columns: opts.table_columns,
                origin_url: opts.origin_url,
                diligence_uid_event: opts.diligence_uid_event,
            },
            css: {
                btn: true,
                'btn-transparent-danger': true,
            },
            disabled_callback: function(data) {
                return data.length < 1;
            },
        };

        if (opts.check_permissions) {
            config['disabled_callback'] = function(data) {
                if (Object.isArray(data)) {
                    return (
                        data.filter(entity => {
                            return entity.share;
                        }).length < 1
                    );
                }

                return !data || !data.share;
            };
        } else {
            config['disabled_callback'] = function(data) {
                if (Object.isArray(data)) {
                    return data.length < 1;
                }
            };
        }

        if (opts.data_table_id) {
            config['label'] = opts.label || 'Delete Selected <span class="icon-trash-1"></span>';
            config['datasource'] = {
                type: 'observer',
                default: [],
                event_type: Utils.gen_event('DataTable.selected', opts.data_table_id),
            };
        } else {
            config['label'] = opts.label || 'Delete <span class="icon-trash-1"></span>';
            config['use_header_data'] = true;
        }

        if (opts.visible_event) {
            config['visible_event'] = opts.visible_event;
        }
        return config;
    },
    rename_project: function(opts) {
        opts = opts || {};

        let config = {
            id: 'rename_project',
            action: 'rename_project',
            trigger_modal: {
                id: 'rename_project',
                component: RenameDiligenceModal,
                origin_url: opts.origin_url,
                diligence_uid_event: opts.diligence_uid_event,
            },
            css: {
                btn: true,
                'btn-transparent-danger': true,
            },
            disabled_callback: function(data) {
                return data.length < 1;
            },
        };

        if (opts.check_permissions) {
            config['disabled_callback'] = function(data) {
                if (Object.isArray(data)) {
                    return (
                        data.filter(entity => {
                            return entity.share;
                        }).length < 1
                    );
                }

                return !data || !data.share;
            };
        } else {
            config['disabled_callback'] = function(data) {
                if (Object.isArray(data)) {
                    return data.length < 1;
                }
            };
        }

        if (opts.data_table_id) {
            config['label'] =
                opts.label || 'Rename Diligence <span class="glyphicon glyphicon-pencil"></span>';
            config['datasource'] = {
                type: 'observer',
                default: [],
                event_type: Utils.gen_event('DataTable.selected', opts.data_table_id),
            };
        }

        return config;
    },
    detach_entity: function(opts) {
        opts = opts || {};

        let config = {
            id: 'detach_entity',
            action: 'detach_entity',
            trigger_modal: {
                id: 'detach_entity_modal',
                component: DetachDiligenceModal,
                from_diligence_search: opts.from_diligence_search,
                to_delete_table_columns: opts.table_columns,
                origin_url: opts.origin_url,
                diligence_uid_event: opts.diligence_uid_event,
            },
            css: {
                btn: true,
                'btn-transparent-danger': true,
            },
        };

        if (opts.data_table_id) {
            config['label'] = opts.label || 'Detach Funds <span class="icon-unlink"></span>';
            config['datasource'] = {
                type: 'observer',
                default: [],
                event_type: Utils.gen_event('DataTable.selected_dropdown', opts.data_table_id),
            };
        } else {
            config['label'] = opts.label || 'Detach <span class="icon-trash-1"></span>';
            config['use_header_data'] = true;
        }

        if (opts.visible_event) {
            config['visible_event'] = opts.visible_event;
        }

        if (opts.disabled_callback) {
            config['disabled_callback'] = function(data) {
                if (Object.isArray(data)) {
                    return data.length < 1;
                }
            };
        }
        return config;
    },
    archive_entities: function(opts) {
        opts = opts || {};

        let config = {
            id: 'archive',
            id_callback: opts.id_callback,
            action: 'archive_selected',
            trigger_modal: {
                id: 'archive_modal',
                component: opts.component || ArchiveModal,
                to_archive_table_columns: opts.table_columns,
                origin_url: opts.origin_url,
                vehicle_uid_event: opts.vehicle_uid_event,
                list_uid_event: opts.list_uid_event,
            },
            css: {
                btn: true,
                'btn-transparent-danger': true,
            },
            visible_event: opts.visible_event,
            disabled_callback: function(data) {
                return data.length < 1;
            },
        };

        if (opts.check_permissions) {
            config['disabled_callback'] = function(data) {
                if (Object.isArray(data)) {
                    return (
                        data.filter(entity => {
                            return entity.share;
                        }).length < 1
                    );
                }

                return !data || !data.share;
            };
        } else {
            config['disabled_callback'] = function(data) {
                if (Object.isArray(data)) {
                    return data.length < 1;
                }
            };
        }

        if (opts.attribute_uid_event) {
            config.trigger_modal['attribute_uid_event'] = opts.attribute_uid_event;
        }

        if (opts.data_table_id) {
            config['label'] = opts.label || 'Archive Selected <span class="icon-clock"></span>';
            config['datasource'] = {
                type: 'observer',
                default: [],
                event_type: Utils.gen_event('DataTable.selected', opts.data_table_id),
            };
        } else {
            config['label'] = opts.label || 'Archive <span class="icon-clock"></span>';
            config['use_header_data'] = true;
        }

        return config;
    },
    unarchive_entities: function(opts) {
        opts = opts || {};

        let config = {
            id: 'unarchive',
            id_callback: opts.id_callback,
            action: 'unarchive_selected',
            trigger_modal: {
                id: 'unarchive_modal',
                component: opts.component || UnArchiveModal,
                to_unarchive_table_columns: opts.table_columns,
                origin_url: opts.origin_url,
                vehicle_uid_event: opts.vehicle_uid_event,
                list_uid_event: opts.list_uid_event,
            },
            css: {
                btn: true,
                'btn-transparent-danger': true,
            },
            visible_event: opts.visible_event,
            default_visibility: opts.default_visibility,
            disabled_callback: function(data) {
                return data.length < 1;
            },
        };

        if (opts.attribute_uid_event) {
            config.trigger_modal['attribute_uid_event'] = opts.attribute_uid_event;
        }

        if (opts.check_permissions) {
            config['disabled_callback'] = function(data) {
                if (Object.isArray(data)) {
                    return (
                        data.filter(entity => {
                            return entity.write;
                        }).length < 1
                    );
                }

                return !data || !data.write;
            };
        } else {
            config['disabled_callback'] = function(data) {
                if (Object.isArray(data)) {
                    return data.length < 1;
                }
            };
        }

        if (opts.data_table_id) {
            config['label'] = opts.label || 'Restore Selected <span class="icon-clock"></span>';
            config['datasource'] = {
                type: 'observer',
                default: [],
                event_type: Utils.gen_event('DataTable.selected', opts.data_table_id),
            };
        } else {
            config['label'] = opts.label || 'Restore <span class="icon-clock"></span>';
            config['use_header_data'] = true;
        }

        return config;
    },
    new_portfolio_from_selection: function(opts) {
        opts = opts || {};

        return {
            label:
                opts.label ||
                'Create Portfolio <span style="margin-left: 3px" class="glyphicon glyphicon-folder-open"></span>',
            action: 'create_empty_portfolio',
            trigger_modal: {
                component: CreatePortfolioModal,
            },
            disabled_callback: function(data) {
                let cashflow_type = Utils.mode(data, fund => {
                    return fund.cashflow_type;
                });

                let funds = data.filter(fund => {
                    return fund.cashflow_type === cashflow_type;
                });

                return funds.length < 1;
            },
            datasource: {
                type: 'observer',
                default: [],
                mapping: 'filter',
                mapping_args: {
                    key: 'entity_type',
                    values: ['user_fund', 'bison_fund'],
                },
                event_type: Utils.gen_event('DataTable.selected', opts.data_table_id),
            },
        };
    },
    diligence: function(opts) {
        opts = opts || {};
        let buttons = [
            {
                action: 'create_diligence',
                id: 'create_diligence',
                component: ActionButton,
                label:
                    '<span class="glyphicon glyphicon-share-alt"></span>&nbsp; &nbsp; Start Diligence Project',
                trigger_modal: {
                    component: NewDiligenceModal,
                    selected_funds: opts.selected_funds,
                    family_uid_event: self.family_uid_event,
                    modal_title: 'Create new diligence project',
                    submit_label: 'Create',
                    columns: [
                        {
                            label: 'Name',
                            key: 'name',
                        },
                        {
                            label: 'Created',
                            key: 'created',
                            format: 'backend_date',
                        },
                    ],
                },
                datasource: {
                    type: 'observer',
                    default: [],
                    mapping: 'filter',
                    mapping_args: {
                        key: 'entity_type',
                        values: ['user_fund', 'bison_fund'],
                    },
                    event_type: Utils.gen_event('DataTable.selected', opts.data_table_id),
                },
            },
            {
                label:
                    '<span class="glyphicon glyphicon-paperclip"></span>&nbsp; &nbsp; Attach to Diligence Project',
                action: 'attach_to_diligence',
                id: 'attach_to_diligence',
                trigger_modal: {
                    component: AttachDiligenceModal,
                    entity_type: 'user_fund',
                },
                disabled_callback: function(data) {
                    let cashflow_type = Utils.mode(data, fund => {
                        return fund.cashflow_type;
                    });

                    let funds = data.filter(fund => {
                        return fund.cashflow_type === cashflow_type;
                    });

                    return funds.length < 1;
                },
                datasource: {
                    type: 'observer',
                    default: [],
                    mapping: 'filter',
                    mapping_args: {
                        key: 'entity_type',
                        values: ['user_fund', 'bison_fund'],
                    },
                    event_type: Utils.gen_event('DataTable.selected', opts.data_table_id),
                },
            },
            {
                id: 'detach_diligence',
                action: 'detach_diligence',
                component: ActionButton,
                label: '<i class="icon-unlink"></i>&nbsp; Detach from Diligence Project',
                css: {
                    'report-archive-link': true,
                },
                trigger_modal: {
                    component: DetachDiligenceModal,
                },
                disabled_callback: function(data) {
                    if (Object.isArray(data)) {
                        return data.length < 1;
                    }
                },
                datasource: {
                    type: 'observer',
                    default: [],
                    mapping: 'filter',
                    mapping_args: {
                        key: 'entity_type',
                        values: ['user_fund', 'bison_fund'],
                    },
                    event_type: Utils.gen_event('DataTable.selected', opts.data_table_id),
                },
            },
        ];

        let dropdown = {
            id: 'new',
            component: ActionButtons,
            template: opts.template || 'tpl_action_buttons_dropdown',
            label: 'Diligence <span class="glyphicon glyphicon-equalizer"></span>',
            css: {
                btn: true,
                'btn-transparent-success': true,
            },
            buttons: buttons,
        };

        if (opts.disable_on_selection) {
            dropdown.disabled_callback = function(data) {
                if (Object.isArray(data)) {
                    return data.length < 1;
                }
                return false;
            };

            dropdown.datasource = {
                type: 'observer',
                default: [],
                event_type: Utils.gen_event('DataTable.selected', opts.data_table_id),
            };
        }

        return dropdown;
    },
    new_entity: function(opts) {
        opts = opts || {};

        let buttons = [
            {
                label: 'Company',
                action: 'create_company',
            },
            {
                label: 'Net Fund',
                action: 'create_net_fund',
            },
            {
                label: 'Gross Fund',
                action: 'create_gross_fund',
            },
        ];

        if (opts.data_table_id && !opts.disable_on_selection) {
            let button_datasource = {
                type: 'observer',
                default: [],
                mapping: 'filter',
                mapping_args: {
                    key: 'entity_type',
                    values: ['user_fund', 'bison_fund'],
                },
                event_type: Utils.gen_event('DataTable.selected', opts.data_table_id),
            };

            buttons.push(
                {
                    label: 'Portfolio From Selection',
                    action: 'create_empty_portfolio',
                    trigger_modal: {
                        component: CreatePortfolioModal,
                    },
                    hidden_callback: function(data) {
                        if (data) {
                            let cashflow_type = Utils.mode(data, fund => {
                                return fund.cashflow_type;
                            });

                            let funds = data.filter(fund => {
                                return fund.cashflow_type === cashflow_type;
                            });

                            return funds.length < 1;
                        }

                        return true;
                    },
                    datasource: button_datasource,
                },
                {
                    label: 'Net Portfolio',
                    action: 'create_net_portfolio',
                    hidden_callback: function(data) {
                        return data && data.length > 0;
                    },
                    datasource: button_datasource,
                },
                {
                    label: 'Gross Portfolio',
                    action: 'create_gross_portfolio',
                    hidden_callback: function(data) {
                        return data && data.length > 0;
                    },
                    datasource: button_datasource,
                },
            );
        } else {
            buttons.push(
                {
                    label: 'Net Portfolio',
                    action: 'create_net_portfolio',
                },
                {
                    label: 'Gross Portfolio',
                    action: 'create_gross_portfolio',
                },
            );
        }

        let dropdown = {
            id: 'new',
            component: ActionButtons,
            template: opts.template || 'tpl_action_buttons_dropdown',
            label: 'Create <span class="icon-plus"></span>',
            css: {
                btn: true,
                'btn-transparent-success': true,
            },
            buttons: buttons,
        };

        if (opts.disable_on_selection) {
            dropdown.disabled_callback = function(data) {
                return data && data.length > 0;
            };

            dropdown.datasource = {
                type: 'observer',
                default: [],
                event_type: Utils.gen_event('DataTable.selected', opts.data_table_id),
            };
        }

        return dropdown;
    },
};

self.filters = {
    range_popover: function(opts) {
        opts = opts || {};
        return {
            id: opts.id,
            component: NewPopoverButton,
            label: opts.label,
            clear_event: opts.clear_event,
            css: {
                'btn-block': true,
                'btn-cpanel-primary': true,
                'btn-sm': true,
            },
            icon_css: 'glyphicon glyphicon-plus',
            popover_options: {
                placement: 'right',
                title: opts.label,
                css_class: 'popover-cpanel',
            },
            popover_config: {
                component: PopoverInputRange,
                mode: opts.mode || 'number',
                min: {
                    placeholder: `Min ${opts.placeholder_suffix}`,
                    in_cpanel: true,
                },
                max: {
                    placeholder: `Max ${opts.placeholder_suffix}`,
                    in_cpanel: true,
                },
            },
        };
    },
    custom_attributes_popover: opts => {
        opts = opts || {};

        return {
            id: opts.id,
            component: NewPopoverButton,
            label: 'Custom Attributes',
            css: {
                'btn-block': true,
                'btn-cpanel-primary': true,
                'btn-sm': true,
            },
            icon_css: 'glyphicon glyphicon-plus',
            popover_options: {
                placement: 'right',
                css_class: 'popover-cpanel',
            },
            visible_callback: function(popover) {
                return popover.filters().length > 0;
            },
            popover_config: {
                id: 'custom_attributes_filter',
                component: AttributeFilters,
                clear_event: opts.clear_event,
                active_template: 'in_popover',
                datasource: {
                    type: 'dynamic',
                    query: {
                        target: 'filter_configs',
                        entity_uid: {
                            type: 'observer',
                            event_type: opts.entity_uid_event,
                            required: true,
                        },
                        entity_type: opts.entity_type || 'user_fund',
                        public_taxonomy: false,
                        cashflow_type: opts.cashflow_type,
                        disable_unused: true,
                    },
                },
            },
        };
    },
};

self.events = {
    upload_success_event: self.upload_wizard.upload_success_event,
};

self.button_id = {
    delete_entities: function(id) {
        return Utils.gen_id(id, 'delete', 'delete_modal');
    },
};

export default self;
