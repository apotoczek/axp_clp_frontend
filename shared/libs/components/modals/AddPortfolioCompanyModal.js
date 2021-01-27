import BaseComponent from 'src/libs/components/basic/BaseComponent';
import DataThing from 'src/libs/DataThing';
import DataSource from 'src/libs/DataSource';
import Observer from 'src/libs/Observer';
import bison from 'bison';
import ko from 'knockout';

import TextInput from 'src/libs/components/basic/TextInput';
import BooleanButton from 'src/libs/components/basic/BooleanButton';
import DataTable from 'src/libs/components/basic/DataTable';
import FilteredDropdown from 'src/libs/components/basic/FilteredDropdown';
import ActionButtons from 'src/libs/components/basic/ActionButtons';
import EventRegistry from 'src/libs/components/basic/EventRegistry';

class BaseStep extends BaseComponent {
    constructor(opts, components) {
        super(opts, components);

        this.callback = opts.callback;
        this.form_data = opts.form_data;
    }

    set_client_uid() {}
    reset() {}
}

class SummaryStep extends BaseStep {
    constructor(opts, components) {
        super(opts, components);

        this.define_template(`
            <div class="modal-body text-center" data-bind="with: form_data">
                <div class="row row-margins">
                    <div class="col-md-4 col-xs-12">
                        <h3>Primary Contact</h3>
                        <dl>
                            <dt>Email</dt>
                            <dd>{{ primary_contact.email }}</dd>
                        </dl>

                    </div>
                    <div class="col-md-4 col-xs-12">
                        <h3>Client / User</h3>
                        <dl>
                            <dt>Connect Existing</dt>
                            <dd>{{ user.mode == 'connect_existing' ? 'Yes': 'No' }}</dd>
                            <dt>Client</dt>
                            <dd>{{ user.company_name }}</dd>
                            <dt>Contact Name</dt>
                            <dd>{{ user.contact_name }}</dd>
                            <dt>Contact Email</dt>
                            <dd>{{ user.contact_email }}</dd>
                            {{ #if user.mode === 'create_new' }}
                                <dt>Send Activation Email</dt>
                                <dd>{{ user.send_activation_email ? 'Yes': 'No' }}</dd>
                            {{ /if }}
                        </dl>
                    </div>
                    <div class="col-md-4 col-xs-12">
                        <h3>Company</h3>
                        <dl>
                            <dt>Connect Existing</dt>
                            <dd>{{ company.mode == 'connect_existing' ? 'Yes': 'No' }}</dd>
                            <dt>Company</dt>
                            <dd>{{ company.name }}</dd>
                        </dl>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button
                    type="button"
                    class="btn btn-success"
                    data-bind="click: finish"
                >
                    Finish
                </button>
            </div>
        `);
    }

    finish() {
        this.callback('finish');
    }
}

class ContactStep extends BaseStep {
    constructor(opts, components) {
        super(opts, components);

        this.define_template(`
            <div class="modal-body">
                <div class="row" style="margin-bottom: 30px;">
                    <div class="col-md-offset-3 col-md-6 col-xs-12">
                        <h3 class="text-center">Select primary contact</h3>
                        <!-- ko renderComponent: recipient_user --><!-- /ko -->
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button
                    type="button"
                    class="btn btn-success"
                    data-bind="click: next"
                >
                    Next
                </button>
            </div>
        `);

        this.recipient_user = this.new_instance(FilteredDropdown, {
            default_selected_index: 0,
            datasource: {
                type: 'dynamic',
                key: 'results',
                mapping: 'to_options',
                mapping_args: {
                    value_key: 'uid',
                    label_key: 'email',
                },
                query: {
                    target: 'commander:users',
                    results_per_page: 'all',
                    filters: {
                        type: 'dynamic',
                        query: {
                            client_uid: {
                                type: 'placeholder',
                                required: true,
                            },
                        },
                    },
                },
            },
        });
    }

    next() {
        this.callback('next', {
            primary_contact: {
                user_uid: this.recipient_user.selected_value(),
                email: this.recipient_user.selected_label(),
            },
        });
    }

