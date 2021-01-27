import ko from 'knockout';
import pager from 'pager';
import Context from 'src/libs/Context';
import SheetSelector from 'components/SheetSelector';
import SheetSelectorCpanel from 'components/SheetSelectorCpanel';
import DataThing from 'src/libs/DataThing';
import {columnString} from 'components/excel/Sheet';
import Observer from 'src/libs/Observer';
import * as Formatters from 'src/libs/Formatters';
import * as Utils from 'src/libs/Utils';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import DataTable from 'src/libs/components/basic/DataTable';
import BaseModal from 'src/libs/components/basic/BaseModal';
import UploadedMetrics from 'src/libs/components/reporting/UploadedMetrics';
import ActionButton from 'src/libs/components/basic/ActionButton';
import {UploadStatus} from 'components/reporting/shared';
import EventRegistry from 'src/libs/components/basic/EventRegistry';
import MetaDataTable, {convertReportingMeta} from 'components/reporting/MetaDataTable';

import 'src/libs/bindings/react';

class PreviewMetricsModal extends BaseModal {
    constructor(opts, components) {
        super(opts, components);

        this.doneCallback = opts.doneCallback;

        let _dfd = this.new_deferred();

        this.mapping = ko.observable();

        this.MetaDataTable = MetaDataTable;

        this.define_template(`
            <div class="modal fade" tabindex="-1" role="dialog" aria-hidden="true">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <button type="button" class="close" data-bind="click: cancel" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                            <h4 class="modal-title">Preview</h4>
                        </div>
                        <div class="modal-body">
                            {{#if error}}
                                <p class="text-danger">
                                    {{{ error }}}.
                                </p>
                                <p>
                                    Please edit the selection and try again.
                                </p>
                            {{/if}}
                            {{#ifnot error}}
                                {{#renderComponent uploaded/}}
                                <div
                                    class="data-collection-modal-section"
                                    data-bind="
                                        renderReactComponent: MetaDataTable,
                                        props: metaDataTableProps,
                                    "
                                ></div>
                            {{/ifnot}}
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-success" style="margin-right: 10px;" data-bind="click: done, disable: error">Approve & Process</button>
                            <button type="button" data-bind="click: cancel" class="btn btn-default">Cancel</button>
                        </div>
                    </div>
                </div>
            </div>
        `);

        this.error = ko.pureComputed(() => {
            const data = this.data();

            if (data) {
                if (!data.as_of) {
                    return 'Unable to extract date from cell selected as &quot;As of date&quot;';
                }

                if (!Utils.is_set(data.metrics, true) && !Utils.is_set(data.meta_data, true)) {
                    return 'Unable to extract any metrics or meta data from the selected cells';
                }
            }
        });

        this.metaDataTableProps = ko.pureComputed(() => {
            return {
                metaData: convertReportingMeta(this.data()),
            };
        });

        this.uploaded = this.new_instance(UploadedMetrics, {
            enable_selection: false,
            data: this.data,
        });

        _dfd.resolve();
    }

    cancel() {
        this.reset();
    }

    done() {
        this.doneCallback(this.mapping());
        this.reset();
    }

    open(data, mapping) {
        this.data(data);
        this.mapping(mapping);

        this.show();
    }
}

