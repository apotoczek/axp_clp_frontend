/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ActionButtons from 'src/libs/components/basic/ActionButtons';
import Radiolist from 'src/libs/components/basic/Radiolist';
import NewPopoverButton from 'src/libs/components/popovers/NewPopoverButton';
import ko from 'knockout';
import bison from 'bison';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import DataTable from 'src/libs/components/basic/DataTable';
import NewDropdown from 'src/libs/components/basic/NewDropdown';
import EventRegistry from 'src/libs/components/basic/EventRegistry';
import * as Utils from 'src/libs/Utils';
import Observer from 'src/libs/Observer';
import DataThing from 'src/libs/DataThing';

const DEFAULT_TEMPLATE = `
        <div class="modal fade" tabindex="-1" role="dialog" aria-hidden="true">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                        <h2 class="modal-title">Sharing</h2>
                    </div>
                    <div class="modal-body">
                        <!-- ko renderComponent: shared_table --><!-- /ko -->
                        <!-- ko renderComponent: shares_table --><!-- /ko -->
                        <div class="btn-group">
                            <label class="btn btn-sm btn-ghost-default" data-bind="css: { active: is_mode('email') }">
                                <input type="radio" name="options" autocomplete="off" value="email" data-bind="checked: mode"> Share by Email
                            </label>
                            <label class="btn btn-sm btn-ghost-default" data-bind="css: { active: is_mode('team') }">
                                <input type="radio" name="options" autocomplete="off" value="team" data-bind="checked: mode"> Share to Team
                            </label>
                        </div>
                        <hr class="transparent hr-small" />
                        <!-- ko renderComponent: permission_dropdown --><!-- /ko -->
                        <hr class="transparent hr-small" />
                        <!-- ko if: is_mode('email') -->
                            <textarea class="form-control" rows="3" placeholder="Paste emails here..." data-bind="textInput: emails"></textarea>
                            <div class="checkbox text-halfmuted">
                                <label>
                                  <input type="checkbox" data-bind="checked: send_email"> Notify users by email
                                </label>
                            </div>
                            <hr class="transparent hr-small">
                        <!-- /ko -->
                        <!-- ko if: is_mode('team') -->
                            <!-- ko renderComponent: team_table --><!-- /ko -->
                        <!-- /ko -->
                        <button type="button" class="btn btn-cpanel-success" data-bind='click: share' data-dismiss="modal">Share</button>
                        <button type="button" class="btn btn-ghost-default" data-dismiss="modal">Cancel</button>
                    </div>
                </div>
            </div>
        </div>
    `;

export default class ShareModal extends BaseComponent {
    constructor(opts, components) {
        super(opts, components);

        let _dfd = this.new_deferred();

        this.define_default_template(DEFAULT_TEMPLATE);

        /********************************************************************
         * Events
         *******************************************************************/

        this.events = this.new_instance(EventRegistry, {});

        this.events.resolve_and_add('permissions', 'PopoverButton.value_with_data', 'change');
        this.events.resolve_and_add('actions', 'ActionButtons.action.delete', 'delete');

        /********************************************************************
         * Defaults
         *******************************************************************/

        this.form_defaults = {
            mode: 'email',
            send_email: true,
            emails: '',
            data_to_share: [],
        };

        /********************************************************************
         * Observables
         *******************************************************************/

        this.mode = ko.observable(this.form_defaults.mode);
        this.send_email = ko.observable(this.form_defaults.send_email);
        this.emails = ko.observable(this.form_defaults.emails);
        this.data_to_share = ko.observable(this.form_defaults.data_to_share);

        /********************************************************************
         * Endpoints
         *******************************************************************/

        this._edit_share = DataThing.backends.useractionhandler({
            url: 'edit_share',
        });

        this._remove_share = DataThing.backends.useractionhandler({
            url: 'remove_share',
        });

        this._share = DataThing.backends.useractionhandler({
            url: 'share_multiple',
        });

        /********************************************************************
         * Table of stuff to be shared
         *******************************************************************/

        this.shared_table = this.init_shared_table(opts.shared_table_columns);

        /********************************************************************
         * Team table
         *******************************************************************/

        this.team_table = this.init_team_table();

        /********************************************************************
         * Existing shares for entity, only visible with single entity
         *******************************************************************/

        this.shares_table = this.init_shares_table(opts.shares_table_datasource);

        // Subscribe to data and update share query accordingly
        this.data_to_share.subscribe(data => {
            this.update_share_query(data);
        });

        this.update_share_query(this.data_to_share());

        /********************************************************************
         * Permission dropdown, used for new shares
         *******************************************************************/

        this.permission_dropdown = this.init_permission_dropdown();

        /********************************************************************
         * Internal subscriptions
         *******************************************************************/

        this.when(this.shares_table, this.shared_table, this.team_table).done(() => {
            // Subscribe to permission dropdown
            Observer.register(this.events.get('change'), ({data, value}) => {
                this.change_callback(data, value);
            });

            // Subscribe to delete action
            Observer.register(this.events.get('delete'), entity => {
                this.delete_callback(entity);
            });

            _dfd.resolve();
        });
    }