    set_client_uid(client_uid) {
        this.recipient_user.update_query({
            filters: {
                client_uid: client_uid,
            },
        });
    }

    reset() {
        this.recipient_user.clear();
    }
}

class UserStep extends BaseStep {
    constructor(opts, components) {
        super(opts, components);

        this.define_template(`
            <div class="modal-body">
                {{ #ifnot mode }}
                <h3 class="text-center">Client / User</h3>
                <p class="text-muted text-center" style="padding: 5px;">
                    Who is submitting the data?
                </p>
                <div class="row" style="margin-bottom: 30px;">
                    <div class="col-md-offset-3 col-md-6 col-xs-12 text-center">
                        <button
                            data-bind="click: gen_set_mode('create_new')"
                            class="btn btn-success btn-lg"
                        >
                            Create new
                        </button>
                        <span style="margin: 0 10px;font-size: 16px;">or</span>
                        <button
                            data-bind="click: gen_set_mode('connect_existing')"
                            class="btn btn-success btn-lg"
                        >
                            Connect existing
                        </button>
                    </div>
                </div>

                {{ /ifnot }}
                {{ #if is_mode('create_new') }}
                <h3 class="text-center">Create new client / user</h3>
                <p class="text-muted text-center" style="padding: 5px;">
                    This will create a new client and user, and automatically assign the required permissions.
                </p>
                <div class="row" data-bind="with: create_new_form">
                    <div class="col-md-6 col-xs-12">
                        <div class="form-group">
                            <!-- ko renderComponent: company_name --><!-- /ko -->
                        </div>
                        <div class="form-group">
                            <!-- ko renderComponent: send_activation_email --><!-- /ko -->
                        </div>
                    </div>
                    <div class="col-md-6 col-xs-12">
                        <div class="form-group">
                            <!-- ko renderComponent: contact_name --><!-- /ko -->
                        </div>
                        <div class="form-group">
                            <!-- ko renderComponent: contact_email --><!-- /ko -->
                        </div>
                    </div>
                </div>
                {{ /if }}
                {{ #if is_mode('connect_existing') }}
                <h3 class="text-center">Connect existing client / user</h3>
                <p class="text-muted text-center" style="padding: 5px;">
                    This will create a relationship with an existing client/user. Permissions have to be manually assigned.
                </p>
                <div class="row">
                    <div class="col-xs-12">
                        <div style="margin-bottom: 10px;" data-bind="renderComponent: string_filter"></div>
                        <!-- ko renderComponent: existing_clients --><!-- /ko -->
                    </div>
                </div>
                {{ /if }}
            </div>
            <div class="modal-footer">
                {{ #if mode }}
                    <button
                        type="button"
                        class="btn btn-default"
                        data-bind="click: gen_set_mode(undefined)"
                    >
                        Back
                    </button>
                {{ /if }}
                {{ #ifnot mode }}
                    <button
                        type="button"
                        class="btn btn-default"
                        data-bind="click: prev"
                    >
                        Back
                    </button>
                {{ /ifnot }}
                {{ #if is_mode('create_new') }}
                    <button
                        type="button"
                        class="btn btn-success"
                        data-bind="click: create_new, enable: can_create_new"
                    >
                        Next
                    </button>
                {{ /if }}
            </div>
        `);

        this.events = this.new_instance(EventRegistry, {});

        this.events.resolve_and_add('connect', 'ActionButtons.action.connect');

        this.mode = ko.observable();

        this.create_new_form = {
            company_name: this.new_instance(TextInput, {
                allow_empty: false,
                placeholder: 'Company Name',
            }),
            contact_name: this.new_instance(TextInput, {
                allow_empty: false,
                placeholder: 'Contact Name',
            }),
            contact_email: this.new_instance(TextInput, {
                allow_empty: false,
                custom_validator: {
                    function: bison.helpers.is_valid_email,
                    message: 'Invalid Email',
                },
                placeholder: 'Contact Email',
            }),
            send_activation_email: this.new_instance(BooleanButton, {
                template: 'tpl_boolean_button',
                label: 'Send Activation Email',
                btn_css: {
                    'btn-ghost-info': true,
                    'btn-block': true,
                },
                default_state: true,
            }),
        };

        this.string_filter = this.new_instance(TextInput, {
            allow_empty: true,
            placeholder: 'Search...',
        });

        this.existing_clients = this.new_instance(DataTable, {
            id: 'existing_clients',
            css: {'table-light': true, 'table-sm': true},
            results_per_page: 5,
            pagination_pages: 5,
            row_key: 'contact_uid',
            columns: [
                {
                    label: 'Portfolio Company',
                    key: 'company_name',
                },
                {
                    label: 'Primary Contact',
                    key: 'contact_name',
                },
                {
                    label: 'Email',
                    key: 'contact_email',
                },
                {
                    label: 'Actions',
                    width: '1%',
                    component_callback: 'data',
                    component: {
                        id: 'actions',
                        component: ActionButtons,
                        template: 'tpl_action_buttons',
                        id_callback: this.events.register_alias('connect'),
                        buttons: [
                            {
                                label: 'Connect',
                                css: {'btn-info': true, 'btn-xs': true},
                                // disabled_callback: () => {
                                //     return !this.can_connect_existing();
                                // },
                                action: 'connect',
                            },
                        ],
                    },
                },
            ],
            datasource: {
                type: 'dynamic',
                query: {
                    target: 'commander:portfolio_company_clients',
                    results_per_page: 50,
                    client_uid: {
                        type: 'placeholder',
                        required: true,
                    },
                },
            },
        });

        this.string_filter.value.subscribe(value => {
            this.existing_clients.update_query({
                string_filter: value,
            });
        });

        this.can_create_new = ko.pureComputed(() => {
            for (const input of Object.values(this.create_new_form)) {
                if (input.__class__ === 'BooleanButton') {
                    continue;
                }

                if (!input.can_submit()) {
                    return false;
                }
            }

            return true;
        });

        Observer.register(this.events.get('connect'), data => {
            this.connect_existing(data);
        });
    }