class Spreadsheet extends BaseComponent {
    constructor(opts, components) {
        super(opts, components);

        this.define_template(`
            <div class="aside aside-control-panel">
                <div class="vbox">
                    <div style="height: 100%; width: 100%;" data-bind="
                        renderReactComponent: SheetSelectorCpanel,
                        dark: true,
                        props: cpanelProps
                    "></div>
                </div>
            </div>

            <div class="aside aside-content" style="padding: 0;">
                <div style="height: 100%; width: 100%;">
                    <div style="height: 100%;" data-bind="
                        renderReactComponent: SheetSelector,
                        dark: true,
                        props: props
                    "></div>
                </div>
            </div>
        `);

        this.endpoints = {
            create_metric: DataThing.backends.commander({
                url: 'create_metric_for_client',
            }),
            process_uploaded_spreadsheet: DataThing.backends.commander({
                url: 'process_uploaded_spreadsheet',
            }),
            preview_spreadsheet_mapping: DataThing.backends.commander({
                url: 'preview_spreadsheet_mapping',
            }),
        };

        const _dfd = this.new_deferred();

        this.previewMetricModal = this.new_instance(PreviewMetricsModal, {
            doneCallback: this.done.bind(this),
        });

        this.SheetSelector = SheetSelector;
        this.SheetSelectorCpanel = SheetSelectorCpanel;

        this.timeFrames = {
            1: 'Monthly',
            2: 'Quarterly',
            3: 'TTM',
        };

        this.metrics = ko.observable({});
        this.formats = ko.observable({});
        this.clientUid = ko.observable();
        this.spreadsheetUid = ko.observable();
        this.spreadsheetData = ko.observable();

        this.capturedMetrics = ko.observableArray([]);
        this.capturedMetas = ko.observableArray([]);
        this.capturedDates = ko.observableArray([]);
        this.capturedGroups = ko.observableArray([]);
        this.capturedFields = ko.observableArray([]);

        this.asOfDates = ko.pureComputed(() => {
            const asOfDates = {};
            for (const d of this.capturedDates()) {
                asOfDates[d.id] = d.textValue;
            }
            return asOfDates;
        });

        this.groups = ko.pureComputed(() => {
            const groups = {};
            for (const d of this.capturedGroups()) {
                groups[d.id] = d;
            }
            return groups;
        });

        this.fields = ko.pureComputed(() => {
            const fields = {};
            for (const d of this.capturedFields()) {
                fields[d.id] = d;
            }
            return fields;
        });

        this.cpanelProps = ko.pureComputed(() => {
            return {
                onCreateMetric: this.createMetric.bind(this),
                capturedMetrics: this.capturedMetrics(),
                onClickCaptured: this.handleClickCaptured.bind(this),
            };
        });

        this.props = ko.pureComputed(() => {
            return {
                ref: ref => (this.selectorInstance = ref),
                ...this.spreadsheetData(),
                asOfDates: this.asOfDates(),
                metrics: this.metrics(),
                timeFrames: this.timeFrames,
                groups: this.groups(),
                fields: this.fields(),
                onSettingsChanged: this.settingsChanged.bind(this),
                onClickPreview: this.preview.bind(this),
                onClickCancel: this.cancel.bind(this),
                isLoading: this.loading(),
            };
        });

        _dfd.resolve();
    }

    reset() {
        this.capturedMetrics([]);
        this.clientUid(undefined);
        this.spreadsheetUid(undefined);
        this.loading(false);
    }

    cancel() {
        pager.navigate('#!/data-collection');
        this.reset();
    }

    done(mapping) {
        this.loading(true);

        this.endpoints.process_uploaded_spreadsheet({
            data: {
                uid: this.spreadsheetUid(),
                mapping: mapping,
            },
            success: DataThing.api.XHRSuccess(() => {
                DataThing.status_check();
                pager.navigate('#!/data-collection');
                this.reset();
            }),
        });
    }

    preview() {
        const mapping = {
            meta_data: this.capturedMetas().map(item => ({
                sheet: item.sheetIdx,
                date_id: item.dateId,
                label: item.label,
                fields: item.fields,
            })),
            metrics: this.capturedMetrics().map(item => ({
                sheet: item.sheetIdx,
                row: item.row,
                column: item.column,
                metric: item.metric,
                metric_name: item.metricName,
                time_frame: item.timeFrame,
                time_frame_label: item.timeFrameName,
                version_name: 'Actual',
                format: item.format,
                date_id: item.dateId,
            })),
            dates: this.capturedDates().map(item => ({
                id: item.id,
                sheet: item.sheetIdx,
                row: item.row,
                column: item.column,
            })),
        };

        this.endpoints.preview_spreadsheet_mapping({
            data: {
                uid: this.spreadsheetUid(),
                mapping: mapping,
            },
            success: DataThing.api.XHRSuccess(data => {
                this.previewMetricModal.open(data, mapping);
            }),
        });
    }

    fetchData(uid) {
        this.loading(true);
        DataThing.get({
            params: {
                target: 'commander:spreadsheet_details',
                uid: uid,
            },
            success: ({uid, data, client_uid, file_name}) => {
                this.fetchMetrics(client_uid);
                this.spreadsheetData({
                    ...data,
                    sheetName: file_name,
                });
                this.spreadsheetUid(uid);
                this.clientUid(client_uid);
            },
        });
    }

