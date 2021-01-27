import ko from 'knockout';
import pager from 'pager';
import auth from 'auth';
import NewPopoverBody from 'src/libs/components/popovers/NewPopoverBody';
import Checklist from 'src/libs/components/basic/Checklist';
import NewPopoverButton from 'src/libs/components/popovers/NewPopoverButton';
import PopoverRange from 'src/libs/components/popovers/PopoverRange';
import AttributeFilters from 'src/libs/components/AttributeFilters';
import BooleanButton from 'src/libs/components/basic/BooleanButton';
import MetaInfo from 'src/libs/components/MetaInfo';
import EventButton from 'src/libs/components/basic/EventButton';
import StringFilter from 'src/libs/components/basic/StringFilter';
import Label from 'src/libs/components/basic/Label';
import DynamicWrapper from 'src/libs/components/basic/DynamicWrapper';
import NestedRadioButtons from 'src/libs/components/basic/NestedRadioButtons';
import Aside from 'src/libs/components/basic/Aside';
import Observer from 'src/libs/Observer';
import VehicleSearch from 'src/libs/components/datamanager/VehicleSearch';
import IndexSearch from 'src/libs/components/datamanager/IndexSearch';
import CompanySearch from 'src/libs/components/datamanager/CompanySearch';
import TextFieldsSearch from 'src/libs/components/datamanager/TextFieldsSearch';
import AttributeSearch from 'src/libs/components/datamanager/AttributeSearch';
import MetricSearch from 'src/libs/components/datamanager/MetricSearch';
import MetricVersionsSearch from 'src/libs/components/datamanager/MetricVersionsSearch';
import NetFundManager from 'src/libs/components/datamanager/NetFundManager';
import NetPortfolioManager from 'src/libs/components/datamanager/NetPortfolioManager';
import GrossFundManager from 'src/libs/components/datamanager/GrossFundManager';
import GrossPortfolioManager from 'src/libs/components/datamanager/GrossPortfolioManager';
import CompanyManager from 'src/libs/components/datamanager/CompanyManager';
import CalculatedMetricSetManager from 'src/libs/components/datamanager/CalculatedMetricSetManager';
import SetManager from 'src/libs/components/datamanager/SetManager';
import IndexManager from 'src/libs/components/datamanager/IndexManager';
import EventRegistry from 'src/libs/components/basic/EventRegistry';
import DataCollection from 'src/libs/components/datamanager/DataCollection';
import EditCalculatedMetricContainer from 'src/vm/my_data/calculated_metrics';
import Context from 'src/libs/Context';
import * as Utils from 'src/libs/Utils';
import 'src/libs/bindings/react';