    connect_existing(client) {
        this.callback('next', {
            user: {
                mode: 'connect_existing',
                user_uid: client.contact_uid,
                company_name: client.company_name,
                contact_name: client.contact_name,
                contact_email: client.contact_email,
            },
        });
    }

    create_new() {
        this.callback('next', {
            user: {
                mode: 'create_new',
                company_name: this.create_new_form.company_name.value(),
                contact_name: this.create_new_form.contact_name.value(),
                contact_email: this.create_new_form.contact_email.value(),
                send_activation_email: this.create_new_form.send_activation_email.state(),
            },
        });
    }

    prev() {
        this.callback('prev');
    }

    is_mode(mode) {
        return this.mode() === mode;
    }

    gen_set_mode(mode) {
        return () => {
            this.mode(mode);
        };
    }

    set_client_uid(client_uid) {
        this.existing_clients.update_query({
            client_uid: client_uid,
        });
    }

    reset() {
        this.string_filter.clear();
        this.mode(undefined);

        for (const input of Object.values(this.create_new_form)) {
            input.clear();
        }
    }
}

class CompanyStep extends BaseStep {
    constructor(opts, components) {
        super(opts, components);

        this.define_template(`
            <div class="modal-body">
                {{ #ifnot mode }}
                <h3 class="text-center">Company</h3>
                <p class="text-muted text-center" style="padding: 5px;">
                    Where will the submitted data go?
                </p>
                <div class="row" style="margin-bottom: 30px;">
                    <div class="col-md-offset-3 col-md-6 col-xs-12 text-center">
                        <button
                            data-bind="click: gen_set_mode('create_new')"
                            class="btn btn-success btn-lg"
                        >
                            Create new
                        </button>
                        <span style="margin: 0 10px;font-size: 16px;">or</span>
                        <button
                            data-bind="click: gen_set_mode('connect_existing')"
                            class="btn btn-success btn-lg"
                        >
                            Connect existing
                        </button>
                    </div>
                </div>
                {{ /ifnot }}
                {{ #if is_mode('create_new') }}
                <h3 class="text-center">Create new company</h3>
                <p class="text-muted text-center" style="padding: 5px;">
                    This will create a new company / fund and add it to the Data Collection portfolio.
                </p>
                <div class="row" data-bind="with: create_new_form">
                    <div class="col-md-6 col-xs-12">
                        <div class="form-group">
                            <!-- ko renderComponent: company_name --><!-- /ko -->
                        </div>
                    </div>
                </div>
                {{ /if }}
                {{ #if is_mode('connect_existing') }}
                <h3 class="text-center">Connect existing company</h3>
                <p class="text-muted text-center" style="padding: 5px;">
                    This will connect the relationship to an existing company.
                </p>
                <div class="row">
                    <div class="col-xs-12">
                        <div style="margin-bottom: 10px;" data-bind="renderComponent: string_filter"></div>
                        <!-- ko renderComponent: existing_companies_table --><!-- /ko -->
                    </div>
                </div>
                {{ /if }}
            </div>
            <div class="modal-footer">
                {{ #if mode }}
                    <button
                        type="button"
                        class="btn btn-default"
                        data-bind="click: gen_set_mode(undefined)"
                    >
                        Back
                    </button>
                {{ /if }}
                {{ #ifnot mode }}
                    <button
                        type="button"
                        class="btn btn-default"
                        data-bind="click: prev"
                    >
                        Back
                    </button>
                {{ /ifnot }}
                {{ #if is_mode('create_new') }}
                    <button
                        type="button"
                        class="btn btn-success"
                        data-bind="click: create_new, enable: can_create_new"
                    >
                        Next
                    </button>
                {{ /if }}
            </div>
        `);

        this.events = this.new_instance(EventRegistry, {});

        this.events.resolve_and_add('connect', 'ActionButtons.action.connect');

        this.mode = ko.observable();

        this.create_new_form = {
            company_name: this.new_instance(TextInput, {
                allow_empty: false,
                placeholder: 'Company Name',
            }),
        };

        this.string_filter = this.new_instance(TextInput, {
            allow_empty: true,
            placeholder: 'Search...',
        });

        this.existing_companies_datasource = this.new_instance(DataSource, {
            datasource: {
                key: 'results',
                type: 'dynamic',
                query: {
                    target: 'commander:companies_for_client',
                    client_uid: {
                        type: 'placeholder',
                        required: true,
                    },
                    results_per_page: 'all',
                },
            },
        });

        const existing_companies = ko.pureComputed(() => {
            const filter = this.string_filter.value();
            const companies = this.existing_companies_datasource.data() || [];

            if (filter && filter.length) {
                return companies.filter(c => c.name.toLowerCase().includes(filter.toLowerCase()));
            }

            return companies;
        });

        this.existing_companies_table = this.new_instance(DataTable, {
            id: 'existing_companies_table',
            css: {'table-light': true, 'table-sm': true},
            results_per_page: 5,
            pagination_pages: 5,
            row_key: 'entity_uid',
            inline_data: true,
            columns: [
                {
                    label: 'Company',
                    key: 'name',
                },
                {
                    label: 'Actions',
                    width: '1%',
                    component_callback: 'data',
                    component: {
                        id: 'actions',
                        component: ActionButtons,
                        template: 'tpl_action_buttons',
                        id_callback: this.events.register_alias('connect'),
                        buttons: [
                            {
                                label: 'Connect',
                                css: {'btn-info': true, 'btn-xs': true},
                                action: 'connect',
                            },
                        ],
                    },
                },
            ],
            data: existing_companies,
        });

        this.existing_companies_table.add_dependency(this.existing_companies_datasource);

        this.form_data.subscribe(({user}) => {
            if (user && user.company_name && !this.create_new_form.company_name.value()) {
                this.create_new_form.company_name.value(user.company_name);
            }
        });

        this.can_create_new = ko.pureComputed(() => {
            for (const input of Object.values(this.create_new_form)) {
                if (input.__class__ === 'BooleanButton') {
                    continue;
                }

                if (!input.can_submit()) {
                    return false;
                }
            }

            return true;
        });

        Observer.register(this.events.get('connect'), data => {
            this.connect_existing(data);
        });
    }

