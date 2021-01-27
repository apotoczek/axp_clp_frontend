import ko from 'knockout';

import auth from 'auth';
import Notify from 'bison/utils/Notify';

import ActionButton from 'src/libs/components/basic/ActionButton';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import DataTable from 'src/libs/components/basic/DataTable';
import EventRegistry from 'src/libs/components/basic/EventRegistry';

import AssignNewCobaltClientModal from 'src/libs/components/modals/AssignNewCobaltClientModal';
import EditUserFundShares from 'src/libs/components/modals/EditUserFundShares';
import ViewAndGrantModal from 'src/libs/components/modals/ViewAndGrantModal';

import {backend_date, backend_datetime} from 'src/libs/Formatters';
import DataSource from 'src/libs/DataSource';
import DataThing from 'src/libs/DataThing';
import Observer from 'src/libs/Observer';

class ShowRemotePartner extends BaseComponent {
    constructor(opts = {}, components = {}) {
        super(opts, components);

        this.define_default_template(`
            <!-- ko if: loading -->
            <div class="big-message">
                <span class="glyphicon glyphicon-cog animate-spin"></span>
                <h1>Loading..</h1>
            </div>
            <!-- /ko -->
            <!-- ko ifnot: loading -->
            <div style="padding: 16px">
                <div class="row">
                    <div class="col-md-4">
                        <h3>Funds and Details</h3>
                        <h4 data-bind="html: name"></h4>
                    </div>
                    <div class="col-md-2">
                        <!-- ko if: is_developer -->
                        <div style="display: inline-block; text-align: center">
                            <h5>Last Scheduled Update</h5>
                            <h4 data-bind="html: last_scheduled_update"></h4>
                            <!-- ko renderComponent: unlock_client --><!-- /ko -->
                        </div>
                        <!-- /ko -->
                    </div>
                    <div class="col-md-2">
                        <div style="display: inline-block; text-align: center">
                            <h5>Remote Client Managers</h5>
                            <h4 data-bind="text: shares"></h4>
                            <!-- ko renderComponent: view_and_grant --><!-- /ko -->
                        </div>
                    </div>
                    <div class="col-md-2">
                        <div style="display: inline-block; text-align: center">
                            <h5>Cobalt Client</h5>
                            <h4 data-bind="html: cobalt_client_name"></h4>
                            <!-- ko renderComponent: assign_new --><!-- /ko -->
                        </div>
                    </div>
                    <div class="col-md-2">
                        <div style="display: inline-block; text-align: center">
                            <h5>Last Refreshed</h5>
                            <h4 data-bind="html: last_updated"></h4>
                            <!-- ko renderComponent: update_funds --><!-- /ko -->
                        </div>
                    </div>
                </div>
                <div class="row" style="margin-top: 64px;">
                    <div class="col-xs-12">
                        <!-- ko renderComponent: table --><!-- /ko -->
                    </div>
                </div>
            </div>
            <!-- /ko -->
        `);

        this.dfd = this.new_deferred();
        const partner_event = opts.partner_event;
        const partner_uid = Observer.observable(partner_event);

        this.events = this.new_instance(EventRegistry);
        this.events.resolve_and_add('update_funds', 'ActionButton.action.update_funds');
        this.events.resolve_and_add('unlock_client', 'ActionButton.action.unlock');

        this.remote_client = this.new_instance(DataSource, {
            datasource: {
                type: 'dynamic',
                query: {
                    target: 'commander:get_remote_client_partner',
                    uid: {
                        type: 'observer',
                        event_type: partner_event,
                        required: true,
                    },
                },
            },
        });

        const _update_remote_client_funds = DataThing.backends.commander({
            url: 'update_remote_client_funds',
        });

        const _unlock_remote_client = DataThing.backends.commander({
            url: 'unlock_remote_client_for_update',
        });

        this.table = this.init_user_fund_table(partner_event);
        this.view_and_grant = this.init_view_and_grant_button(partner_uid);
        this.assign_new = this.init_assign_new_button();
        this.update_funds = this.init_update_funds_button();
        this.unlock_client = this.init_unlock_client_button();

        this.name = ko.pureComputed(() => {
            const data = this.remote_client.data();
            return data ? data.name : undefined;
        });

        this.last_scheduled_update = ko.pureComputed(() => {
            const data = this.remote_client.data();
            if (data && data.last_update_request) {
                return backend_datetime(data.last_update_request);
            }
            return 'N/A';
        });

        this.shares = ko.pureComputed(() => {
            const data = this.remote_client.data();
            return data ? data.nbr_of_managers || 0 : undefined;
        });

        this.cobalt_client_name = ko.pureComputed(() => {
            const data = this.remote_client.data();
            return data ? data.cobalt_client_name || 'N/A' : undefined;
        });

        this.last_updated = ko.pureComputed(() => {
            const data = this.remote_client.data();
            if (data && data.last_update) {
                return backend_date(data.last_update);
            }
            return 'N/A';
        });

        this.update_pending = ko.pureComputed(() => {
            const data = this.remote_client.data();
            return data && data.last_update_request > data.last_update;
        });

        this.loading = ko.pureComputed(
            () => this.remote_client.loading() || !this.remote_client.data(),
        );

        this.is_developer = ko.pureComputed(() => auth.user_has_feature('dev_only'));

        this.when(
            this.unlock_client,
            this.view_and_grant,
            this.assign_new,
            this.table,
            this.remote_client,
        ).done(() => {
            Observer.register(this.events.get('unlock_client'), () => {
                if (!this.is_developer()) {
                    return;
                }

                const remote_client = this.remote_client.data();
                if (!remote_client) {
                    return;
                }

                _unlock_remote_client({
                    data: {
                        remote_client_uid: remote_client.uid,
                    },
                    success: DataThing.api.XHRSuccess(() => {
                        DataThing.status_check();
                        Notify(
                            'Unlocked Client:',
                            oneLine`
                                The client has been unlocked and you can now
                                schedule another update.
                            `,
                            'alert-success',
                            3000,
                        );
                    }),
                    error: DataThing.api.XHRError(() => {}),
                });
            });

            Observer.register(this.events.get('update_funds'), () => {
                const remote_client = this.remote_client.data();
                if (!remote_client) {
                    return;
                }
                _update_remote_client_funds({
                    data: {remote_client_uid: remote_client.uid},
                    success: DataThing.api.XHRSuccess(() => {
                        DataThing.status_check();
                        Notify(
                            'Update scheduled:',
                            "An email will be sent to you when it's finished",
                            'alert-info',
                            4000,
                        );
                    }),
                    error: DataThing.api.XHRError(() => {}),
                });
            });

            this.dfd.resolve();
        });
    }

