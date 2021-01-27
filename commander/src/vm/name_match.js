import ko from 'knockout';
import config from 'config';
import DynamicWrapper from 'src/libs/components/basic/DynamicWrapper';
import NumberInput from 'src/libs/components/basic/NumberInput';
import Radiolist from 'src/libs/components/basic/Radiolist';
import NewPopoverButton from 'src/libs/components/popovers/NewPopoverButton';
import EventButton from 'src/libs/components/basic/EventButton';
import DataTable from 'src/libs/components/basic/DataTable';
import UploadButton from 'src/libs/components/upload/UploadButton';
import MetricTable from 'src/libs/components/MetricTable';
import DataThing from 'src/libs/DataThing';
import Context from 'src/libs/Context';
import * as Utils from 'src/libs/Utils';
import Observer from 'src/libs/Observer';
import Aside from 'src/libs/components/basic/Aside';
import EventRegistry from 'src/libs/components/basic/EventRegistry';

class NameMatch extends Context {
    constructor() {
        super({id: 'name-match'});

        this.dfd = this.new_deferred();

        this.match_names_endpoint = DataThing.backends.commander({
            url: 'name_match_action',
        });

        this._csv_export = DataThing.backends.commander({
            url: 'name_match_download',
        });

        this._name_match_index = DataThing.backends.commander({
            url: 'name_match_index_types',
        });

        this._end_session = DataThing.backends.commander({
            url: 'name_match_end_session',
        });

        this.events = this.new_instance(EventRegistry, {});
        this.events.new('state');
        this.events.new('uploadSuccess');
        this.events.new('uploadError');
        this.events.resolve_and_add('endSession', 'EventButton');
        this.events.resolve_and_add('selectIndex', 'PopoverButton.value');
        this.events.resolve_and_add('selectSheet', 'PopoverButton.value');
        this.events.resolve_and_add('selectThreshold', 'NumberInput.value');
        this.events.resolve_and_add('selectColumn', 'PopoverButton.value');

        this.workbook = ko.observableArray();
        this.matches = ko.observableArray();
        this.meta = ko.observable();
        this.key = ko.observable();
        this.indexes = ko.observable();
        this.uploading = ko.observable(false);

        this.enable_export = ko.observable(true);

        this.match_options = {
            threshold: 0.85,
            sheet: 0,
            column: 0,
            index: 'bison_funds',
        };

        this.meta_data = {
            id: 'meta_data',
            component: MetricTable,
            css: {'table-light': true},
            columns: 2,
            metrics: [
                {
                    label: 'Average Score',
                    value_key: 'avg_score',
                    format: 'percent',
                },
                {
                    label: '% of Matched names',
                    value_key: 'percent_matched',
                    format: 'percent',
                },
                {
                    label: 'Total Names',
                    value_key: 'total_names',
                },
                {
                    label: 'Total matches',
                    value_key: 'total_matches',
                },
            ],
            data: ko.computed(() => this.meta() || {}),
        };

        this.upload_button = {
            id: 'upload_button',
            component: UploadButton,
            label: 'Upload Spreadsheet',
            css: {
                btn: true,
                'btn-cpanel-success': true,
                'fileinput-button': true,
            },
            upload_endpoint: 'commander/name_match_upload',
            broadcast_success: this.events.get('uploadSuccess'),
            broadcast_error: this.events.get('uploadError'),
        };

        this.matches_table = {
            id: 'matches_table',
            component: DataTable,
            css: {'table-light': true, 'table-sm': true},
            empty_template: 'tpl_data_table_empty_with_label',
            inline_data: true,
            label: 'Matches',
            columns: [
                {
                    key: 'name',
                    label: 'Name',
                },
                {
                    key: 'score',
                    label: 'Match Score',
                    format: 'percent',
                },
                {
                    key: 'uid',
                    label: 'UID',
                },
            ],
            data: ko.computed(() => {
                const data = this.matches();
                return data || [];
            }),
        };

        this.disable_workbook_dependents = ko.observable(true);

        this.workbook.subscribe(workbook => {
            if (workbook.length) {
                this.disable_workbook_dependents(false);
            } else {
                this.disable_workbook_dependents(true);
            }
        });

        this.matching_names = ko.observable(false);

        this.end_session = {
            id: 'end_session',
            id_callback: this.events.register_alias('endSession'),
            component: EventButton,
            template: 'tpl_cpanel_button',
            label: 'End Session',
            disabled: ko.computed(() => {
                const key = this.key();
                return !key;
            }),
            css: {
                'btn-sm': true,
                'btn-danger': true,
            },
        };

        this.match_name_button = {
            id: 'match_name_button',
            component: EventButton,
            template: 'tpl_loading_cpanel_button',
            loading: this.matching_names,
            disabled: this.disable_workbook_dependents,
            label: 'Match Names',
        };

        this.export_result_button = {
            id: 'export_result_button',
            component: EventButton,
            template: 'tpl_cpanel_button',
            disabled: this.enable_export,
            label: 'Export Results',
        };

        this.sheet_dropdown = {
            id: 'sheet_dropdown',
            id_callback: this.events.register_alias('selectSheet'),
            component: NewPopoverButton,
            label: 'Sheet',
            disabled: this.disable_workbook_dependents,
            track_selection_property: 'selected_string',
            css: {
                'btn-sm': true,
                'btn-cpanel-primary': true,
                'btn-block': true,
            },
            popover_options: {
                title: 'Sheets',
                placement: 'right',
                css_class: 'popover-default',
            },
            popover_config: {
                component: Radiolist,
                data: ko.pureComputed(() => {
                    const data = this.workbook();

                    if ((data || []).length) {
                        return data.map((item, index) => {
                            return {
                                label: item.name,
                                value: index,
                            };
                        });
                    }
                    return [];
                }),
            },
        };

        this.col_dropdown = {
            id: 'col_dropdown',
            id_callback: this.events.register_alias('selectColumn'),
            component: NewPopoverButton,
            track_selection_property: 'selected_string',
            disabled: this.disable_workbook_dependents,
            label: 'Column',
            css: {
                'btn-sm': true,
                'btn-cpanel-primary': true,
                'btn-block': true,
            },
            popover_options: {
                title: 'Columns',
                placement: 'right',
                css_class: 'popover-default',
            },
            popover_config: {
                component: Radiolist,
                data: ko.pureComputed(() => {
                    const data = this.workbook();
                    const sheet = this.match_options['sheet'];

                    if (data && data[sheet] && data[sheet].data && data[sheet].data.length) {
                        return data[sheet].data[0].map((item, index) => {
                            return {
                                label: `Column ${index + 1}`,
                                value: index,
                            };
                        });
                    }
                    return [];
                }),
            },
        };

        this.index_type = {
            id: 'index_type',
            id_callback: this.events.register_alias('selectIndex'),
            component: NewPopoverButton,
            track_selection_property: 'selected_string',
            label: 'Index',
            css: {
                'btn-sm': true,
                'btn-cpanel-primary': true,
                'btn-block': true,
            },
            popover_options: {
                title: 'Indexes',
                placement: 'right',
                css_class: 'popover-default',
            },
            popover_config: {
                component: Radiolist,
                data: ko.pureComputed(() => {
                    return this.indexes() || [];
                }),
            },
        };

        this.threshold = {
            id: 'threshold',
            id_callback: this.events.register_alias('selectThreshold'),
            component: NumberInput,
            placeholder: 'Threshold',
            initial_value_property: 'value',
            value_format: 'percent',
            in_cpanel: true,
            custom_validator: val => val <= 1 && val > 0,
            css: {'input-xs': true},
            data: {
                value: 0.85,
            },
        };

        this.cpanel = {
            id: 'cpanel',
            component: Aside,
            template: 'tpl_aside_control_panel',
            layout: {
                body: [
                    'sheet_dropdown',
                    'col_dropdown',
                    'index_type',
                    'threshold',
                    'match_name_button',
                    'export_result_button',
                    'end_session',
                ],
            },
            components: [
                this.end_session,
                this.col_dropdown,
                this.sheet_dropdown,
                this.threshold,
                this.index_type,
                this.export_result_button,
                this.match_name_button,
            ],
        };

        this.content = {
            id: 'content',
            component: DynamicWrapper,
            template: 'tpl_dynamic_wrapper',
            active_component: 'upload_button',
            set_active_event: this.events.get('state'),
            components: [this.matches_table, this.upload_button],
        };

        this.content_wrapper = {
            id: 'content_wrapper',
            component: Aside,
            template: 'tpl_aside_main_content',
            layout: {
                body: ['meta_data', 'content'],
            },
            components: [this.meta_data, this.content],
        };

        this.page_wrapper = this.new_instance(Aside, {
            id: 'page_wrapper',
            template: 'tpl_aside_body',
            layout: {
                body: ['cpanel', 'content_wrapper'],
            },
            components: [this.cpanel, this.content_wrapper],
        });

        this.export_csv = () => {
            this._csv_export({
                data: {
                    key: this.key(),
                },
                success: DataThing.api.XHRSuccess(key => {
                    DataThing.form_post(config.download_file_base + key);
                }),
                error: DataThing.api.XHRError(() => {}),
            });
        };

        this.when(this.page_wrapper).done(() => {
            // Handle option selections
            Observer.register(this.events.get('selectIndex'), this.handleOptionChanged('index'));
            Observer.register(this.events.get('selectSheet'), this.handleOptionChanged('sheet'));
            Observer.register(
                this.events.get('selectThreshold'),
                this.handleOptionChanged('threshold'),
            );
            Observer.register(this.events.get('selectColumn'), this.handleOptionChanged('column'));

            Observer.register_for_id(
                Utils.gen_id(this.get_id(), 'page_wrapper', 'cpanel', 'match_name_button'),
                'EventButton',
                () => {
                    this.matching_names(true);
                    this.match_names_endpoint({
                        data: {
                            settings: {
                                threshold: this.match_options.threshold,
                                index: this.match_options.index,
                                worksheet: this.match_options.sheet || 0,
                                column: this.match_options.column || 0,
                            },
                            key: this.key(),
                        },
                        success: DataThing.api.XHRSuccess(data => {
                            if ((data['results'] || []).length) {
                                this.matches(data['results']);
                            }
                            if (data['meta']) {
                                this.meta(data['meta']);
                            }

                            this.matching_names(false);
                        }),
                        error: DataThing.api.XHRError(() => {}),
                    });
                },
            );
            this.matches.subscribe(data => {
                this.enable_export(!data.length);
            });

            Observer.register_for_id(
                Utils.gen_id(this.get_id(), 'page_wrapper', 'cpanel', 'export_result_button'),
                'EventButton',
                this.export_csv,
            );

            this._name_match_index({
                data: {},
                success: DataThing.api.XHRSuccess(data => {
                    if (data) {
                        for (let i = 0, j = data.length; i < j; i++) {
                            data[i].label = data[i].label
                                .split('_')
                                .reduce((a, b) => `${a.capitalize()} ${b.capitalize()}`);
                        }
                    }
                    this.indexes(data);
                }),
                error: DataThing.api.XHRError(() => {}),
            });

            Observer.register(this.events.get('uploadSuccess'), success => {
                this.workbook(success.workbooks);
                this.key(success.key);
                // Route to table view
                Observer.broadcast(this.events.get('state'), 'matches_table');
            });

            Observer.register(this.events.get('endSession'), () => {
                let key = this.key() || '';
                this._end_session({
                    data: {
                        key: key,
                    },
                    success: DataThing.api.XHRSuccess(() => {
                        // Key and workbook no longer valid, show upload button
                        this.key(undefined);
                        this.workbook({});
                        this.meta({});
                        this.matches({});
                        Observer.broadcast(this.events.get('state'), 'upload_button');
                    }),
                    error: DataThing.api.XHRError(() => {}),
                });
            });

            this.dfd.resolve();
        });
    }

    handleOptionChanged = key => val => {
        this.match_options[key] = Utils.get(val);
    };
}

export default NameMatch;