    is_mode(mode) {
        return this.mode() == mode;
    }

    update_share_query(data) {
        if (data && data.length === 1) {
            this.shares_table.update_query({
                user_fund_uid: data[0].user_fund_uid,
                portfolio_uid: data[0].portfolio_uid,
                user_market_uid: data[0].user_market_uid,
                list_uid: data[0].list_uid,
                diligence_project_uid: data[0].diligence_project_uid,
            });
        } else {
            this.shares_table.update_query({
                user_fund_uid: undefined,
                portfolio_uid: undefined,
                user_market_uid: undefined,
                list_uid: undefined,
                diligence_project_uid: undefined,
            });
        }
    }

    /********************************************************************
     * Modal functionality
     *******************************************************************/

    show() {
        this.data_to_share(Utils.ensure_array(this.data()));
        bison.helpers.modal(this.template, this, this.get_id());
    }

    reset() {
        this.data_to_share(this.form_defaults.data_to_share);
        this.mode(this.form_defaults.mode);
        this.send_email(this.form_defaults.send_email);
        this.emails(this.form_defaults.emails);
        bison.helpers.close_modal(this.get_id());
    }

    /********************************************************************
     * Edit / Remove / Share
     *******************************************************************/

    edit_share(data) {
        this.shares_table.loading(true);
        this._edit_share({
            data: data,
            success: DataThing.api.XHRSuccess(() => {
                DataThing.status_check();
                Observer.broadcast_for_id(this.get_id(), 'ShareModal.edit_share', data);
            }),
        });
    }

    remove_share(data) {
        this.shares_table.loading(true);
        this._remove_share({
            data: data,
            success: DataThing.api.XHRSuccess(() => {
                DataThing.status_check();
                Observer.broadcast_for_id(this.get_id(), 'ShareModal.remove_share', data);
            }),
        });
    }

    share() {
        let data = this.data_to_share();

        let share_data = {
            do_send_email: this.send_email(),
            share_to_team: this.is_mode('team'),
            user_fund_uids: [],
            portfolio_uids: [],
            user_market_uids: [],
            list_uids: [],
            diligence_project_uids: [],
        };

        // Add user funds / portfolios from data where share = true
        for (let item of data) {
            if (item.share) {
                if (item.user_fund_uid) {
                    share_data.user_fund_uids.push(item.user_fund_uid);
                } else if (item.portfolio_uid) {
                    share_data.portfolio_uids.push(item.portfolio_uid);
                } else if (item.user_market_uid) {
                    share_data.user_market_uids.push(item.user_market_uid);
                } else if (item.list_uid) {
                    share_data.list_uids.push(item.list_uid);
                } else if (item.diligence_project_uid) {
                    share_data.diligence_project_uids.push(item.diligence_project_uid);
                }
            }
        }

        // Add emails if not sharing to team
        if (!share_data.share_to_team) {
            share_data.emails = this.emails();
        }

        // Permission
        let permission = this.permission_dropdown.selected();

        if (permission) {
            share_data.read = permission.read || false;
            share_data.write = permission.write || false;
            share_data.share = permission.share || false;
        }

        this._share({
            data: share_data,
            success: DataThing.api.XHRSuccess(data => {
                if (data.failed && data.failed.length) {
                    this.emails(data.failed.join(', '));
                } else {
                    this.reset();
                }

                Observer.broadcast_for_id(this.get_id(), 'ShareModal.share', share_data);

                setTimeout(() => {
                    DataThing.status_check();
                }, 2000);
            }),
        });
    }

    change_callback(entity, selected_value) {
        if (entity && selected_value) {
            let read = selected_value.read || false;
            let write = selected_value.write || false;
            let share = selected_value.share || false;

            if (read != entity.read || write != entity.write || share != entity.share) {
                this.edit_share({
                    uid: entity.uid,
                    user_fund_uid: entity.user_fund_uid,
                    portfolio_uid: entity.portfolio_uid,
                    user_market_uid: entity.user_market_uid,
                    list_uid: entity.list_uid,
                    read: read,
                    write: write,
                    share: share,
                });
            }
        }
    }

    delete_callback(entity) {
        if (entity) {
            this.remove_share({
                uid: entity.uid,
                user_fund_uid: entity.user_fund_uid,
                portfolio_uid: entity.portfolio_uid,
                user_market_uid: entity.user_market_uid,
                list_uid: entity.list_uid,
            });
        }
    }

