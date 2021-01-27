import ko from 'knockout';

import DataSource from 'src/libs/DataSource';
import DataThing from 'src/libs/DataThing';
import Context from 'src/libs/Context';
import {is_set} from 'src/libs/Utils';
import config from 'src/config';

import CompaniesList from 'components/data-admin/CompaniesList';

import 'src/libs/bindings/react';

export default class CompaniesVM extends Context {
    constructor() {
        super({id: 'companies'});

        this.dfd = this.new_deferred();

        this.endpoints = {
            delete_companies: DataThing.backends.commander({url: 'delete_companies'}),
        };

        this.datasources = {
            companies: this.new_instance(DataSource, {
                datasource: {
                    type: 'dynamic',
                    query: {
                        target: 'commander:companies',
                        results_per_page: 30,
                    },
                },
            }),
        };

        this.handle_delete_companies = uids => {
            if (!is_set(uids, true)) {
                return;
            }

            this.endpoints.delete_companies({
                data: {uids},
                success: DataThing.api.XHRSuccess(() => {
                    DataThing.status_check();
                }),
            });
        };

        this.handle_page_change = page => {
            this.datasources.companies.update_query({page});
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
                    },
                },
                success: key => {
                    DataThing.form_post(config.download_csv_base + key);
                },
                force: true,
            });
        };

        this.mainComponent = CompaniesList;
        this.props = ko.pureComputed(() => {
            const companies = this.datasources.companies.data() || {};
            return {
                companies,
                onCompanyListPageChange: this.handle_page_change,
                onDeleteCompanies: this.handle_delete_companies,
                isCompaniesLoading: this.datasources.companies.loading(),
                onDownloadCashflows: this.handle_download_cashflows,
            };
        });

        this.dfd.resolve();
    }
}