class DataManagerVM extends Context {
    constructor() {
        super({
            id: 'datamanager',
        });

        this.dfd = this.new_deferred();

        const events = this.new_instance(EventRegistry);

        events.resolve_and_add('permissions', 'PopoverButton.value');
        events.resolve_and_add('company_filter', 'StringFilter.value');
        events.resolve_and_add('fund_filter', 'PopoverButton.value');
        events.resolve_and_add('clear_vehicles', 'EventButton');
        events.resolve_and_add('clear_companies', 'EventButton');
        events.resolve_and_add('clear_indexes', 'EventButton');
        events.resolve_and_add('navigation', 'RadioButtons.state');
        events.resolve_and_add('navigation', 'RadioButtons.set_state', 'set_navigation');

        events.add({
            name: 'company_count',
            event: 'DataTable.count',
            id: Utils.gen_id(this.get_id(), 'companies', 'body', 'entities_table'),
        });

        events.add({
            name: 'vehicle_count',
            event: 'DataTable.count',
            id: Utils.gen_id(this.get_id(), 'vehicles', 'body', 'entities_table'),
        });

        events.add({
            name: 'index_count',
            event: 'DataTable.count',
            id: Utils.gen_id(this.get_id(), 'indexes', 'body', 'entities_table'),
        });

        events.add({
            name: 'reset',
            event: 'Datamanager.reset',
        });

        const views = [
            ...Utils.conditional_element(
                [
                    {
                        label: 'Vehicles',
                        state: 'vehicles',
                    },
                ],
                auth.user_has_feature('analytics'),
            ),
            {
                label: 'Companies',
                state: 'companies',
            },
            ...Utils.conditional_element(
                [
                    {
                        label: 'Indexes',
                        state: 'indexes',
                    },
                ],
                auth.user_has_feature('analytics'),
            ),
            {
                label: 'Attributes',
                state: 'attributes',
            },
            {
                label: 'Text Fields',
                state: 'text-fields',
            },
            ...Utils.conditional_element(
                [
                    {
                        label: 'Metrics',
                        state: 'metrics',
                        menu: [
                            {
                                label: 'Types',
                                state: 'metrics:types',
                            },
                            ...Utils.conditional_element(
                                [
                                    {
                                        label: 'Versions',
                                        state: 'metrics:versions',
                                    },
                                ],
                                auth.user_has_feature('metric_versions'),
                            ),
                            ...Utils.conditional_element(
                                [
                                    {
                                        label: 'Calculated Metrics',
                                        state: 'metrics:calculated',
                                    },
                                ],
                                auth.user_has_feature('calculated_metrics'),
                            ),
                        ],
                    },
                ],
                auth.user_has_feature('metric_upload'),
            ),
            ...Utils.conditional_element(
                [
                    {
                        label: 'Data Collection',
                        state: 'collection',
                    },
                ],
                auth.user_has_feature('legacy_data_collection'),
            ),
        ];

        this.default_state = views[0].state;

        this.cpanel = this.init_cpanel(views, events);

        this.instances = {};

        this.gen = {};

        this.instance = name => {
            if (!this.instances[name]) {
                this.instances[name] = this.gen[name]();
            }

            return this.instances[name];
        };

        this.gen.vehicle_search = () => {
            return this.new_instance(VehicleSearch, {
                id: 'vehicles',
                cpanel_id: this.cpanel.get_id(),
                clear_event: events.get('clear_vehicles'),
                permissions_event: events.get('permissions'),
            });
        };

        this.gen.text_fields_search = () => {
            return this.new_instance(TextFieldsSearch, {
                id: 'text_fields',
                cpanel_id: this.cpanel.get_id(),
                reset_event: events.get('reset'),
            });
        };

        this.gen.company_search = () => {
            return this.new_instance(CompanySearch, {
                id: 'companies',
                cpanel_id: this.cpanel.get_id(),
                reset_event: events.get('reset'),
            });
        };

        this.gen.index_search = () => {
            return this.new_instance(IndexSearch, {
                id: 'indexes',
                cpanel_id: this.cpanel.get_id(),
                clear_event: events.get('clear_indexes'),
            });
        };

        this.gen.attribute_search = () => {
            return this.new_instance(AttributeSearch, {
                id: 'attributes',
                upload_wizard: this.upload_wizard,
            });
        };

        this.gen.metric_types_search = () => {
            return this.new_instance(MetricSearch, {
                id: 'metrics:types',
                upload_wizard: this.upload_wizard,
            });
        };

        this.gen.calculated_metrics_list = () => {
            return this.new_instance(EditCalculatedMetricContainer, {
                id: 'metrics:calculated_metrics',
            });
        };

        this.gen.metric_versions_search = () => {
            return this.new_instance(MetricVersionsSearch, {
                id: 'metrics:versions',
            });
        };

        this.gen.net_fund_manager = () => {
            return this.new_instance(NetFundManager, {
                id: 'net_fund_manager',
                reset_event: events.get('reset'),
            });
        };

        this.gen.remote_net_fund_manager = () => {
            return this.new_instance(NetFundManager, {
                id: 'remote_net_fund_manager',
                reset_event: events.get('reset'),
                is_remote_entity: true,
            });
        };

        this.gen.gross_fund_manager = () => {
            return this.new_instance(GrossFundManager, {
                id: 'gross_fund_manager',
                reset_event: events.get('reset'),
            });
        };

        this.gen.remote_net_portfolio_manager = () => {
            return this.new_instance(NetPortfolioManager, {
                id: 'remote_net_portfolio_manager',
                reset_event: events.get('reset'),
                is_remote_entity: true,
            });
        };

        this.gen.net_portfolio_manager = () => {
            return this.new_instance(NetPortfolioManager, {
                id: 'net_portfolio_manager',
                reset_event: events.get('reset'),
            });
        };

        this.gen.gross_portfolio_manager = () => {
            return this.new_instance(GrossPortfolioManager, {
                id: 'gross_portfolio_manager',
                reset_event: events.get('reset'),
            });
        };

        this.gen.company_manager = () => {
            return this.new_instance(CompanyManager, {
                id: 'company_manager',
                reset_event: events.get('reset'),
            });
        };

        this.gen.calculated_metric_set_manager = () => {
            return this.new_instance(CalculatedMetricSetManager, {
                id: 'calculated_metric_set_manager',
                reset_event: events.get('reset'),
            });
        };

        this.gen.metric_set_manager = () => {
            return this.new_instance(SetManager, {
                id: 'metric_set_manager',
                reset_event: events.get('reset'),
            });
        };

        this.gen.index_manager = () => {
            return this.new_instance(IndexManager, {
                id: 'index_manager',
                reset_event: events.get('reset'),
            });
        };

        this.gen.collection = () => {
            return this.new_instance(DataCollection, {
                id: 'collection',
                company_filter_event: events.get('company_filter'),
                fund_filter_event: events.get('fund_filter'),
                reset_event: events.get('reset'),
            });
        };

        /********************************************************************
         * Active observable. Contains one of the modes defined above.
         *******************************************************************/

        this.active = ko.observable();

        /********************************************************************
         * Each of the modes has an 'asides' property which is essentially
           what columns to render.
         *******************************************************************/

        this.asides = ko.pureComputed(() => {
            let active = this.active();
            if (active && active.asides) {
                return active.asides;
            } else if (active && active.body) {
                return [this.cpanel, active.body];
            } else if (active) {
                return [active];
            }

            return [];
        });

        this.set_state = mode => {
            Observer.broadcast(events.get('set_navigation'), mode);
        };

        this.activate = {
            company: (view, args) => {
                this.when(view).done(() => {
                    if (args) {
                        if (args.uid) {
                            Observer.broadcast_for_id(
                                view.get_id(),
                                'Active.company_uid',
                                args.uid,
                                true,
                            );
                        } else {
                            Observer.broadcast_for_id(view.get_id(), 'Active.args', args, true);
                        }

                        view.create_new(args.create_new);
                        view.mode(undefined);
                    } else {
                        this.set_state('companies');
                    }

                    this.active(view);
                });
            },
            vehicle: (view, uid) => {
                this.when(view).done(() => {
                    if (uid) {
                        Observer.broadcast_for_id(view.get_id(), 'Active.vehicle_uid', uid, true);
                    } else {
                        this.set_state('vehicles');
                    }

                    this.active(view);
                });
            },
            index: (view, id) => {
                this.when(view).done(() => {
                    if (id) {
                        Observer.broadcast_for_id(view.get_id(), 'Active.market_id', id, true);
                    } else {
                        this.set_state('indexes');
                    }

                    this.active(view);
                });
            },
            default: (name, state = name) => {
                this.set_state(state);
                const instance = this.instance(name);

                this.when(instance).done(() => {
                    this.active(instance);
                });
            },
        };

        this.when(this.cpanel).done(() => {
            Observer.register(events.get('navigation'), state => {
                pager.navigate(`#!/data-manager/${state}`);
            });

            Observer.register('DeleteModal.delete_companies', payload => {
                if (payload.company_uids.length) {
                    Observer.broadcast_for_id(
                        this.instance('company_manager').get_id(),
                        'Active.company_uid',
                        undefined,
                    );
                }
            });
            Observer.register('DeleteModal.delete_entities', payload => {
                if (payload.portfolio_uids.length) {
                    Observer.broadcast_for_id(
                        this.instance('net_portfolio_manager').get_id(),
                        'Active.vehicle_uid',
                        undefined,
                    );
                    Observer.broadcast_for_id(
                        this.instance('gross_portfolio_manager').get_id(),
                        'Active.vehicle_uid',
                        undefined,
                    );
                }

                if (payload.user_fund_uids.length) {
                    Observer.broadcast_for_id(
                        this.instance('net_fund_manager').get_id(),
                        'Active.vehicle_uid',
                        undefined,
                    );
                    Observer.broadcast_for_id(
                        this.instance('remote_net_fund_manager').get_id(),
                        'Active.vehicle_uid',
                        undefined,
                    );
                    Observer.broadcast_for_id(
                        this.instance('gross_fund_manager').get_id(),
                        'Active.vehicle_uid',
                        undefined,
                    );
                }
            });

            Observer.register_hash_listener('data-manager', url => {
                Observer.broadcast(events.get('reset'));

                this.handle_url(url);
            });

            this.dfd.resolve();
        });
    }

