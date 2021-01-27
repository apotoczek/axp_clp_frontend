/* Automatically transformed from AMD to ES6. Beware of code smell. */
import TimeseriesChart from 'src/libs/components/charts/TimeseriesChart';
import MetricTable from 'src/libs/components/MetricTable';
import EventButton from 'src/libs/components/basic/EventButton';
import BooleanButton from 'src/libs/components/basic/BooleanButton';
import HTMLContent from 'src/libs/components/basic/HTMLContent';
import StringFilter from 'src/libs/components/basic/StringFilter';
import Aside from 'src/libs/components/basic/Aside';
import Header from 'src/libs/components/commander/Header';
import XHRActionButton from 'src/libs/components/basic/XHRActionButton';
import DataTable from 'src/libs/components/basic/DataTable';
import ko from 'knockout';
import DataThing from 'src/libs/DataThing';
import Context from 'src/libs/Context';
import Observer from 'src/libs/Observer';
import * as Utils from 'src/libs/Utils';
import DynamicWrapper from 'src/libs/components/basic/DynamicWrapper';

export default function() {
    let self = new Context({
        id: 'tests',
    });
    self.dfd = self.new_deferred();
    self.result_data = ko.observable({});
    self.endpoints = {
        get_all_status_validations: DataThing.backends.commander({
            url: 'get_all_status_validations',
        }),
        run_test: DataThing.backends.commander({
            url: 'run_test',
        }),
    };

    self.ids = {
        search_tests: {
            table: Utils.gen_id(
                self.get_id(),
                'page_wrapper',
                'search_tests',
                'search_body',
                'results_table',
            ),
            clear: Utils.gen_id(
                self.get_id(),
                'page_wrapper',
                'search_tests',
                'search_cpanel',
                'clear',
            ),
        },
    };

    self.events = {
        page_state: Utils.gen_event(self.get_id(), 'Tests.state'),
        back_url: Utils.gen_event(self.get_id(), 'Tests.back_url'),
        run_test: Utils.gen_event(
            'ActionButton.action.run_test',
            self.get_id(),
            'page_wrapper',
            'search_tests',
            'search_body',
            'results_table',
            'action',
        ),
        run_tests: Utils.gen_event(
            'ActionButton.action.run_tests',
            self.get_id(),
            'page_wrapper',
            'search_tests',
            'search_body',
            'search_header',
            'run_tests',
        ),
        run_test_on_page: Utils.gen_event(
            'ActionButton.action.run_test',
            self.get_id(),
            'page_wrapper',
            'show_results',
            'results_header',
            'run_test',
        ),
        view_results: Utils.gen_event(
            'ActionButton.action.view_results',
            self.get_id(),
            'page_wrapper',
            'search_tests',
            'search_body',
            'results_table',
            'action',
        ),
        status_identifier: Utils.gen_event(
            'ActionButton.action.status_uid',
            self.get_id(),
            'page_wrapper',
            'search_tests',
            'search_body',
            'results_table',
            'action',
        ),
        cancel: Utils.gen_event(self.get_id(), 'cancel'),
    };

    self.results_table = {
        id: 'results_table',
        component: DataTable,
        css: {'table-light': true, 'table-sm': true},
        enable_column_toggle: true,
        results_per_page: 50,
        enable_localstorage: true,
        row_key: 'identifier',
        columns: [
            {
                label: 'Test Name',
                sort_key: 'name',
                format: 'contextual_link',
                format_args: {
                    url: 'status-checker/<identifier>',
                    label_key: 'name',
                },
                visible: true,
            },
            {
                label: 'Pass?',
                key: 'valid',
                format: 'boolean_highlight',
                format_args: {
                    css: {
                        yes: 'text-green',
                    },
                },
                visible: true,
            },
            {
                label: 'Execution Time',
                key: 'execution_time',
                format: 'add_seconds',
            },
            {
                label: 'Start Time',
                key: 'start_time',
                format: 'backend_local_datetime',
                visible: false,
            },
            {
                label: 'End Time',
                key: 'end_time',
                format: 'backend_local_datetime',
            },
            {
                label: 'Failed Count',
                key: 'failed_ratio_str',
                format: 'failed_count',
            },
            {
                label: 'Run test',
                id: 'run_test_button',
                component_callback: 'data',
                disable_sorting: true,
                always_visible: true,
                width: '1%',
                component: {
                    id: 'action',
                    component: XHRActionButton,
                    endpoint: self.endpoints.run_test,
                    data_key: 'identifier',
                    running_event: self.events.run_tests,
                    cancel_event: self.events.cancel,
                    label: 'Run this test',
                    css: {
                        'btn-default': true,
                        'btn-xs': true,
                        'btn-cpanel-success': true,
                    },
                },
            },
        ],
        datasource: {
            type: 'dynamic',
            query: {
                target: 'commander:get_all_status_validations',
                result_per_page: 50,
                filters: {
                    type: 'dynamic',
                    query: {
                        string_filter: {
                            type: 'observer',
                            event_type: Utils.gen_event(
                                'StringFilter.value',
                                self.get_id(),
                                'page_wrapper',
                                'search_tests',
                                'search_cpanel',
                                'string_filter',
                            ),
                        },
                        only_failed: {
                            type: 'observer',
                            event_type: Utils.gen_event(
                                'BooleanButton.state',
                                self.get_id(),
                                'page_wrapper',
                                'search_tests',
                                'search_cpanel',
                                'failed',
                            ),
                            required: true,
                        },
                    },
                },
            },
        },
    };

    self.test_results_table = {
        component: DataTable,
        id: 'test_results_table',
        css: 'table-light table-sm',
        results_per_page: 20,
        enable_column_toggle: true,
        empty_template: 'tpl_data_table_passed_test',
        label: 'Results from latest test',
        columns: [
            {
                label: 'ID',
                key: 'identifier',
                format: 'strings_full',
            },
            {
                label: 'Errors',
                key: 'errors',
                format: 'strings_full',
                css: {
                    'text-danger': true,
                },
            },
            {
                label: 'Warnings',
                key: 'warnings',
                format: 'strings_full',
                css: {
                    'text-warning': true,
                },
            },
            {
                label: 'Description',
                key: 'entity_description',
                format: 'strings_full',
                visible: false,
            },
        ],
        datasource: {
            type: 'dynamic',
            query: {
                target: 'commander:get_test_results',
                results_per_page: 20,
                identifier: {
                    type: 'observer',
                    event_type: self.events.status_identifier,
                    required: true,
                },
            },
        },
    };

    self.search_header = {
        id: 'search_header',
        component: Header,
        title: 'Status Checker',
        // subtitle: 'Validation tests for different data types',
        // subtitle_css: {'subtitle-margin': true},
        buttons: [
            {
                id: 'run_tests',
                label: 'Run all tests<span class="icon-play">',
                action: 'run_tests',
                css: {
                    btn: true,
                    'btn-sm': true,
                    'btn-cpanel-success': true,
                    'pull-right': true,
                },
            },
        ],
        data_table_id: self.ids.search_tests.table,
    };

    self.results_header = {
        id: 'results_header',
        component: Header,
        buttons: [
            {
                id: 'run_test',
                component: XHRActionButton,
                label: 'Run Test',
                action: 'run_test',
                endpoint: self.endpoints.run_test,
                data_key: 'identifier',
                running_event: self.events.run_tests,
                cancel_event: self.events.cancel,
                css: {
                    btn: true,
                    'btn-sm': true,
                    'btn-cpanel-success': true,
                    'pull-right': true,
                },
                use_header_data: true,
            },
        ],
        datasource: {
            type: 'dynamic',
            query: {
                target: 'commander:get_detailed_status_validation',
                identifier: {
                    type: 'observer',
                    event_type: self.events.status_identifier,
                    required: true,
                },
            },
        },
    };

    self.search_body = {
        id: 'search_body',
        component: Aside,
        template: 'tpl_aside_main_content',
        layout: {
            body: ['search_header', 'results_table'],
        },
        components: [self.results_table, self.search_header],
    };

    self.search_cpanel = {
        id: 'search_cpanel',
        component: Aside,
        template: 'tpl_aside_control_panel',
        layout: {
            body: ['string_filter', 'filter_label', 'failed', 'clear'],
        },
        components: [
            {
                id: 'string_filter',
                component: StringFilter,
                placeholder: 'Search...',
                enable_localstorage: true,
            },
            {
                id: 'filter_label',
                html: '<h3>Filters</h3>',
                component: HTMLContent,
            },
            {
                id: 'failed',
                component: BooleanButton,
                default_state: false,
                template: 'tpl_boolean_button',
                btn_css: {
                    'btn-primary': true,
                    'btn-sm': true,
                    'btn-block': true,
                },
                label: 'Show only failed tests',
                enable_localstorage: true,
            },
            {
                id: 'clear',
                component: EventButton,
                template: 'tpl_cpanel_button',
                css: {'btn-sm': true, 'btn-default': true},
                label: 'Restore Defaults',
            },
        ],
    };

    self.test_info = {
        id: 'test_info',
        component: MetricTable,
        css: {'table-light': true},
        columns: 1,
        description_key: 'description',
        metrics: [
            {
                label: 'Pass?',
                value_key: 'valid',
                format: 'boolean_highlight',
                format_args: {
                    css: {
                        yes: 'text-green',
                    },
                },
            },
            {
                label: 'Execution Time',
                value_key: 'execution_time',
                format: 'add_seconds',
            },
            {
                label: 'Start Time',
                value_key: 'start_time',
                format: 'backend_local_datetime',
            },
            {
                label: 'End Time',
                value_key: 'end_time',
                format: 'backend_local_datetime',
            },
            {
                label: 'Failed Count',
                value_key: 'failed_ratio_str',
                format: 'failed_count',
            },
            {
                label: 'Warning Count',
                value_key: 'warnings_ratio_str',
                format: 'warning_count',
            },
        ],
        datasource: {
            type: 'dynamic',
            query: {
                target: 'commander:get_detailed_status_validation',
                identifier: {
                    type: 'observer',
                    event_type: self.events.status_identifier,
                    required: true,
                },
            },
        },
    };

    self.results_history = {
        component: TimeseriesChart,
        id: 'results_history',
        colors: [
            '#4D4D4D',
            '#6D83A3',
            '#3A66C3',
            '#3AC376',
            '#C36161',
            '#8547D4',
            '#F95532',
            '#C33A3A',
            '#61C38C',
            '#6180C3',
            '#F97559',
        ],
        use_backend_local_datetime: true,
        series: [
            {
                key: 'timeline_data',
                name: 'Failed Count',
                type: 'line',
            },
        ],
        yAxis: {
            min: 0,
            tick_interval: 1,
        },
        height: 450,
        datasource: {
            type: 'dynamic',
            query: {
                target: 'commander:get_detailed_status_validation',
                identifier: {
                    type: 'observer',
                    event_type: self.events.status_identifier,
                    required: true,
                },
            },
        },
    };

    self.chart_table_block = {
        component: Aside,
        id: 'chart_table_block',
        template: 'tpl_aside_split_full',
        layout: {
            col_1: 'test_info',
            col_2: 'results_history',
        },
        components: [self.test_info, self.results_history],
    };

    self.search_tests = {
        id: 'search_tests',
        component: Aside,
        template: 'tpl_aside_body',
        layout: {
            body: ['search_cpanel', 'search_body'],
        },
        components: [self.search_cpanel, self.search_body],
    };

    self.show_results = {
        id: 'show_results',
        component: Aside,
        template: 'tpl_aside_main_content',
        layout: {
            body: ['results_header', 'chart_table_block', 'test_results_table'],
        },
        components: [self.results_header, self.chart_table_block, self.test_results_table],
    };

    self.page_wrapper = self.new_instance(
        DynamicWrapper,
        {
            id: 'page_wrapper',
            template: 'tpl_dynamic_wrapper',
            active_component: 'search_tests',
            set_active_event: self.events.page_state,
            components: [self.search_tests, self.show_results],
        },
        self.shared_components,
    );

    self.handle_url = function(url) {
        if (url.length == 1) {
            Observer.broadcast(self.events.page_state, 'search_tests');
            Observer.broadcast(self.events.status_identifier, undefined);
        }
        if (url.length == 2) {
            Observer.broadcast(self.events.page_state, 'show_results');
            Observer.broadcast(self.events.status_identifier, url[1]);
        }
    };

    self.when(self.page_wrapper).done(() => {
        Observer.register(self.events.run_test_on_page, data => {
            let identifier = data.identifier || data.status.identifier;

            self.endpoints.run_test({
                data: {
                    identifier: identifier,
                },
                success: DataThing.api.XHRSuccess(() => {
                    DataThing.status_check();
                }),
                error: DataThing.api.XHRError(error => {
                    DataThing.status_check();
                    alert(error);
                }),
            });
        });

        Observer.register(self.events.run_tests, () => {
            self.endpoints.run_test({
                data: {
                    identifier: 'all',
                },
                success: DataThing.api.XHRSuccess(() => {
                    DataThing.status_check();
                    Observer.broadcast(self.events.cancel);
                }),
                error: DataThing.api.XHRError(error => {
                    DataThing.status_check();
                    alert(error);
                    Observer.broadcast(self.events.cancel);
                }),
            });
        });

        Observer.register_hash_listener('status-checker', self.handle_url);

        Observer.register(self.events.view_results, data => {
            self.result_data(data);

            Observer.broadcast(self.events.page_state, 'show_results');
        });

        self.dfd.resolve();
    });

    return self;
}
