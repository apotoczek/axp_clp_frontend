import ko from 'knockout';

import DataSource from 'src/libs/DataSource';
import DataThing from 'src/libs/DataThing';
import Context from 'src/libs/Context';
import {is_set, object_from_array} from 'src/libs/Utils';
import config from 'src/config';

import DealsList from 'components/data-admin/DealsList';

import 'src/libs/bindings/react';

export default class DealsVM extends Context {
    constructor() {
        super({id: 'deals'});

        this.dfd = this.new_deferred();

        this.endpoints = {
            delete_deals: DataThing.backends.commander({url: 'delete_deals'}),
            upload_step: DataThing.backends.commander({url: 'upload_market_data/next'}),
            remove_sheet: DataThing.backends.commander({url: 'upload_market_data/remove'}),
        };

        this.datasources = {
            deals: this.new_instance(DataSource, {
                datasource: {
                    type: 'dynamic',
                    query: {
                        target: 'commander:deals',
                        results_per_page: 30,
                        include_attributes: true,
                    },
                },
            }),
        };

        this.sheets = ko.observable({});
        this.is_uploading = ko.observable(false);
        this.upload_error = ko.observable(null);

        this.handle_delete_deals = uids => {
            if (!is_set(uids, true)) {
                return;
            }

            this.endpoints.delete_deals({
                data: {uids},
                success: DataThing.api.XHRSuccess(() => {
                    DataThing.status_check();
                }),
            });
        };

        this.handle_page_change = page => {
            this.datasources.deals.update_query({page});
        };

        this.handle_filter_change = filters => {
            this.datasources.deals.update_query({
                filters: {
                    company_name: filters.companyName,
                    fund_name: filters.fundName,
                },
            });
        };

        this.handle_download_cashflows = () => {
            DataThing.get({
                params: {
                    target: 'csv_download_key',
                    columns: [
                        {key: 'uid', label: 'uid'},
                        {key: 'fund_name', label: 'Fund'},
                        {key: 'company_name', label: 'Company'},
                        {key: 'date', label: 'Date', format: 'backend_date'},
                        {key: 'amount', label: 'Amount'},
                        {key: 'type', label: 'Type'},
                        {key: 'note', label: 'Note'},
                    ],
                    query: {
                        target: 'commander:market_data_cashflows',
                        gross_only: true,
                    },
                },
                success: key => {
                    DataThing.form_post(config.download_csv_base + key);
                },
                force: true,
            });
        };

        // TODO(Simon): Add attributes to the csv download here
        this.handle_download_deals = () => {
            DataThing.get({
                params: {
                    target: 'csv_download_key',
                    columns: [
                        {key: 'uid', label: 'uid'},
                        {key: 'fund:name', label: 'Fund'},
                        {key: 'company:name', label: 'Company'},
                        {key: 'deal_team_leader', label: 'Deal Team Leader'},
                        {key: 'deal_team_second', label: 'Deal Team Second'},
                        {key: 'default_currency', label: 'Default Currency'},
                        {key: 'country', label: 'Country'},
                        {key: 'exit_date', label: 'Exit Date'},
                        {key: 'acquisition_date', label: 'Acquisition Date'},
                        {key: 'investment_amount', label: 'Investment Amount'},
                    ],
                    query: {
                        target: 'commander:deals',
                    },
                },
                success: key => {
                    DataThing.form_post(config.download_csv_base + key);
                },
                force: true,
            });
        };

        this.handle_reset_upload_error = () => this.upload_error(null);

        this.handle_upload_sheet = success => response => {
            if (!success || (is_set(response.success) && !response.success)) {
                this.upload_error({
                    message: response.message || 'Error during upload.',
                    description: response.description || 'Something went wrong. Please try again.',
                });

                return;
            }

            const oldSheets = this.sheets();
            const newSheets = object_from_array(response, item => [item.identifier, item]);
            this.sheets({...oldSheets, ...newSheets});
        };

        this.upload_step = (sheetId, data) => {
            return new Promise((resolve, reject) => {
                this.endpoints.upload_step({
                    data: {
                        identifier: sheetId,
                        ...data,
                    },
                    success: DataThing.api.XHRSuccess(response => {
                        if (!response || !response.success) {
                            reject(response);
                        }

                        resolve(response);
                    }),
                    error: DataThing.api.XHRError(response => {
                        reject(response);
                    }),
                });
            });
        };

        this.perform_upload_step = sheet_id => {
            this.is_uploading(true);
            const sheets = this.sheets();
            this.upload_step(sheet_id)
                .then(response => {
                    sheets[sheet_id] = response;
                    this.sheets(sheets);
                })
                .catch(response => {
                    sheets[sheet_id] = response;
                    this.sheets(sheets);
                })
                .finally(() => {
                    this.is_uploading(false);
                });
        };

        this.handle_select_sheet_type = sheet_id => spreadsheet_type => {
            // Perform next step on backend, selecting the type of the spreadsheet.
            this.upload_step(sheet_id, {select_type: spreadsheet_type}).then(response => {
                // We get a new state back, update the state to reflect our new current state.
                const sheets = this.sheets();
                sheets[sheet_id] = response;
                this.sheets(sheets);
            });
        };

        this.handle_remove_sheet = sheet_id => {
            this.endpoints.remove_sheet({
                data: {identifier: sheet_id},
                success: DataThing.api.XHRSuccess(() => {
                    const sheets = this.sheets();
                    delete sheets[sheet_id];
                    this.sheets(sheets);
                }),
            });
        };

        this.handle_remove_all_sheets = () => {
            const sheet_ids = Object.keys(this.sheets());
            this.endpoints.remove_sheet({
                data: {identifiers: sheet_ids},
                success: DataThing.api.XHRSuccess(() => {
                    const sheets = this.sheets();
                    for (const sheet_id of sheet_ids) {
                        delete sheets[sheet_id];
                    }
                    this.sheets(sheets);
                }),
            });
        };

        this.mainComponent = DealsList;
        this.props = ko.pureComputed(() => {
            return {
                deals: this.datasources.deals.data() || {},
                sheets: this.sheets(),
                uploadError: this.upload_error(),
                onResetUploadError: this.handle_reset_upload_error,
                onUploadSheet: this.handle_upload_sheet,
                onRemoveSheet: this.handle_remove_sheet,
                onRemoveAllSheets: this.handle_remove_all_sheets,
                onUploadStep: this.perform_upload_step,
                onSelectSheetType: this.handle_select_sheet_type,
                onDealListPageChange: this.handle_page_change,
                onDeleteDeals: this.handle_delete_deals,
                onFilterChange: this.handle_filter_change,
                isDealsLoading: this.datasources.deals.loading(),
                isUploading: this.is_uploading(),
                onDownloadCashflows: this.handle_download_cashflows,
                onDownloadDeals: this.handle_download_deals,
            };
        });

        this.dfd.resolve();
    }
}
