import ActionHeader from 'src/libs/components/basic/ActionHeader';
import Aside from 'src/libs/components/basic/Aside';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import Breadcrumb from 'src/libs/components/basic/Breadcrumb';
import BreadcrumbHeader from 'src/libs/components/basic/BreadcrumbHeader';
import DataTable from 'src/libs/components/basic/DataTable';
import EventButton from 'src/libs/components/basic/EventButton';
import EventRegistry from 'src/libs/components/basic/EventRegistry';
import MetricsTemplateModal from 'src/libs/components/modals/MetricsTemplateModal';
import MetricsUploadModal from 'src/libs/components/modals/MetricsUploadModal';
import Observer from 'src/libs/Observer';

class DataCollection extends BaseComponent {
    constructor(opts, components) {
        super(opts, components);
        let _dfd = this.new_deferred();

        this.company_filter_event = opts.company_filter_event;
        this.fund_filter_event = opts.fund_filter_event;

        let events = this.new_instance(EventRegistry, {});
        events.resolve_and_add('generate_template_button', 'EventButton');

        let action_buttons = [
            {
                id: 'upload_filled_template',
                label: 'Upload Sheet <span class="icon-upload"></span>',
                action: 'upload_filled_template',
                css: {
                    btn: true,
                    'btn-transparent-success': true,
                },
                trigger_modal: {
                    id: 'upload_modal',
                    component: MetricsUploadModal,
                },
            },
        ];

        this.body = this.new_instance(Aside, {
            id: 'body',
            template: 'tpl_body',
            layout: {
                header: 'header',
                toolbar: 'action_toolbar',
                body: 'companies_table',
            },
            components: [
                {
                    component: BreadcrumbHeader,
                    id: 'header',
                    template: 'tpl_breadcrumb_header',
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
                                    label: 'Collection',
                                    link: '#!/data-manager/collection',
                                },
                            ],
                        },
                    ],
                },
                {
                    id: 'action_toolbar',
                    component: ActionHeader,
                    template: 'tpl_action_toolbar',
                    disable_export: true,
                    buttons: action_buttons,
                },
                {
                    id: 'companies_table',
                    component: DataTable,
                    enable_selection: true,
                    enable_clear_order: true,
                    enable_csv_export: false,
                    row_key: 'company_uid',
                    column_toggle_css: {'fixed-column-toggle': true},
                    css: {'table-light': true, 'table-sm': true},
                    inline_data: true,
                    clear_order_event: this.clear_event,
                    columns: [
                        {
                            label: 'Fund',
                            key: 'user_fund_name',
                        },
                        {
                            label: 'Company',
                            key: 'company_name',
                        },
                        {
                            type: 'component',
                            width: '1%',
                            component_callback: 'data',
                            component: {
                                id: 'generate_template_button',
                                component: EventButton,
                                template: 'tpl_cpanel_button',
                                id_callback: events.register_alias('generate_template_button'),
                                css: {
                                    'btn-xs': true,
                                    'btn-ghost-default': true,
                                    'btn-block': false,
                                },
                                label: 'Generate Template',
                            },
                        },
                    ],
                    datasource: {
                        type: 'dynamic',
                        query: {
                            target: 'user_companies_metrics',
                            filters: {
                                type: 'dynamic',
                                query: {
                                    company_name: {
                                        type: 'observer',
                                        event_type: this.company_filter_event,
                                    },
                                    user_fund_uid: {
                                        type: 'observer',
                                        event_type: this.fund_filter_event,
                                        mapping: 'get_values',
                                        mapping_args: {
                                            key: 'entity_uid',
                                        },
                                        required: true,
                                    },
                                },
                            },
                        },
                    },
                },
            ],
        });

        this.generate_template_modal = this.new_instance(MetricsTemplateModal, {
            id: 'generate_template_modal',
        });

        Observer.register(events.get('generate_template_button'), data => {
            this.generate_template_modal.data(data);
            this.generate_template_modal.set_defaults(data.metrics);
            this.generate_template_modal.show();
        });

        this.when(this.body, this.generate_template_modal).done(() => {
            _dfd.resolve();
        });
    }
}

export default DataCollection;