    handle_url(url) {
        // Shift out 'data-manager'
        url.shift();

        Utils.match_array(
            url,
            [
                'vehicles',
                'remote',
                'fund',
                'net',
                uid => {
                    this.activate.vehicle(this.instance('remote_net_fund_manager'), uid);
                },
            ],
            [
                'vehicles',
                'fund',
                'net',
                uid => {
                    this.activate.vehicle(this.instance('net_fund_manager'), uid);
                },
            ],
            [
                'vehicles',
                'fund',
                'gross',
                uid => {
                    this.activate.vehicle(this.instance('gross_fund_manager'), uid);
                },
            ],
            [
                'vehicles',
                'remote',
                'portfolio',
                'net',
                uid => {
                    this.activate.vehicle(this.instance('remote_net_portfolio_manager'), uid);
                },
            ],
            [
                'vehicles',
                'portfolio',
                'net',
                uid => {
                    this.activate.vehicle(this.instance('net_portfolio_manager'), uid);
                },
            ],
            [
                'vehicles',
                'portfolio',
                'gross',
                uid => {
                    this.activate.vehicle(this.instance('gross_portfolio_manager'), uid);
                },
            ],
            [
                'vehicles',
                'company',
                uid => {
                    this.activate.vehicle(this.instance('company_manager'), uid);
                },
            ],
            [
                'vehicles',
                () => {
                    this.activate.vehicle(this.instance('vehicle_search'));
                },
            ],
            [
                'companies',
                'new',
                () => {
                    this.activate.company(this.instance('company_manager'), {create_new: true});
                },
            ],
            [
                'companies',
                uid => {
                    if (uid) {
                        this.activate.company(this.instance('company_manager'), {uid});
                    } else {
                        this.activate.company(this.instance('company_search'));
                    }
                },
            ],
            [
                'metric-sets',
                uid => {
                    this.activate.vehicle(this.instance('metric_set_manager'), uid);
                },
            ],
            [
                'calculated-metric-sets',
                (company_uid, metric_uid, frequency, time_frame, version_uid) => {
                    this.activate.company(this.instance('calculated_metric_set_manager'), {
                        company_uid,
                        metric_uid,
                        time_frame,
                        frequency,
                        version_uid,
                    });
                },
            ],
            [
                'indexes',
                /.+/,
                id => {
                    this.activate.index(this.instance('index_manager'), id);
                },
            ],
            [
                'indexes',
                () => {
                    this.activate.index(this.instance('index_search'));
                },
            ],
            [
                'attributes',
                () => {
                    this.activate.default('attribute_search', 'attributes');
                },
            ],
            [
                'text-fields',
                () => {
                    this.activate.default('text_fields_search', 'text-fields');
                },
            ],
            [
                'metrics:types',
                () => {
                    this.activate.default('metric_types_search', 'metrics:types');
                },
            ],
            [
                'metrics:versions',
                () => {
                    this.activate.default('metric_versions_search', 'metrics:versions');
                },
            ],
            [
                'metrics:calculated',
                (...path) => {
                    this.activate.default(
                        'calculated_metrics_list',
                        ['metrics:calculated', ...path].join('/'),
                    );
                },
            ],
            [
                'collection',
                () => {
                    this.activate.default('collection');
                },
            ],
            [
                () => {
                    pager.navigate(`#!/data-manager/${this.default_state}`);
                },
            ],
        );
    }