    set_client_uid(client_uid) {
        this.existing_companies_datasource.update_query({
            client_uid: client_uid,
        });
    }

    connect_existing(company) {
        this.callback('next', {
            company: {
                mode: 'connect_existing',
                uid: company.uid,
                name: company.name,
            },
        });
    }

    create_new() {
        this.callback('next', {
            company: {
                mode: 'create_new',
                name: this.create_new_form.company_name.value(),
            },
        });
    }

    prev() {
        this.callback('prev');
    }

    is_mode(mode) {
        return this.mode() === mode;
    }

    gen_set_mode(mode) {
        return () => {
            this.mode(mode);
        };
    }

    reset() {
        this.string_filter.clear();
        this.mode(undefined);

        for (const input of Object.values(this.create_new_form)) {
            input.clear();
        }
    }
}

class AddPortfolioCompanyModal extends BaseComponent {
    constructor(opts, components) {
        super(opts, components);

        this.client_uid_event = opts.client_uid_event;

        this.endpoints = {
            provision_portfolio_company_client: DataThing.backends.commander({
                url: 'provision_portfolio_company_client',
            }),
            setup_reporting_relationship: DataThing.backends.commander({
                url: 'setup_reporting_relationship',
            }),
        };

        this.form_data = ko.observable({});

        this.steps = [
            this.new_instance(ContactStep, {
                callback: this.callback.bind(this),
                form_data: this.form_data,
            }),
            this.new_instance(UserStep, {
                callback: this.callback.bind(this),
                form_data: this.form_data,
            }),
            this.new_instance(CompanyStep, {
                callback: this.callback.bind(this),
                form_data: this.form_data,
            }),
            this.new_instance(SummaryStep, {
                callback: this.callback.bind(this),
                form_data: this.form_data,
            }),
        ];

        this.active_step = ko.pureComputed(() => {
            return this.steps[this.active_idx() % this.steps.length];
        });

        this.active_idx = ko.observable(0);

        this.define_template(`
            <div class="modal fade" tabindex="-1" role="dialog" aria-hidden="true">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                            <h4 class="modal-title" data-bind="with: data">Add portfolio company for {{name}}</h4>
                        </div>
                        {{ #renderComponent active_step /}}
                    </div>
                </div>
            </div>
        `);
    }