    fetchMetrics(clientUid, force = false) {
        DataThing.get({
            params: {
                target: 'commander:all_metrics_for_client',
                client_uid: clientUid,
            },
            success: user_metrics => {
                const metrics = {};
                const formats = {};

                for (const metric of user_metrics) {
                    metrics[metric.uid] = metric.name;
                    formats[metric.uid] = metric.format;
                }

                this.metrics(metrics);
                this.formats(formats);
                this.loading(false);
            },
            force,
        });
    }

    handleClickCaptured(metric) {
        this.selectorInstance.selectCell(metric.row, metric.column);
    }

    createMetric({name, format, pointInTime: point_in_time}) {
        this.endpoints.create_metric({
            data: {name, format, point_in_time, client_uid: this.clientUid()},
            success: DataThing.api.XHRSuccess(() => {
                this.fetchMetrics(this.clientUid(), true);
            }),
            error: DataThing.api.XHRError(() => {}),
        });
    }

    settingsChanged(sheetSettings) {
        const metrics = this.metrics();
        const groups = this.groups();
        const fields = this.fields();
        const formats = this.formats();
        const data = this.spreadsheetData();
        const asOfDates = this.asOfDates();

        const capturedMetrics = [];
        const capturedDates = [];
        const capturedGroups = [];
        const capturedFields = [];

        const metas = {};

        for (const [sheetKey, settings] of Object.entries(sheetSettings)) {
            const sheetIdx = parseInt(sheetKey);
            const sheetName = data.sheets[sheetIdx];
            const sheetData = data.sheetData[sheetIdx];

            for (const [cellKey, cellSettings] of Object.entries(settings)) {
                const [rowStr, columnStr] = cellKey.split('.');

                const row = parseInt(rowStr);
                const column = parseInt(columnStr);

                const rowData = sheetData[row] || [];
                const content = rowData[column] || {};

                const cellTitle = `${columnString(column + 1)}${row + 1}`;

                switch (cellSettings.type) {
                    case 'as_of':
                        capturedDates.push({
                            sheetIdx,
                            sheetName,
                            cellTitle,
                            row,
                            column,
                            value: content.rawValue || content.value,
                            textValue: content.value,
                            id: `${sheetIdx}-${cellTitle}`,
                        });
                        break;
                    case 'meta_group':
                        capturedGroups.push({
                            sheetIdx,
                            row,
                            column,
                            value: content.rawValue || content.value,
                            label: content.value,
                            id: `${sheetIdx}-${cellTitle}`,
                        });
                        break;
                    case 'meta_field':
                        capturedFields.push({
                            sheetIdx,
                            row,
                            column,
                            value: content.rawValue || content.value,
                            label: content.value,
                            id: `${sheetIdx}-${cellTitle}`,
                        });
                        break;
                    case 'meta_value': {
                        {
                            const {group: groupId, field: fieldId, asOfDate} = cellSettings;
                            if (groupId && fieldId && asOfDate) {
                                const group = groups[groupId];

                                const key = `${group.label}-${asOfDate}`;

                                if (!metas[key]) {
                                    metas[key] = {
                                        label: [group.sheetIdx, group.row, group.column],
                                        dateId: asOfDate,
                                        fields: [],
                                    };
                                }

                                const field = fields[fieldId];

                                metas[key].fields.push({
                                    label: [field.sheetIdx, field.row, field.column],
                                    value: [sheetIdx, row, column],
                                });
                            }
                        }
                        break;
                    }
                    case 'metric':
                        {
                            const metricName = metrics[cellSettings.metric];
                            const timeFrameName = this.timeFrames[cellSettings.timeFrame];
                            const asOfDateStr = asOfDates[cellSettings.asOfDate];

                            const format = formats[cellSettings.metric];

                            capturedMetrics.push({
                                sheetIdx,
                                sheetName,
                                cellTitle,
                                metricName,
                                timeFrameName,
                                row,
                                column,
                                value: content.rawValue || content.value,
                                format,
                                metric: cellSettings.metric,
                                timeFrame: cellSettings.timeFrame,
                                dateId: cellSettings.asOfDate,
                                asOfDate: asOfDateStr,
                            });
                        }
                        break;
                }
            }
        }

        const capturedMetas = Object.values(metas);

        this.capturedMetrics(capturedMetrics);
        this.capturedMetas(capturedMetas);
        this.capturedDates(capturedDates);
        this.capturedGroups(capturedGroups);
        this.capturedFields(capturedFields);
    }
}

