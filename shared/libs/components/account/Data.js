/* Automatically transformed from AMD to ES6. Beware of code smell. */
/**
 * View for displaying data that is owned by the client
 */
import AccountShareModal from 'src/libs/components/account/AccountShareModal';
import TableModal from 'src/libs/components/modals/TableModal';
import ActionButton from 'src/libs/components/basic/ActionButton';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import DataTable from 'src/libs/components/basic/DataTable';
import ActionHeader from 'src/libs/components/basic/ActionHeader';
import DataThing from 'src/libs/DataThing';
import * as Utils from 'src/libs/Utils';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    self.dfd = self.new_deferred();

    self.template = opts.template || 'tpl_account_content';

    // Event for grabbing the entity type to show data for
    self.entity_type_event = opts.entity_type_event;

    /**
     *   Datasource for grabbing share history for a given vehicle.
     *   See "data_handler" in the modal config
     */
    self.share_history_datasource = DataThing.backends.dataprovider({
        url: 'share_history',
    });

    self.content = self.new_instance(DataTable, {
        id: 'table',
        css: {'table-light': true, 'table-sm': true},
        columns: [
            {
                label: 'Vehicle',
                key: 'entity_name',
            },
            {
                label: 'Date Created',
                key: 'created',
                format: 'backend_date',
            },
            {
                label: 'Date Last Modified',
                key: 'modified',
                format: 'backend_date',
            },
            {
                label: 'Share Count',
                key: 'count',
            },
            {
                label: 'Uploaded By',
                key: 'user_name',
            },
            {
                component_callback: 'data',
                always_visible: true,
                component: {
                    component: ActionButton,
                    label: 'Audit Trail',
                    css: {'btn-xs': true, 'btn-info': true, 'btn-block': true},
                    trigger_modal: {
                        columns: [
                            {
                                label: 'Shared By',
                                key: 'from',
                            },
                            {
                                label: 'Shared To',
                                key: 'to',
                            },
                            {
                                label: 'Date Shared',
                                key: 'created',
                                format: 'backend_date',
                            },
                        ],
                        title: 'Share History',
                        id: 'share_history_modal',
                        close_on_url_change: true,
                        component: TableModal,
                        table_datasource: {
                            type: 'dynamic',
                            query: {
                                target: 'account:share_history',
                                entity_uid: {
                                    type: 'observer',
                                    required: true,
                                },
                                entity_type: {
                                    type: 'observer',
                                    required: true,
                                },
                            },
                        },
                        data_handler: function(data, table) {
                            table.update_query({
                                entity_uid: data.uid,
                                entity_type: data.entity_type,
                            });

                            table.refresh_data();
                        },
                    },
                },
            },
        ],
        label: 'Data',
        enable_selection: true,
        enable_localstorage: true,
        enable_clear_order: true,
        datasource: {
            type: 'dynamic',
            query: {
                target: 'account:client_vehicles',
                entity_type: {
                    type: 'observer',
                    event_type: self.entity_type_event,
                    mapping: 'get_value',
                },
            },
        },
    });

    self.share_endpoint = DataThing.backends.useractionhandler({
        url: 'client_admin_share',
    });
    self.toolbar = self.new_instance(ActionHeader, {
        id: 'toolbar',
        template: 'tpl_action_toolbar',
        buttons: [
            {
                id: 'share_entity',
                component: ActionButton,
                label: 'Share Entity <span class="icon-plus"></span>',
                action: 'share_entity',
                btn_css: {
                    btn: true,
                    'btn-ghost-default': true,
                },
                trigger_modal: {
                    id: 'share_entity',
                    value_key: 'email',
                    label_key: 'name',
                    sublabel_key: 'email',
                    component: AccountShareModal,
                    title: 'Share Entity',
                    description: 'Select a recipient and permission level',
                    confirm_callback: (selected, data) => {
                        let user_funds = data.filter(item => item.entity_type === 'fund');
                        let portfolios = data.filter(item => item.entity_type === 'portfolios');
                        let user_markets = data.filter(item => item.entity_type === 'market');

                        self.share_endpoint({
                            data: {
                                emails: [selected.recipient],
                                user_fund_uids: user_funds.map(item => item.uid),
                                portfolio_uids: portfolios.map(item => item.uid),
                                user_market_uids: user_markets.map(item => item.uid),
                                read: selected.permission.includes('read') || false,
                                share: selected.permission.includes('share') || false,
                                write: selected.permission.includes('write') || false,
                            },
                            success: DataThing.api.XHRSuccess(() => {
                                self.content.refresh_data();
                            }),
                        });
                    },
                    dropdown_datasource: {
                        type: 'dynamic',
                        query: {
                            target: 'account:users_for_client',
                            all_users: true,
                        },
                    },
                    confirm_btn_label: 'Share',
                },
                disabled_callback: data => {
                    if (data) {
                        return !data.length;
                    }
                    return true;
                },
                datasource: {
                    type: 'observer',
                    default: [],
                    event_type: Utils.gen_event('DataTable.selected', self.content.get_id()),
                },
            },
        ],
        data_table_id: self.content.get_id(),
    });

    self.dfd.resolve();

    return self;
}