    init_user_fund_table = partner_event =>
        this.new_instance(DataTable, {
            id: 'table',
            results_per_page: 50,
            title: 'This is table',
            css: {'table-light': true, 'table-sm': true},
            columns: [
                {
                    label: 'Description',
                    key: 'description',
                },
                {
                    label: 'User Fund Name',
                    sort_key: 'user_fund_name',
                    format: 'external_link',
                    format_args: {
                        url_key: 'link',
                        label_key: 'user_fund_name',
                        max_length: 200,
                    },
                },
                {
                    label: 'Last Refreshed',
                    key: 'last_update',
                    format: 'backend_date',
                },
                {
                    label: 'Actions',
                    component_callback: 'data',
                    component: {
                        component: ActionButton,
                        disabled_callback: data => {
                            return !(data && data.user_fund_uid);
                        },
                        label: 'View/Edit User Fund Shares',
                        css: {
                            btn: true,
                            'btn-xs': true,
                            'btn-info': true,
                        },
                        trigger_modal: {
                            component: EditUserFundShares,
                        },
                    },
                },
            ],
            datasource: {
                type: 'dynamic',
                query: {
                    target: 'commander:list_remote_client_user_funds',
                    remote_client_uid: {
                        type: 'observer',
                        event_type: partner_event,
                        required: true,
                    },
                },
            },
        });
    init_view_and_grant_button = partner_uid =>
        this.new_instance(ActionButton, {
            id: 'view_and_grant',
            label: 'View and Grant New',
            action: 'view_and_grant',
            css: {
                'btn-info': true,
                'btn-sm': true,
            },
            trigger_modal: {
                component: ViewAndGrantModal,
                id: 'view_and_grant_modal',
                partner_uid: partner_uid,
                meta_data: this.remote_client.data,
            },
        });

    init_assign_new_button = () =>
        this.new_instance(ActionButton, {
            id: 'assign_new',
            label: 'Assign New Cobalt Client',
            css: {
                'btn-info': true,
                'btn-sm': true,
            },
            trigger_modal: {
                component: AssignNewCobaltClientModal,
                id: 'assign_new_cobalt_client',
                data: this.remote_client.data,
            },
        });

    init_update_funds_button = () =>
        this.new_instance(ActionButton, {
            id: 'update_funds',
            id_callback: this.events.register_alias('update_funds'),
            label: ko.pureComputed(() => {
                const data = this.remote_client.data();
                if (data && data.last_update < data.last_update_request) {
                    return 'Pending Cash Flow Update';
                }
                return 'Retrieve All Fund Cash Flows';
            }),
            action: 'update_funds',
            css: {
                'btn-info': true,
                'btn-sm': true,
            },
            data: this.remote_client.data,
            disabled_callback: client_data => {
                if (client_data) {
                    return client_data.last_update_request > client_data.last_update;
                }
                return false;
            },
        });

    init_unlock_client_button = () =>
        this.new_instance(ActionButton, {
            id: 'unlock_client',
            id_callback: this.events.register_alias('unlock_client'),
            label: 'Unlock Client',
            action: 'unlock',
            css: {
                'btn-info': true,
                'btn-sm': true,
            },
        });
}

export default ShowRemotePartner;