class SpreadsheetList extends BaseComponent {
    constructor(opts, components) {
        super(opts, components);

        this.events = this.new_instance(EventRegistry, {});

        this.events.resolve_and_add('forget_mapping', 'ActionButton.action.forget_mapping');

        this.endpoints = {
            forget_processed_spreadsheet: DataThing.backends.commander({
                url: 'forget_processed_spreadsheet',
            }),
        };

        this.define_template(`
            <div class="aside aside-control-panel">
                <div class="vbox">
                </div>
            </div>

            <div class="aside aside-content">
                <!-- ko renderComponent: table --><!-- /ko -->
            </div>
        `);

        Observer.register(this.events.get('forget_mapping'), data => {
            this.endpoints.forget_processed_spreadsheet({
                data: {
                    uid: data.uid,
                },
                success: DataThing.api.XHRSuccess(() => {
                    DataThing.status_check();
                }),
                error: DataThing.api.XHRError(() => {}),
            });
        });

        this.table = this.new_instance(DataTable, {
            id: 'table',
            css: {'table-light': true, 'table-sm': true},
            results_per_page: 50,
            columns: [
                {
                    label: 'File name',
                    sort_key: 'file_name',
                    format: 'contextual_link_with_exclude',
                    format_args: {
                        url: 'data-collection/<uid>',
                        label_key: 'file_name',
                        exclude: obj => obj.status !== 1,
                    },
                },
                {
                    key: 'client_name',
                    label: 'Client Name',
                },
                {
                    key: 'status_label',
                    label: 'Status',
                    formatter: Formatters.gen_status_formatter(
                        {
                            PROCESSING: '#FFA500',
                            PROCESSED: '#39BEE5',
                            APPROVED: '#3AC376',
                        },
                        '#FEFEFE',
                    ),
                },
                {
                    key: 'created',
                    format: 'backend_date',
                    label: 'Uploaded',
                    type: 'numeric',
                },
                {
                    key: 'fingerprint',
                    format: fingerprint => {
                        if (fingerprint) {
                            const short = fingerprint.substring(0, 8);

                            return `<span style="font-family: monospace;">${short}</span>`;
                        }

                        return '<span class="text-muted">N/A</span>';
                    },
                    label: 'Fingerprint',
                    type: 'numeric',
                },
                {
                    sort_key: 'forgotten',
                    format: data => {
                        if (data.status != UploadStatus.Approved) {
                            return '<span class="text-muted">N/A</span>';
                        }

                        return data.forgotten
                            ? '<span class="text-warning">No</span>'
                            : '<span class="text-success">Yes</span>';
                    },
                    label: 'Remember',
                },
                {
                    component_callback: 'data',
                    always_visible: true,
                    disable_sorting: true,
                    type: 'component',
                    width: '120px',
                    component: {
                        id: 'forget_mapping',
                        action: 'forget_mapping',
                        component: ActionButton,
                        hidden_callback: data => {
                            return data && (data.status != UploadStatus.Approved || data.forgotten);
                        },
                        id_callback: this.events.register_alias('forget_mapping'),
                        css: {
                            'btn-default': true,
                            'btn-xs': true,
                        },
                        label: 'Forget Mapping',
                    },
                },
            ],
            inline_data: true,
            datasource: {
                type: 'dynamic',
                query: {
                    target: 'commander:uploaded_spreadsheets',
                },
            },
        });
    }
}

class DataCollectionVM extends Context {
    constructor() {
        super();

        this.dfd = this.new_deferred();

        this.spreadsheetList = this.new_instance(SpreadsheetList, {});

        this.spreadsheet = this.new_instance(Spreadsheet, {});

        this.active = ko.observable(this.spreadsheetList);

        Observer.register_hash_listener('data-collection', url => {
            if (url.length === 1) {
                this.active(this.spreadsheetList);
            } else {
                this.spreadsheet.fetchData(url[1]);
                this.active(this.spreadsheet);
            }
        });

        this.when(this.spreadsheetList, this.spreadsheet).done(() => {
            this.dfd.resolve();
        });
    }
}

export default DataCollectionVM;