    init_cpanel(views, events) {
        const tools = [];

        for (const view of views) {
            const config = this._tools_config(view.state, events);

            if (config) {
                tools.append(config);
            }
        }

        return this.new_instance(Aside, {
            id: 'cpanel',
            title: 'Data Manager',
            title_css: 'data-manager',
            template: 'tpl_analytics_cpanel',
            layout: {
                header: 'navigation',
                body: ['tools'],
            },
            components: [
                {
                    id: 'navigation',
                    id_callback: events.register_alias('navigation'),
                    component: NestedRadioButtons,
                    default_state: this.default_state,
                    button_css: {
                        'btn-block': true,
                        'btn-sm': true,
                        'btn-cpanel-primary': true,
                    },
                    menues: views,
                },
                {
                    id: 'tools',
                    component: DynamicWrapper,
                    active_component: 'vehicles',
                    template: 'tpl_dynamic_wrapper',
                    set_active_event: events.get('navigation'),
                    components: tools,
                },
            ],
        });
    }

    _tools_config(state, events) {
        switch (state) {
            case 'collection':
                return this._collection_tools_config(events);
            case 'indexes':
                return this._indexes_tools_config(events);
            case 'vehicles':
                return this._vehicles_tools_config(events);
            case 'companies':
                return this._companies_tools_config(events);
            default:
                return null;
        }
    }

    _collection_tools_config(events) {
        return {
            id: 'collection',
            template: 'tpl_cpanel_body_items',
            layout: {
                body: ['filter_label', 'fund_filter', 'company_filter'],
            },
            components: [
                {
                    id: 'filter_label',
                    component: Label,
                    template: 'tpl_cpanel_label',
                    label: 'Filters',
                },
                {
                    id: 'fund_filter',
                    component: NewPopoverButton,
                    track_selection_property: 'selected_string',
                    id_callback: events.register_alias('fund_filter'),
                    label: 'Funds',
                    css: {
                        'btn-sm': true,
                        'btn-cpanel-primary': true,
                        'btn-block': true,
                    },
                    popover_options: {
                        title: 'Columns',
                        placement: 'right',
                        css_class: 'popover-cpanel',
                    },
                    popover_config: {
                        component: Checklist,
                        enable_filter: true,
                        label_key: 'name',
                        value_key: 'uid',
                        strings: {
                            no_selection: 'All',
                        },
                        datasource: {
                            key: 'results',
                            type: 'dynamic',
                            query: {
                                target: 'vehicles',
                                results_per_page: 'all',
                                filters: {
                                    entity_type: 'user_fund',
                                    cashflow_type: 'gross',
                                },
                            },
                        },
                    },
                },
                {
                    id: 'company_filter',
                    component: StringFilter,
                    cpanel_style: true,
                    placeholder: 'Company Name...',
                    enable_localstorage: true,
                    id_callback: events.register_alias('company_filter'),
                },
            ],
        };
    }

