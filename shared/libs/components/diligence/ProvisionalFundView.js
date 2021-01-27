import BaseComponent from 'src/libs/components/basic/BaseComponent';
import ProvisionalFundForm from 'src/libs/components/diligence/ProvisionalFundForm';
import BreadcrumbHeader from 'src/libs/components/basic/BreadcrumbHeader';
import Aside from 'src/libs/components/basic/Aside';
import DataThing from 'src/libs/DataThing';
import Breadcrumb from 'src/libs/components/basic/Breadcrumb';
import HTMLContent from 'src/libs/components/basic/HTMLContent';
import ActionHeader from 'src/libs/components/basic/ActionHeader';
import DataTable from 'src/libs/components/basic/DataTable';

class ProvisionalFundView extends BaseComponent {
    constructor(opts = {}, components = {}) {
        super(opts, components);

        const _dfd = this.new_deferred();

        this.define_default_template(`
            <!-- ko renderComponent: page --><!-- /ko -->
        `);

        this.is_remote_entity = opts.is_remote_entity;
        this.project_uid_event = opts.project_uid_event;

        this.cashflow_type = opts.cashflow_type || 'net';

        this.form = {
            id: 'provisional_fund_form',
            component: ProvisionalFundForm,
            cashflow_type: this.cashflow_type,
            is_remote_entity: this.is_remote_entity,
            project_uid_event: this.project_uid_event,
            instructions: this.instructions,
        };

        this.project_table = {
            id: 'project_table',
            component: DataTable,
            enable_clear_order: true,
            css: {'table-light': true, 'table-sm': true},
            columns: [
                {
                    label: 'Fund',
                    sort_key: 'name',
                    format: 'contextual_link',
                    format_args: {
                        url: 'diligence/<diligence_project:uid>/<uid>/<uf_type>/analytics',
                        label_key: 'name',
                    },
                },
                {
                    label: 'Cash Flow Type',
                    key: 'uf_type',
                    format: 'entity_type',
                },
                {
                    label: 'Has Cash Flows',
                    key: 'has_cashflows',
                    format: 'boolean_highlight',
                },
                {
                    label: 'IRR',
                    key: 'irr',
                    format: 'percent',
                },
                {
                    label: 'DPI',
                    key: 'dpi',
                    format: 'multiple',
                },
                {
                    label: 'TVPI',
                    key: 'tvpi',
                    format: 'multiple',
                },
            ],
            results_per_page: 15,
            datasource: this.gen_entities_datasource(),
        };

        this.project_heading = {
            id: 'project_heading',
            component: BaseComponent,
            template: 'tpl_family_heading',
            datasource: this.gen_entities_datasource(data => {
                if (data && data.results[0]) {
                    return data.results[0].diligence_project;
                }
            }),
        };

        this.funds_heading = {
            id: 'funds_heading',
            component: BaseComponent,
            template: 'tpl_base_h2',
            heading: 'Funds in Project',
        };

        this.breadcrumb = {
            id: 'breadcrumb',
            component: Breadcrumb,
            items: [
                {
                    label: 'Diligence Reports',
                    link: '#!/diligence',
                },
                {
                    label: 'Provisional Fund',
                },
            ],
        };

        this.header = {
            id: 'header',
            component: BreadcrumbHeader,
            template: 'tpl_breadcrumb_header',
            layout: {
                breadcrumb: 'breadcrumb',
            },
            css: {'no-cpanel': true},
            components: [this.breadcrumb],
        };

        this.action_toolbar = {
            id: 'action_toolbar',
            component: ActionHeader,
            template: 'tpl_action_toolbar',
            buttons: [
                {
                    id: 'exit',
                    label:
                        'Back to Projects &nbsp; <span class="glyphicon glyphicon-log-in"></span>',
                    action: 'exit',
                    trigger_url: {url: 'diligence'},
                },
            ],
        };

        this.content_body = {
            id: 'content_body',
            component: Aside,
            template: 'tpl_aside_body',
            layout: {
                body: [
                    'project_heading',
                    'provisional_fund_form',
                    'funds_heading',
                    'project_table',
                ],
            },
            components: [
                this.project_heading,
                this.form,
                {
                    id: 'separator',
                    component: HTMLContent,
                    html: '<div style="padding:15px;"></div>',
                },
                this.funds_heading,
                this.project_table,
            ],
        };

        this.body = {
            id: 'body',
            component: Aside,
            template: 'tpl_body',
            layout: {
                header: 'header',
                toolbar: 'action_toolbar',
                body: 'content_body',
            },
            components: [this.header, this.action_toolbar, this.content_body],
        };

        this.page = this.new_instance(Aside, {
            id: 'page',
            template: 'tpl_aside_body',
            layout: {
                body: ['body'],
            },
            components: [this.body],
        });

        this.update_attribute_value = DataThing.backends.useractionhandler({
            url: 'update_attribute_value',
        });

        this.when(this.page).done(() => {
            _dfd.resolve();
        });
    }

    gen_entities_datasource(mapping) {
        return {
            type: 'dynamic',
            mapping: mapping,
            query: {
                target: 'diligence:entities',
                project_uid: {
                    type: 'observer',
                    event_type: this.project_uid_event,
                    required: true,
                },
            },
        };
    }
}

export default ProvisionalFundView;
