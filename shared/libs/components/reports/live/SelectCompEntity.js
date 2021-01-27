/* Automatically transformed from AMD to ES6. Beware of code smell. */
import AlphabetResultList from 'src/libs/components/reports/live/AlphabetResultList';
import EventButton from 'src/libs/components/basic/EventButton';
import AttributeFilters from 'src/libs/components/AttributeFilters';
import Radiolist from 'src/libs/components/basic/Radiolist';
import Label from 'src/libs/components/basic/Label';
import DynamicWrapper from 'src/libs/components/basic/DynamicWrapper';
import PopoverRange from 'src/libs/components/popovers/PopoverRange';
import NewPopoverButton from 'src/libs/components/popovers/NewPopoverButton';
import PopoverTable from 'src/libs/components/reports/live/PopoverTable';
import HTMLContent from 'src/libs/components/basic/HTMLContent';
import TextInput from 'src/libs/components/basic/TextInput';
import ToggleActionButton from 'src/libs/components/basic/ToggleActionButton';
import ko from 'knockout';
import pager from 'pager';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import DataSource from 'src/libs/DataSource';
import DataThing from 'src/libs/DataThing';
import Aside from 'src/libs/components/basic/Aside';
import Observer from 'src/libs/Observer';
import EventRegistry from 'src/libs/components/basic/EventRegistry';
import 'src/libs/bindings/typeahead';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    self.dfd = self.new_deferred();

    self.template = 'tpl_body_no_layout';

    self.events = self.new_instance(EventRegistry, {});
    self.events.new('user_fund_uid');
    self.events.new('state_toggle');
    self.events.new('search_mode_state');
    self.events.new('display_range_filters');
    self.events.new('clear_range_filters');
    self.events.resolve_and_add('search_field', 'TextInput.value', 'search_string');
    self.events.resolve_and_add(
        'advanced_search_field',
        'TextInput.value',
        'advanced_search_string',
    );
    self.events.resolve_and_add(
        'suggested_investors',
        'PopoverTable.select',
        'select_suggested_investor',
    );
    self.events.resolve_and_add('suggested_funds', 'PopoverTable.select', 'select_suggested_fund');
    self.events.resolve_and_add(
        'advanced_results_table',
        'AlphabetResultList.click_row',
        'advanced_select_comp_entity',
    );
    self.events.resolve_and_add(
        'advanced_results_table',
        'AlphabetResultList.count',
        'advanced_results_count',
    );
    self.events.resolve_and_add('search_mode_toggle', 'ToggleActionButton.state');
    self.events.resolve_and_add('enum_attributes', 'AttributeFilters.state');
    self.events.resolve_and_add('entity_type', 'PopoverButton.value');
    self.events.resolve_and_add('clear_filters', 'EventButton');
    self.events.resolve_and_add('num_commitments', 'PopoverButton.value');
    self.events.resolve_and_add('fund_size_avg', 'PopoverButton.value');
    self.events.resolve_and_add('bite_size_avg', 'PopoverButton.value');
    self.events.new('fund_size_avg_millions');

    self.selected_fund = ko.observable();
    self.search_meta_count = ko.observable('');
    self.advanced_meta_count = Observer.observable(self.events.get('advanced_results_count'));
    self.entity_type = Observer.observable(self.events.get('entity_type'));
    self.meta_display_text = ko.computed(() => {
        let count = self.advanced_meta_count();
        let entity_type = self.entity_type.peek();
        if (entity_type) {
            switch (entity_type.value) {
                case 'fund':
                    return `Identified ${count} funds.`;
                case 'investor':
                    return `Identified ${count} investors.`;
                default:
                    return `Identified ${count} funds and investors.`;
            }
        }
    });

    self.limit_entity_type = opts.limit_entity_type;

    self.state = Observer.observable(self.events.get('search_mode_toggle'));

    self.report_events = opts.events;

    self.most_similar_investors = self.new_instance(DataSource, {
        datasource: {
            type: 'dynamic',
            key: 'investors',
            query: {
                target: 'most_similar_funds_and_investors',
                match_geography: false,
                user_fund_uid: {
                    type: 'observer',
                    event_type: self.events.get('user_fund_uid'),
                    required: true,
                },
            },
        },
    });

    self.most_similar_funds = self.new_instance(DataSource, {
        datasource: {
            type: 'dynamic',
            key: 'funds',
            query: {
                target: 'most_similar_funds_and_investors',
                match_geography: false,
                user_fund_uid: {
                    type: 'observer',
                    event_type: self.events.get('user_fund_uid'),
                    required: true,
                },
            },
        },
    });

    self.search_similar = function(query, callback) {
        DataThing.get({
            params: {
                target: 'similar_funds_and_investors',
                filters: {
                    match_user_fund_uid: self.selected_fund().user_fund_uid,
                    match_style: true,
                    match_geography: false,
                    match_vintage: true,
                    only_recent_investors: true,
                    entity_type: 'investor',
                    name: query,
                },
                results_per_page: 10,
            },
            success: function(data) {
                if (data) {
                    self.search_meta_count(data.count);

                    if (callback) {
                        callback(data.results);
                    }
                }
            },
            error: function() {},
        });
    };

    self.typeahead_options = {
        minLength: 0,
        datasets: {
            source: self.search_similar,
            templates: {
                suggestion: function(data) {
                    if (data) {
                        return `<strong>${data.name}</strong>`;
                    }
                },
            },
        },
        on_select: function(event, entity) {
            Observer.broadcast(opts.select_comp_event, {
                data: entity,
                type: entity.entity_type,
            });
        },
    };

    self.search_mode_toggle = {
        id: 'search_mode_toggle',
        id_callback: self.events.register_alias('search_mode_toggle'),
        component: ToggleActionButton,
        template: 'tpl_anchor_action_button',
        css: {'btn-sm': true, 'advanced-search-btn': true},
        labels: [
            '<span class="glyphicon glyphicon-plus"></span><h5> Advanced Filters</h5>',
            '<span class="glyphicon glyphicon-remove"></span><h5> View Suggested Comps</h5>',
        ],
        actions: ['advanced_comps', 'suggested_comps'],
        key: 'search_mode_state',
        data: {},
    };

    self.toggle_wrapper = {
        component: Aside,
        id: 'toggle_wrapper',
        template: 'tpl_div_wrapper',
        css: {'advanced-search-wrapper': true},
        layout: {
            body: ['search_mode_toggle'],
        },
        components: [self.search_mode_toggle],
    };

    let search_placeholder = (function() {
        let type = self.limit_entity_type;
        if (type == 'fund') {
            return 'Search for a fund';
        }
        if (type == 'investor') {
            return 'Search for an investor';
        }
        return 'Search for a fund or investor';
    })();

    self.search_field = {
        id: 'search_field',
        id_callback: self.events.register_alias('search_field'),
        component: TextInput,
        template: 'tpl_text_input_typeahead',
        search_icon: true,
        placeholder: search_placeholder,
        typeahead_options: self.typeahead_options,
        css: {'big-dark-search-bar': true},
    };

    self.advanced_search_field = {
        id: 'advanced_search_field',
        id_callback: self.events.register_alias('advanced_search_field'),
        component: TextInput,
        template: 'tpl_text_input',
        search_icon: true,
        placeholder: search_placeholder,
        clear_event: self.events.get('clear_filters'),
        css: {'big-dark-search-bar': true},
    };

    self.results_meta = {
        id: 'results_meta',
        component: HTMLContent,
        html: ko.pureComputed(() => {
            if (self.limit_entity_type == 'fund') {
                return oneLine`
                        <h5 style="color: #39bee5; margin-bottom: 30px;">
                            <span style="font-weight:300 !important; line-height: 30px;">
                                Use the advanced search to view all funds.
                            </span>
                        </h5>
                    `;
            }

            if (self.limit_entity_type == 'investor') {
                return oneLine`
                        <h5 style="color: #39bee5; margin-bottom: 30px;">
                            <span style="font-weight:300 !important; line-height: 30px;">
                                Use the advanced search to view all investors.
                            </span>
                        </h5>
                    `;
            }

            return oneLine`
                    <h5 style="color: #39bee5; margin-bottom: 30px;">
                        Identified <strong>${self.search_meta_count()}</strong>
                        funds and investors active in your strategy.<br/>
                        <span style="font-weight:300 !important; line-height: 30px;">
                            Use the advanced search to view all funds and investors.
                        </span>
                    </h5>
                `;
        }),
        css: {'text-center': true},
    };

    self.advanced_results_meta = {
        id: 'advanced_results_meta',
        component: HTMLContent,
        template: 'tpl_live_reports_advanced_meta_count',
        css: {'text-center': true},
        html: self.meta_display_text,
        // datasource: {
        //     type: 'observer',
        //     event_type: self.events.get('advanced_results_count'),
        // }
    };

    self.suggested_funds = {
        component: PopoverTable,
        id: 'suggested_funds',
        id_callback: self.events.register_alias('suggested_funds'),
        title: 'Suggested Funds',
        data: self.most_similar_funds.data,
        dependencies: [self.most_similar_funds.get_id()],
        css: {
            'fund-modeler-entity': true,
        },
        item_css: 'fund-entity',
    };

    self.suggested_investors = {
        component: PopoverTable,
        id: 'suggested_investors',
        id_callback: self.events.register_alias('suggested_investors'),
        title: 'Suggested Investors',
        data: self.most_similar_investors.data,
        dependencies: [self.most_similar_funds.get_id()],
        css: {
            'fund-modeler-entity': true,
        },
        item_css: 'investor-entity',
    };

    let suggested_comps_template = (function() {
        let type = self.limit_entity_type;
        if (type == 'fund') {
            return 'tpl_live_report_suggested_funds';
        }
        if (type == 'investor') {
            return 'tpl_live_report_suggested_investors';
        }
        return 'tpl_live_report_suggested_comps';
    })();

    self.suggested_comps = {
        component: Aside,
        id: 'suggested_comps',
        template: suggested_comps_template,
        limit_entity_type: self.limit_entity_type,
        layout: {
            search_field: 'search_field',
            results_meta: 'results_meta',
            funds: 'suggested_funds',
            investors: 'suggested_investors',
        },
        components: [
            self.search_field,
            self.results_meta,
            self.suggested_funds,
            self.suggested_investors,
        ],
    };

    self.investor_range_attributes = {
        id: 'investor_range_attributes',
        component: Aside,
        template: 'tpl_aside_body',
        layout: {
            body: ['num_commitments', 'fund_size_avg'],
        },
        components: [
            {
                id: 'num_commitments',
                id_callback: self.events.register_alias('num_commitments'),
                component: NewPopoverButton,
                label: 'Num Commitments',
                clear_event: self.events.get('clear_range_filters'),
                css: {
                    'btn-block': true,
                    'btn-cpanel-primary': true,
                    'btn-sm': true,
                    'cpanel-dark-page': true,
                    'small-margin': true,
                },
                icon_css: 'glyphicon glyphicon-plus',
                popover_options: {
                    title: 'Num Commitments',
                    placement: 'right',
                    css_class: 'popover-cpanel',
                },
                popover_config: {
                    component: PopoverRange,
                    template: 'tpl_dark_magic_range',
                    suffix: '#',
                    placement: 'right',
                    title: 'investor_range_attributes',
                },
            },

            {
                id: 'fund_size_avg',
                id_callback: self.events.register_alias('fund_size_avg'),
                component: NewPopoverButton,
                label: 'Average Fund Size',
                clear_event: self.events.get('clear_range_filters'),
                css: {
                    'btn-block': true,
                    'btn-cpanel-primary': true,
                    'btn-sm': true,
                    'cpanel-dark-page': true,
                    'small-margin': true,
                },
                icon_css: 'glyphicon glyphicon-plus',
                popover_options: {
                    title: 'Average Fund Size',
                    placement: 'right',
                    css_class: 'popover-cpanel',
                },
                popover_config: {
                    component: PopoverRange,
                    template: 'tpl_dark_magic_range',
                    prefix: 'USD',
                    suffix: 'MM',
                    placement: 'right',
                    title: 'investor_range_attributes',
                },
            },
        ],
    };

    self.investor_range_attributes_wrapper = {
        id: 'investor_range_attributes_wrapper',
        component: DynamicWrapper,
        template: 'tpl_dynamic_wrapper',
        set_active_event: self.events.get('display_range_filters'),
        components: [self.investor_range_attributes],
    };

    self.advanced_cpanel = {
        id: 'advanced_cpanel',
        component: Aside,
        template: 'tpl_aside_body',
        layout: {
            body: [
                'label',
                'entity_type',
                'investor_range_attributes_wrapper',
                'enum_attributes',
                'clear_button',
            ],
        },
        components: [
            {
                id: 'label',
                component: Label,
                css: {'padded-cpanel-label': true, 'first-header': true},
                template: 'tpl_cpanel_label',
                label: 'Filter',
            },
            {
                id: 'entity_type',
                id_callback: self.events.register_alias('entity_type'),
                label: 'Entity Type',
                component: NewPopoverButton,
                css: {
                    'btn-block': true,
                    'btn-cpanel-primary': true,
                    'btn-sm': true,
                    'cpanel-dark-page': true,
                    'small-margin': true,
                },
                clear_event: self.clear_event,
                label_track_selection: true,
                popover_options: {
                    title: 'Entity Type',
                    placement: 'right',
                    css_class: 'popover-cpanel',
                },
                popover_config: {
                    component: Radiolist,
                    value_key: 'value',
                    label_key: 'label',
                    data: [
                        {
                            value: null,
                            label: 'All',
                        },
                        {
                            value: 'investor',
                            label: 'Investors',
                        },
                        {
                            value: 'fund',
                            label: 'Funds',
                        },
                    ],
                    default_selected_value: self.limit_entity_type,
                },
                visible: !self.limit_entity_type,
            },
            self.investor_range_attributes_wrapper,
            {
                id: 'enum_attributes',
                id_callback: self.events.register_alias('enum_attributes'),
                component: AttributeFilters,
                css: {
                    'cpanel-btn-sm': true,
                    'btn-block': true,
                    'btn-cpanel-primary': true,
                    'cpanel-dark-page': true,
                },
                clear_event: self.events.get('clear_filters'),
                set_state_event_type: 'StateHandler.load',
                enable_localstorage: false,
                datasource: {
                    type: 'dynamic',
                    query: {
                        target: 'filter_configs',
                        public_taxonomy: true,
                        exclude_enums: ['vertical', 'status'],
                    },
                },
            },
            {
                id: 'clear_button',
                id_callback: self.events.register_alias('clear_filters'),
                component: EventButton,
                template: 'tpl_cpanel_button',
                css: {'btn-sm': true, 'btn-cpanel-ghost': true},
                label: 'Clear All',
            },
        ],
    };

    self.results_table = {
        component: AlphabetResultList,
        id: 'results_table',
        show_entity_type: true,
        css: {
            'fund-modeler-entity': true,
        },
        id_callback: self.events.register_alias('advanced_results_table'),
        datasource: {
            type: 'dynamic',
            query: {
                results_per_page: 5000,
                target: 'similar_funds_and_investors',
                filters: {
                    type: 'dynamic',
                    query: {
                        name: {
                            type: 'observer',
                            event_type: self.events.get('advanced_search_string'),
                            required: false,
                        },
                        num_commitments: {
                            type: 'observer',
                            event_type: self.events.get('num_commitments'),
                            required: false,
                        },
                        fund_size_avg: {
                            type: 'observer',
                            event_type: self.events.get('fund_size_avg_millions'),
                            required: false,
                        },
                        bite_size_avg: {
                            type: 'observer',
                            event_type: self.events.get('bite_size_avg'),
                            required: false,
                        },
                        enums: {
                            type: 'observer',
                            event_type: self.events.get('enum_attributes'),
                        },
                        entity_type: {
                            type: 'observer',
                            event_type: self.events.get('entity_type'),
                            mapping: 'get_value',
                            required: false,
                        },
                    },
                },
            },
        },
    };

    self.advanced_comps = {
        component: Aside,
        id: 'advanced_comps',
        template: 'tpl_dark_magic_advanced_select_comp',
        layout: {
            top: ['advanced_search_field', 'advanced_results_meta'],
            left: 'advanced_cpanel',
            right: 'results_table',
        },
        components: [
            self.advanced_search_field,
            self.advanced_results_meta,
            self.advanced_cpanel,
            self.results_table,
        ],
    };

    self.comps_wrapper = {
        id: 'comps_wrapper',
        component: DynamicWrapper,
        template: 'tpl_dynamic_wrapper',
        active_component: 'suggested_comps',
        set_active_event: self.events.get('search_mode_toggle'),
        components: [self.suggested_comps, self.advanced_comps],
    };

    self.heading = {
        component: HTMLContent,
        id: 'heading',
        html: ko.pureComputed(() => {
            let selected = self.selected_fund();

            if (selected) {
                return `<h1>Model ${selected.name}</h1>`;
            }

            return '';
        }),
        css: {'text-center': true},
    };

    self.subtitle = {
        component: HTMLContent,
        id: 'subtitle',
        css: {'text-center': true},
        html: ko.pureComputed(() => {
            let type = self.limit_entity_type;
            if (type == 'fund') {
                return '<p class="lead">Select a fund to model against</p>';
            }
            if (type == 'investor') {
                return '<p class="lead">Select a investor to model against</p>';
            }
            return '<p class="lead">Select a fund or investor to model against</p>';
        }),
    };

    self.body = self.new_instance(Aside, {
        id: 'body',
        template: 'tpl_aside_body',
        layout: {
            body: ['heading', 'subtitle', 'toggle_wrapper', 'comps_wrapper'],
        },
        components: [self.heading, self.subtitle, self.toggle_wrapper, self.comps_wrapper],
    });

    self.when(self.body).done(() => {
        Observer.register(self.events.get('user_fund_uid'), () => {
            self.search_similar();
        });

        Observer.register(opts.select_fund_event, fund => {
            self.selected_fund(fund);
            Observer.broadcast(self.events.get('user_fund_uid'), fund.user_fund_uid);
        });

        Observer.register(self.events.get('select_suggested_fund'), row => {
            Observer.broadcast(opts.select_comp_event, {
                type: 'fund',
                data: row,
            });
        });

        Observer.register(self.events.get('select_suggested_investor'), row => {
            Observer.broadcast(opts.select_comp_event, {
                type: 'investor',
                data: row,
            });
        });

        Observer.register(self.events.get('advanced_select_comp_entity'), row => {
            Observer.broadcast(opts.select_comp_event, {
                type: row.entity_type,
                data: row,
            });
        });

        Observer.register(self.report_events.get('report_user_fund_uid'), uid => {
            if (self.selected_fund()) {
                Observer.broadcast(self.events.get('user_fund_uid'), uid);
            } else if (window.location.href.includes('#!/fund-modeler/wizard/select_comp')) {
                pager.navigate('#!/fund-modeler/wizard/start');
            }
        });

        Observer.register(self.events.get('entity_type'), entity_type => {
            if (entity_type.value === 'investor') {
                Observer.broadcast(
                    self.events.get('display_range_filters'),
                    'investor_range_attributes',
                );
            } else {
                Observer.broadcast(self.events.get('display_range_filters'), false);
                Observer.broadcast(self.events.get('clear_range_filters'));
            }
        });

        Observer.register(self.events.get('clear_filters'), () => {
            Observer.broadcast(self.events.get('clear_range_filters'));
        });

        Observer.register(self.events.get('fund_size_avg'), data => {
            let data_in_millions = {};
            for (let [key, value] of Object.entries(data)) {
                data_in_millions[key] = value * 1000000;
            }
            Observer.broadcast(self.events.get('fund_size_avg_millions'), data_in_millions);
        });

        self.dfd.resolve();
    });

    return self;
}