    callback(action, data) {
        if (action === 'finish') {
            this.finish();
        }

        if (action == 'next') {
            if (data) {
                this.form_data({...this.form_data(), ...data});
            }

            this.active_idx(this.active_idx() + 1);
        } else if (action == 'prev') {
            this.active_idx(this.active_idx() - 1);
        }
    }

    finish() {
        const {primary_contact, user, company} = this.form_data();

        if (user.mode === 'connect_existing') {
            this.connect_existing(primary_contact.user_uid, user.user_uid, company.name);
        } else if (user.mode === 'create_new') {
            this.create_new(primary_contact.user_uid, user, company.name);
        }

        this.reset();
    }

    connect_existing(recipient_user_uid, sender_user_uid, company_name) {
        this.endpoints.setup_reporting_relationship({
            data: {
                recipient_user_uid,
                sender_user_uid,
                company_name,
            },
            success: DataThing.api.XHRSuccess(() => {
                DataThing.status_check();
                this.reset();
            }),
            errors: DataThing.api.XHRError(() => {}),
        });
    }

    create_new(recipient_user_uid, new_user, company_name) {
        this.endpoints.provision_portfolio_company_client({
            data: {
                recipient_user_uid,
                client_name: new_user.company_name,
                contact_name: new_user.contact_name,
                contact_email: new_user.contact_email,
                send_activation_email: new_user.send_activation_email,
                company_name,
            },
            success: DataThing.api.XHRSuccess(() => {
                DataThing.status_check();
                this.reset();
            }),
            errors: DataThing.api.XHRError(() => {}),
        });
    }

    set_client_uid() {
        const client = this.data();

        for (const step of this.steps) {
            step.set_client_uid(client.uid);
        }
    }

    show() {
        bison.helpers.modal(this.template, this, this.get_id());

        this.set_client_uid();
    }

    reset() {
        bison.helpers.close_modal(this.get_id());

        for (const step of this.steps) {
            step.reset();
        }

        this.loading(false);
        this.active_idx(0);
        this.form_data({});
    }
}

export default AddPortfolioCompanyModal;