    _indexes_tools_config(events) {
        return {
            id: 'indexes',
            template: 'tpl_cpanel_body_items',
            layout: {
                body: [
                    'search_label',
                    'name',
                    'meta_info',
                    'filter_label',
                    'permissions',
                    'clear_button',
                ],
            },
            components: [
                {
                    id: 'search_label',
                    component: Label,
                    template: 'tpl_cpanel_label',
                    label: 'Search',
                },
                {
                    id: 'name',
                    component: StringFilter,
                    template: 'tpl_string_filter',
                    enable_localstorage: true,
                    placeholder: 'Name...',
                    clear_event: events.get('clear_indexes'),
                    cpanel_style: true,
                },
                {
                    id: 'meta_info',
                    component: MetaInfo,
                    label: 'Results',
                    format: 'number',
                    datasource: {
                        type: 'observer',
                        event_type: events.get('index_count'),
                    },
                },
                {
                    id: 'filter_label',
                    component: Label,
                    template: 'tpl_cpanel_label',
                    label: 'Filters',
                },
                {
                    id: 'permissions',
                    component: NewPopoverButton,
                    css: {
                        'btn-block': true,
                        'btn-cpanel-primary': true,
                        'btn-sm': true,
                    },
                    icon_css: 'glyphicon glyphicon-plus',
                    popover_options: {
                        title: 'Filter by Permissions',
                        placement: 'right',
                        css_class: 'popover-cpanel',
                    },
                    clear_event: events.get('clear_indexes'),
                    label: 'Permission',
                    enable_localstorage: true,
                    popover_config: {
                        component: Checklist,
                        datasource: {
                            type: 'static',
                            data: [
                                {
                                    label: 'Read',
                                    value: 'read',
                                },
                                {
                                    label: 'Write',
                                    value: 'write',
                                },
                                {
                                    label: 'Share',
                                    value: 'share',
                                },
                            ],
                        },
                    },
                },
                {
                    id: 'clear_button',
                    id_callback: events.register_alias('clear_indexes'),
                    component: EventButton,
                    template: 'tpl_cpanel_button',
                    css: {'btn-sm': true, 'btn-default': true},
                    label: 'Clear All',
                },
            ],
        };
    }

    _companies_tools_config(events) {
        return {
            id: 'companies',
            template: 'tpl_cpanel_body_items',
            layout: {
                body: [
                    'search_label',
                    'name',
                    'meta_info',
                    // 'advanced_filters',
                    // 'entity_type',
                    // 'cashflow_type',
                    // 'enum_attributes',
                    // 'vintage_year',
                    // 'as_of_date',
                    // 'view_archive_toggle',
                    // 'remote_client',
                    'clear_button',
                ],
            },
            components: [
                {
                    id: 'search_label',
                    component: Label,
                    template: 'tpl_cpanel_label',
                    label: 'Search',
                },
                {
                    id: 'name',
                    component: StringFilter,
                    template: 'tpl_string_filter',
                    enable_localstorage: true,
                    placeholder: 'Name...',
                    cpanel_style: true,
                    clear_event: events.get('clear_companies'),
                },
                {
                    id: 'clear_button',
                    id_callback: events.register_alias('clear_companies'),
                    component: EventButton,
                    template: 'tpl_cpanel_button',
                    css: {'btn-sm': true, 'btn-default': true},
                    label: 'Clear All',
                },
                {
                    id: 'meta_info',
                    component: MetaInfo,
                    label: 'Results',
                    format: 'number',
                    datasource: {
                        type: 'observer',
                        event_type: events.get('company_count'),
                    },
                },
            ],
        };
    }

