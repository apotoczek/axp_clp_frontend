/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ActionHeader from 'src/libs/components/basic/ActionHeader';
import ActionButton from 'src/libs/components/basic/ActionButton';
import DataTable from 'src/libs/components/basic/DataTable';
import Breadcrumb from 'src/libs/components/basic/Breadcrumb';
import BreadcrumbHeader from 'src/libs/components/basic/BreadcrumbHeader';
import config from 'config';
import Aside from 'src/libs/components/basic/Aside';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import * as Utils from 'src/libs/Utils';
import Observer from 'src/libs/Observer';
import DataThing from 'src/libs/DataThing';
import StringFilter from 'src/libs/components/basic/StringFilter';
import Label from 'src/libs/components/basic/Label';
import MetaInfo from 'src/libs/components/MetaInfo';
import EventButton from 'src/libs/components/basic/EventButton';
import EventRegistry from 'src/libs/components/basic/EventRegistry';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    self.dfd = self.new_deferred();
    self.events = self.new_instance(EventRegistry, {});
    self.events.resolve_and_add('name', 'StringFilter.value');
    self.clear_event = Utils.gen_event('EventButton', self.get_id(), 'clear_button');
    self.shared_components = {
        search_label: self.new_instance(Label, {
            id: 'search_label',
            css: {'first-header': true},
            template: 'tpl_cpanel_label',
            label: 'Search',
        }),
        name: self.new_instance(StringFilter, {
            id: 'name',
            id_callback: self.events.register_alias('name'),
            template: 'tpl_string_filter',
            enable_localstorage: true,
            placeholder: 'Name...',
            cpanel_style: true,
            set_state_event_type: 'StateHandler.load',
            clear_event: self.clear_event,
        }),
        meta_info: self.new_instance(MetaInfo, {
            id: 'meta_info',
            label: 'Results',
            format: 'number',
            datasource: {
                type: 'observer',
                event_type: Utils.gen_event(
                    'DataTable.count',
                    self.get_id(),
                    'body',
                    'body_content',
                    'archive_body',
                ),
            },
        }),
        clear_button: self.new_instance(EventButton, {
            id: 'clear_button',
            template: 'tpl_cpanel_button',
            css: {'btn-sm': true, 'btn-default': true},
            label: 'Clear All',
        }),
    };

    self.cpanel_tools = {
        id: 'tools',
        template: 'tpl_cpanel_body_items',
        layout: {
            body: ['search_label', 'name', 'meta_info', 'clear_button'],
        },
    };

    self.cpanel = {
        component: Aside,
        id: 'cpanel',
        title: 'Reports',
        title_css: 'performance-calculator',
        template: 'tpl_analytics_cpanel',
        layout: {
            body: ['tools'],
        },
        components: [self.cpanel_tools],
    };

    self.header = {
        component: BreadcrumbHeader,
        id: 'header',
        template: 'tpl_breadcrumb_header',
        origin_url: '#!/fund-modeler',
        title: 'Fund Modeler',
        layout: {
            breadcrumb: 'breadcrumb',
        },
        components: [
            {
                id: 'breadcrumb',
                component: Breadcrumb,
                items: [
                    {
                        label: 'Fund Modeler',
                        link: '#!/fund-modeler',
                    },
                    {
                        label: 'Archive',
                    },
                ],
            },
        ],
    };

    self.archive_body = {
        id: 'archive_body',
        component: DataTable,
        enable_localstorage: true,
        enable_clear_order: true,
        css: {'table-light': true, 'table-sm': true},
        results_per_page: 50,
        columns: [
            {
                label: 'Name',
                sort_key: 'name',
                format: 'model_report_link',
            },
            {
                label: 'Report Type',
                key: 'params:entity_type',
                format: 'titleize',
                default_value: 'Investor',
                disable_sorting: true,
            },
            {
                label: 'Date',
                key: 'created',
                format: 'backend_local_datetime',
            },
            {
                component_callback: 'data',
                //label: 'Download',
                always_visible: true,
                disable_sorting: true,
                type: 'component',
                component: {
                    disabled_callback: report => !report || !report.binary_asset_uid,
                    id: 'download',
                    component: ActionButton,
                    action: 'download',
                    label: 'Download',
                    css: {
                        'btn-ghost-default': true,
                        'btn-xs': true,
                    },
                },
            },
        ],
        datasource: {
            type: 'dynamic',
            query: {
                target: 'fund_modeler_reports',
                include_params: true,
                filters: {
                    type: 'dynamic',
                    query: {
                        string_filter: {
                            type: 'observer',
                            event_type: self.events.get('name'),
                            default: '',
                        },
                    },
                },
                order_by: [
                    {
                        name: 'created',
                        sort: 'desc',
                    },
                ],
            },
        },
    };

    self.body_content = {
        id: 'body_content',
        component: Aside,
        template: 'tpl_body',
        layout: {
            header: 'header',
            toolbar: 'action_toolbar',
            body: 'archive_body',
        },
        components: [
            self.header,
            {
                component: ActionHeader,
                id: 'action_toolbar',
                template: 'tpl_action_toolbar',
                disable_export: true,
                buttons: [],
            },
            self.archive_body,
        ],
    };

    self._prepare_fund_modeler_pdf = DataThing.backends.useractionhandler({
        url: 'prepare_fund_modeler_pdf',
    });

    self.body = self.new_instance(
        Aside,
        {
            id: 'body',
            template: 'tpl_aside_body',
            layout: {
                body: ['cpanel', 'body_content'],
            },
            components: [self.cpanel, self.body_content],
        },
        self.shared_components,
    );

    self.when(self.body).done(() => {
        self.dfd.resolve();

        Observer.register(
            Utils.gen_event(
                'ActionButton.action.download',
                self.get_id(),
                'body',
                'body_content',
                'archive_body',
                'download',
            ),
            report => {
                if (report) {
                    self._prepare_fund_modeler_pdf({
                        data: {
                            uid: report.uid,
                        },
                        success: DataThing.api.XHRSuccess(key => {
                            DataThing.form_post(config.download_file_base + key);
                        }),
                        error: DataThing.api.XHRError(() => {}),
                    });
                }
            },
        );
    });

    return self;
}
