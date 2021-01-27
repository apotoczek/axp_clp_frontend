import EventButton from 'src/libs/components/basic/EventButton';
import MetaInfo from 'src/libs/components/MetaInfo';
import StringFilter from 'src/libs/components/basic/StringFilter';
import Aside from 'src/libs/components/basic/Aside';
import ActionButtons from 'src/libs/components/basic/ActionButtons';
import CreateActivityModal from 'src/libs/components/modals/CreateActivityModal';
import Header from 'src/libs/components/commander/Header';
import DataThing from 'src/libs/DataThing';
import Context from 'src/libs/Context';
import Observer from 'src/libs/Observer';
import {gen_id} from 'src/libs/Utils';
import DataTable from 'src/libs/components/basic/DataTable';
import DynamicWrapper from 'src/libs/components/basic/DynamicWrapper';
import EventRegistry from 'src/libs/components/basic/EventRegistry';

class Activity extends Context {
    constructor() {
        super({id: 'activity'});

        this.dfd = this.new_deferred();

        this.data_table_id = gen_id(
            this.get_id(),
            'page_wrapper',
            'search_activity',
            'search_body',
            'search_table',
        );

        this.events = this.new_instance(EventRegistry, {});
        this.events.new('pageState');
        this.events.resolve_and_add('dataTable', 'DataTable.counts', 'dataTableCounts');
        this.events.resolve_and_add('deleteActivity', 'ActionButtons.action.delete');
        this.events.resolve_and_add('stringFilter', 'StringFilter.value');
        this.events.resolve_and_add('clear', 'EventButton');

        this.endpoints = {
            delete_activity: DataThing.backends.commander({
                url: 'delete_activity',
            }),
        };

        this.search_header = {
            id: 'search_header',
            component: Header,
            title: 'Activity',
            buttons: [
                {
                    id: 'create',
                    label: 'Create Activity<span class="icon-plus">',
                    action: 'create',
                    css: {
                        btn: true,
                        'btn-sm': true,
                        'btn-cpanel-success': true,
                        'pull-right': true,
                    },
                    trigger_modal: {
                        component: CreateActivityModal,
                        id: 'create_activity_modal',
                    },
                },
            ],
            data_table_id: this.data_table_id,
        };

        this.search_table = {
            id: 'search_table',
            id_callback: this.events.register_alias('dataTable'),
            component: DataTable,
            css: {'table-light': true, 'table-sm': true},
            disable_sorting: true,
            columns: [
                {
                    label: 'Description',
                    key: 'description',
                },
                {
                    label: 'Title',
                    format: 'activity_title',
                },
                {
                    label: 'Custom Url',
                    key: 'data:url',
                    format: 'truncate',
                },
                {
                    label: 'Date',
                    key: 'created',
                    format: 'backend_local_datetime',
                },
                {
                    label: 'Expired',
                    key: 'expired',
                    format: 'boolean_highlight',
                },
                {
                    label: 'Expiry',
                    key: 'expiry',
                    format: 'backend_local_datetime',
                },
                {
                    label: 'Actions',
                    component_callback: 'data',
                    width: '1%',
                    component: {
                        id: 'actions',
                        id_callback: this.events.register_alias('deleteActivity'),
                        component: ActionButtons,
                        buttons: [
                            {
                                action: 'delete',
                                label: 'Delete',
                                disabled_label: '',
                                css: {
                                    'btn-danger': true,
                                    'btn-xs': true,
                                },
                            },
                        ],
                    },
                },
            ],
            datasource: {
                type: 'dynamic',
                query: {
                    target: 'commander:activities',
                    filters: {
                        type: 'dynamic',
                        query: {
                            string_filter: {
                                type: 'observer',
                                event_type: this.events.get('stringFilter'),
                            },
                        },
                    },
                },
            },
        };

        this.search_body = {
            id: 'search_body',
            component: Aside,
            template: 'tpl_aside_main_content',
            layout: {
                body: ['search_header', 'search_table'],
            },
            components: [this.search_header, this.search_table],
        };

        this.search_cpanel = {
            id: 'search_cpanel',
            component: Aside,
            template: 'tpl_aside_control_panel',
            layout: {
                body: ['string_filter', 'meta', 'clear'],
            },
            components: [
                {
                    id: 'string_filter',
                    id_callback: this.events.register_alias('stringFilter'),
                    component: StringFilter,
                    placeholder: 'Activity Name...',
                    enable_localstorage: true,
                    clear_event: this.events.get('clear'),
                },
                {
                    id: 'meta',
                    component: MetaInfo,
                    label: 'Activity',
                    format: 'visible_count',
                    css: {
                        'meta-primary': true,
                        'match-btn-sm': true,
                    },
                    datasource: {
                        type: 'observer',
                        event_type: this.events.get('dataTableCounts'),
                    },
                },
                {
                    id: 'clear',
                    id_callback: this.events.register_alias('clear'),
                    component: EventButton,
                    template: 'tpl_cpanel_button',
                    css: {'btn-sm': true, 'btn-default': true},
                    label: 'Restore Defaults',
                },
            ],
        };

        this.search_activity = {
            id: 'search_activity',
            component: Aside,
            template: 'tpl_aside_body',
            layout: {
                body: ['search_cpanel', 'search_body'],
            },
            components: [this.search_cpanel, this.search_body],
        };

        this.page_wrapper = this.new_instance(DynamicWrapper, {
            id: 'page_wrapper',
            template: 'tpl_dynamic_wrapper',
            active_component: 'search_activity',
            set_active_event: this.events.get('pageState'),
            components: [this.search_activity],
        });

        this.handle_url = url => {
            if (url.length === 1) {
                Observer.broadcast(this.events.get('pageState'), 'search_activity');
            }
        };

        this.when(this.page_wrapper).done(() => {
            Observer.register_hash_listener('activity', this.handle_url);

            Observer.register(this.events.get('deleteActivity'), activity => {
                let confirmed = confirm('Are you sure you want to delete the activity?');

                if (confirmed) {
                    this.endpoints.delete_activity({
                        data: {uid: activity.uid},
                        success: DataThing.api.XHRSuccess(() => {
                            DataThing.status_check();
                        }),
                        error: DataThing.api.XHRError(() => {}),
                    });
                }
            });
            this.dfd.resolve();
        });
    }
}

export default Activity;