    _vehicles_tools_config(events) {
        return {
            id: 'vehicles',
            template: 'tpl_cpanel_body_items',
            layout: {
                body: [
                    'search_label',
                    'name',
                    'meta_info',
                    'advanced_filters',
                    'entity_type',
                    'cashflow_type',
                    'enum_attributes',
                    // 'vintage_year',
                    // 'as_of_date',
                    'view_archive_toggle',
                    'remote_client',
                    'clear_button',
                ],
            },
            components: [
                {
                    id: 'search_label',
                    component: Label,
                    template: 'tpl_cpanel_label',
                    label: 'Search',
                },
                {
                    id: 'name',
                    component: StringFilter,
                    template: 'tpl_string_filter',
                    enable_localstorage: true,
                    placeholder: 'Name...',
                    cpanel_style: true,
                    clear_event: events.get('clear_vehicles'),
                },
                {
                    id: 'clear_button',
                    id_callback: events.register_alias('clear_vehicles'),
                    component: EventButton,
                    template: 'tpl_cpanel_button',
                    css: {'btn-sm': true, 'btn-default': true},
                    label: 'Clear All',
                },
                {
                    id: 'meta_info',
                    component: MetaInfo,
                    label: 'Results',
                    format: 'number',
                    datasource: {
                        type: 'observer',
                        event_type: events.get('vehicle_count'),
                    },
                },
                {
                    id: 'view_archive_toggle',
                    component: BooleanButton,
                    template: 'tpl_cpanel_boolean_button',
                    default_state: false,
                    reset_event: events.get('reset'),
                    label: 'View Archive',
                },
                {
                    id: 'enum_attributes',
                    component: AttributeFilters,
                    css: {
                        'cpanel-btn-sm': true,
                        'btn-block': true,
                        'btn-cpanel-primary': true,
                    },
                    clear_event: events.get('clear_vehicles'),
                    datasource: {
                        type: 'dynamic',
                        query: {
                            target: 'filter_configs',
                            public_taxonomy: true,
                        },
                    },
                },
                // {
                //     id: 'vintage_year',
                //     component: NewPopoverButton,
                //     css: {
                //         'btn-block': true,
                //         'btn-cpanel-primary': true,
                //         'btn-sm': true,
                //     },
                //     icon_css: 'glyphicon glyphicon-plus',
                //     clear_event: events.get('clear_vehicles'),
                //     label: 'Vintage Year',
                //     popover_options: {
                //         title: 'Filter by Vintage Year',
                //         placement: 'right',
                //         css_class: 'popover-cpanel',
                //     },
                //     popover_config: {
                //         component: Checklist,
                //         enable_exclude: true,
                //         datasource: {
                //             type: 'dynamic',
                //             mapping: 'list_to_options',
                //             mapping_default: [],
                //             query: {
                //                 target: 'user:vintage_years',
                //                 filters: {
                //                     entity_type: ['user_fund', 'portfolio'],
                //                     exclude_portfolio_only: true,
                //                 },
                //             },
                //         },
                //     },
                // },
                // {
                //     id: 'as_of_date',
                //     component: NewPopoverButton,
                //     css: {
                //         'btn-block': true,
                //         'btn-cpanel-primary': true,
                //         'btn-sm': true,
                //     },
                //     icon_css: 'glyphicon glyphicon-plus',
                //     clear_event: events.get('clear_vehicles'),
                //     label: 'As of Date',
                //     popover_options: {
                //         title: 'Filter by As of Date',
                //         placement: 'right',
                //         css_class: 'popover-cpanel',
                //     },
                //     popover_config: {
                //         component: Checklist,
                //         enable_exclude: true,
                //         datasource: {
                //             type: 'dynamic',
                //             mapping: 'backend_dates_to_options',
                //             mapping_default: [],
                //             query: {
                //                 target: 'user:as_of_dates',
                //                 filters: {
                //                     entity_type: ['user_fund', 'portfolio'],
                //                     exclude_portfolio_only: true,
                //                     permissions: ['write', 'share'],
                //                 },
                //             },
                //         },
                //     },
                // },
                {
                    id: 'entity_type',
                    component: NewPopoverButton,
                    css: {
                        'btn-block': true,
                        'btn-cpanel-primary': true,
                        'btn-sm': true,
                    },
                    icon_css: 'glyphicon glyphicon-plus',
                    clear_event: events.get('clear_vehicles'),
                    label: 'Type',
                    popover_options: {
                        title: 'Filter by Type',
                        placement: 'right',
                        css_class: 'popover-cpanel',
                    },
                    popover_config: {
                        component: Checklist,
                        enable_exclude: true,
                        datasource: {
                            type: 'static',
                            data: [
                                {
                                    label: 'Portfolio',
                                    value: 'portfolio',
                                },
                                {
                                    label: 'Fund',
                                    value: 'user_fund',
                                },
                            ],
                        },
                    },
                },
                {
                    id: 'cashflow_type',
                    component: NewPopoverButton,
                    css: {
                        'btn-block': true,
                        'btn-cpanel-primary': true,
                        'btn-sm': true,
                    },
                    icon_css: 'glyphicon glyphicon-plus',
                    clear_event: events.get('clear_vehicles'),
                    label: 'Cash Flow Type',
                    popover_options: {
                        title: 'Filter by Cash Flow Type',
                        placement: 'right',
                        css_class: 'popover-cpanel',
                    },
                    popover_config: {
                        component: Checklist,
                        enable_exclude: true,
                        datasource: {
                            type: 'static',
                            data: [
                                {
                                    label: 'Net',
                                    value: 'net',
                                },
                                {
                                    label: 'Gross',
                                    value: 'gross',
                                },
                            ],
                        },
                    },
                },
                {
                    id: 'irr',
                    component: NewPopoverButton,
                    css: {
                        'btn-block': true,
                        'btn-cpanel-primary': true,
                        'btn-sm': true,
                    },
                    icon_css: 'glyphicon glyphicon-plus',
                    popover_options: {
                        title: 'Filter by IRR',
                        placement: 'right',
                        css_class: 'popover-cpanel',
                    },
                    label: 'IRR',
                    clear_event: events.get('clear_vehicles'),
                    enable_localstorage: true,
                    popover_config: {
                        component: PopoverRange,
                        template: 'tpl_popover_range',
                        suffix: '%',
                    },
                },
                {
                    id: 'tvpi',
                    component: NewPopoverButton,
                    css: {
                        'btn-block': true,
                        'btn-cpanel-primary': true,
                        'btn-sm': true,
                    },
                    icon_css: 'glyphicon glyphicon-plus',
                    popover_options: {
                        placement: 'right',
                        title: 'Filter by TVPI',
                        css_class: 'popover-cpanel',
                    },
                    label: 'TVPI',
                    clear_event: events.get('clear_vehicles'),
                    enable_localstorage: true,
                    popover_config: {
                        component: PopoverRange,
                        template: 'tpl_popover_range',
                        suffix: 'x',
                    },
                },
                {
                    id: 'dpi',
                    component: NewPopoverButton,
                    css: {
                        'btn-block': true,
                        'btn-cpanel-primary': true,
                        'btn-sm': true,
                    },
                    icon_css: 'glyphicon glyphicon-plus',
                    popover_options: {
                        placement: 'right',
                        title: 'Filter by DPI',
                        css_class: 'popover-cpanel',
                    },
                    label: 'DPI',
                    clear_event: events.get('clear_vehicles'),
                    enable_localstorage: true,
                    popover_config: {
                        component: PopoverRange,
                        template: 'tpl_popover_range',
                        suffix: 'x',
                    },
                },
                {
                    id: 'total_value',
                    component: NewPopoverButton,
                    css: {
                        'btn-block': true,
                        'btn-cpanel-primary': true,
                        'btn-sm': true,
                    },
                    icon_css: 'glyphicon glyphicon-plus',
                    popover_options: {
                        placement: 'right',
                        title: 'Total Value',
                        css_class: 'popover-cpanel',
                    },
                    label: 'Total Value',
                    clear_event: events.get('clear_vehicles'),
                    enable_localstorage: true,
                    popover_config: {
                        component: PopoverRange,
                        template: 'tpl_popover_range',
                        prefix: 'USD',
                        suffix: 'MM',
                    },
                },
                {
                    id: 'commitment',
                    component: NewPopoverButton,
                    css: {
                        'btn-block': true,
                        'btn-cpanel-primary': true,
                        'btn-sm': true,
                    },
                    icon_css: 'glyphicon glyphicon-plus',
                    popover_options: {
                        placement: 'right',
                        title: 'Filter by Commitment',
                        css_class: 'popover-cpanel',
                    },
                    label: 'Commitment',
                    clear_event: events.get('clear_vehicles'),
                    enable_localstorage: true,
                    popover_config: {
                        component: PopoverRange,
                        template: 'tpl_popover_range',
                        prefix: 'USD',
                        suffix: 'MM',
                    },
                },
                {
                    id: 'in_portfolio',
                    component: NewPopoverButton,
                    css: {
                        'btn-block': true,
                        'btn-cpanel-primary': true,
                        'btn-sm': true,
                    },
                    icon_css: 'glyphicon glyphicon-plus',
                    popover_options: {
                        placement: 'right',
                        title: 'In Portfolio',
                        css_class: 'popover-cpanel',
                    },
                    label: 'In Portfolio',
                    clear_event: events.get('clear_vehicles'),
                    enable_localstorage: true,
                    popover_config: {
                        component: Checklist,
                        enable_exclude: true,
                        strings: {
                            empty: 'You have no portfolios',
                        },
                        datasource: {
                            type: 'dynamic',
                            key: 'results',
                            mapping: 'to_options',
                            mapping_args: {
                                value_key: 'portfolio_uid',
                                label_key: 'name',
                            },
                            query: {
                                target: 'vehicles',
                                results_per_page: 'all',
                                filters: {
                                    entity_type: 'portfolio',
                                },
                            },
                        },
                    },
                },
                {
                    id: 'base_currency_symbol',
                    component: NewPopoverButton,
                    css: {
                        'btn-block': true,
                        'btn-cpanel-primary': true,
                        'btn-sm': true,
                    },
                    icon_css: 'glyphicon glyphicon-plus',
                    popover_options: {
                        placement: 'right',
                        title: 'Base Currency',
                        css_class: 'popover-cpanel',
                    },
                    clear_event: events.get('clear_vehicles'),
                    label: 'Base Currency',
                    enable_localstorage: true,
                    popover_config: {
                        component: Checklist,
                        enable_exclude: true,
                        datasource: {
                            type: 'dynamic',
                            mapping: 'list_to_options',
                            mapping_default: [],
                            query: {
                                target: 'user:currency_symbols',
                                filters: {
                                    entity_type: ['user_fund', 'portfolio'],
                                    exclude_portfolio_only: true,
                                },
                            },
                        },
                    },
                },
                // {
                //     id: 'shared_by',
                //     component: NewPopoverButton,
                //     css: {
                //         'btn-block': true,
                //         'btn-cpanel-primary': true,
                //         'btn-sm': true,
                //     },
                //     icon_css: 'glyphicon glyphicon-plus',
                //     popover_options: {
                //         placement: 'right',
                //         title: 'Shared By',
                //         css_class: 'popover-cpanel',
                //     },
                //     clear_event: events.get('clear_vehicles'),
                //     label: 'Shared By',
                //     enable_localstorage: true,
                //     popover_config: {
                //         component: Checklist,
                //         enable_exclude: true,
                //         datasource: {
                //             type: 'dynamic',
                //             mapping: 'list_to_options',
                //             mapping_default: [],
                //             query: {
                //                 target: 'user:shared_bys',
                //                 filters: {
                //                     entity_type: ['user_fund', 'portfolio'],
                //                     exclude_portfolio_only: true,
                //                 },
                //             },
                //         },
                //     },
                // },
                {
                    id: 'remote_client',
                    component: NewPopoverButton,
                    label: 'Remote Client',
                    css: {
                        'btn-cpanel-primary': true,
                        'btn-sm': true,
                        'btn-block': true,
                    },
                    icon_css: 'glyphicon glyphicon-plus',
                    clear_event: events.get('clear_vehicles'),
                    visible_callback: popover => {
                        let options = popover.data();
                        if (options) {
                            return auth.user_has_feature('remote_data_admin') && options.length > 0;
                        }
                        return auth.user_has_feature('remote_data_admin');
                    },
                    popover_options: {
                        title: 'Remote Client',
                        placement: 'right',
                        css_class: 'popover-cpanel',
                    },
                    popover_config: {
                        component: Checklist,
                        enable_filter: true,
                        label_key: 'name',
                        value_key: 'uid',
                        datasource: {
                            key: 'results',
                            type: 'dynamic',
                            query: {
                                target: 'user:list_remote_clients',
                                results_per_page: 'all',
                                filter_empty: true,
                                order_by: [
                                    {
                                        name: 'name',
                                        sort: 'asc',
                                    },
                                ],
                            },
                        },
                    },
                },
                {
                    component: NewPopoverButton,
                    id: 'advanced_filters',
                    template: 'tpl_header_with_advanced',
                    label: 'filters',
                    popover_options: {
                        placement: 'right',
                        css_class: 'popover-cpanel-advanced',
                    },
                    popover_config: {
                        id: 'advanced_filters_popover',
                        component: NewPopoverBody,
                        template: 'tpl_popover_new_body',
                        layout: {
                            body: [
                                'advanced_filters_popover_label',
                                'commitment',
                                'total_value',
                                'irr',
                                'tvpi',
                                'dpi',
                                'permissions',
                                // 'shared_by',
                                'base_currency_symbol',
                                'in_portfolio',
                            ],
                        },
                        components: [
                            {
                                id: 'advanced_filters_popover_label',
                                component: Label,
                                template: 'tpl_cpanel_label',
                                label: 'Advanced',
                            },
                            {
                                id: 'permissions',
                                id_callback: events.register_alias('permissions'),
                                component: NewPopoverButton,
                                css: {
                                    'btn-cpanel-primary': true,
                                    'btn-sm': true,
                                    'btn-block': true,
                                },
                                icon_css: 'glyphicon glyphicon-plus',
                                clear_event: events.get('clear_vehicles'),
                                label: 'Permissions',
                                popover_options: {
                                    title: 'Filter by Permissions',
                                    placement: 'right',
                                    css_class: 'popover-cpanel',
                                },
                                popover_config: {
                                    component: Checklist,
                                    datasource: {
                                        type: 'static',
                                        data: [
                                            {
                                                label: 'Read',
                                                value: 'read,',
                                            },
                                            {
                                                label: 'Read and Write',
                                                value: 'write',
                                            },
                                            {
                                                label: 'Read, Write and Share',
                                                value: 'share',
                                            },
                                        ],
                                    },
                                    default: 'read',
                                },
                            },
                        ],
                    },
                },
            ],
        };
    }
}

export default DataManagerVM;