    init_shared_table(shared_table_columns) {
        let columns = shared_table_columns || [
            {
                label: 'Name',
                key: 'name',
            },
            {
                label: 'Type',
                key: 'entity_type',
                format: 'entity_type',
            },
            {
                label: 'Cashflow Type',
                key: 'cashflow_type',
                format: 'titleize',
            },
            {
                label: 'Permissions',
                key: 'permissions',
                format: 'strings',
            },
            {
                label: 'Permission to share',
                key: 'share',
                format: 'boolean_highlight',
            },
        ];

        return this.new_instance(DataTable, {
            id: 'shared',
            results_per_page: 5,
            inline_data: true,
            css: 'table-light table-sm',
            data: this.data_to_share,
            columns: columns,
        });
    }

    init_team_table(id = 'team') {
        return this.new_instance(DataTable, {
            id: id,
            results_per_page: 5,
            inline_data: true,
            css: 'table-light table-sm',
            columns: [
                {
                    label: 'Name',
                    key: 'name',
                },
                {
                    label: 'Email',
                    key: 'email',
                },
            ],
            datasource: {
                type: 'dynamic',
                key: 'users',
                query: {
                    target: 'client',
                },
            },
        });
    }

    init_permission_dropdown(id = 'permission_dropdown') {
        return this.new_instance(NewDropdown, {
            id: id,
            btn_css: {'btn-ghost-default': true, 'btn-sm': true},
            label: 'Permission',
            options: [
                {
                    label: 'Read',
                    value: 'read',
                    read: true,
                },
                {
                    label: 'Read and Write',
                    value: 'read:write',
                    read: true,
                    write: true,
                },
                {
                    label: 'Read, Write and Share',
                    value: 'read:write:share',
                    read: true,
                    write: true,
                    share: true,
                },
            ],
            default_selected_index: 0,
        });
    }

    init_shares_table(shares_table_datasource, id = 'shares') {
        let datasource = shares_table_datasource || {
            type: 'dynamic',
            one_required: [
                'user_fund_uid',
                'portfolio_uid',
                'user_market_uid',
                'list_uid',
                'diligence_project_uid',
            ],
            query: {
                target: 'vehicle:shares',
            },
        };

        return this.new_instance(DataTable, {
            id: id,
            results_per_page: 10,
            inline_data: true,
            empty_template: 'tpl_empty',
            css: 'table-light table-sm',
            columns: [
                {
                    label: 'Shared with',
                    key: 'display_name',
                },
                {
                    label: 'Pending',
                    key: 'pending',
                    format: 'boolean',
                },
                {
                    width: '200px',
                    label: 'Permissions',
                    component_callback: (button, row) => {
                        button.data(row);

                        if (row.share) {
                            button.set_inner_state('read:write:share');
                        } else if (row.write) {
                            button.set_inner_state('read:write');
                        } else if (row.read) {
                            button.set_inner_state('read');
                        }
                    },
                    initial_callback_only: true,
                    component: {
                        id: 'permissions',
                        component: NewPopoverButton,
                        id_callback: this.events.register_alias('permissions'),
                        label_track_selection: true,
                        broadcast_data: true,
                        css: {
                            'btn-block': true,
                            'btn-ghost-default': true,
                            'btn-xs': true,
                        },
                        icon_css: 'glyphicon glyphicon-chevron-down glyphicon-small',
                        popover_options: {
                            title: 'Select Permission',
                            placement: 'bottom',
                            css_class: 'popover-ghost-default',
                        },
                        popover_config: {
                            option_css: {
                                'btn-popover-checklist-item': true,
                                'btn-block': true,
                                'btn-sm': true,
                                'close-popover': true,
                            },
                            component: Radiolist,
                            datasource: {
                                type: 'static',
                                data: [
                                    {label: 'Read', value: 'read', read: true},
                                    {
                                        label: 'Read and Write',
                                        value: 'read:write',
                                        read: true,
                                        write: true,
                                    },
                                    {
                                        label: 'Read, Write and Share',
                                        value: 'read:write:share',
                                        read: true,
                                        write: true,
                                        share: true,
                                    },
                                ],
                            },
                        },
                    },
                },
                {
                    width: '1%',
                    component_callback: 'data',
                    component: {
                        id: 'actions',
                        component: ActionButtons,
                        id_callback: this.events.register_alias('actions'),
                        template: 'tpl_action_buttons',
                        buttons: [
                            {
                                label: 'Delete',
                                action: 'delete',
                                css: {'btn-danger': true, 'btn-xs': true},
                            },
                        ],
                    },
                },
            ],
            datasource: datasource,
        });
    }
}
