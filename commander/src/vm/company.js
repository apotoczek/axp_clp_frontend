import ko from 'knockout';
import pager from 'pager';

import {match_array, is_set} from 'src/libs/Utils';
import DataSource from 'src/libs/DataSource';
import DataThing from 'src/libs/DataThing';
import RegExps from 'src/libs/RegExps';
import Context from 'src/libs/Context';
import Observer from 'src/libs/Observer';
import CompanyPage from 'components/data-admin/CompanyPage';

import 'src/libs/bindings/react';

export default class CompanyVM extends Context {
    constructor() {
        super({id: 'company'});

        this.dfd = this.new_deferred();

        this.on_change_company = company_uid => {
            this.datasources.company.update_query({company_uid});
            this.datasources.cashflows.update_query({company_uid});
        };

        this.handle_delete_company = uid => {
            if (!is_set(uid, true)) {
                return;
            }

            this.endpoints.delete_company({
                data: {uid},
                success: DataThing.api.XHRSuccess(() => {
                    pager.navigate('#!/companies');
                }),
            });
        };

        this.handle_delete_cashflows = uids => {
            if (!is_set(uids, true)) {
                return;
            }

            this.endpoints.delete_cashflows({
                data: {uids},
                success: DataThing.api.XHRSuccess(() => {
                    DataThing.status_check();
                }),
            });
        };

        this.endpoints = {
            delete_company: DataThing.backends.commander({url: 'delete_companies'}),
            delete_cashflows: DataThing.backends.commander({url: 'delete_market_data_cashflows'}),
        };

        this.datasources = {
            company: this.new_instance(DataSource, {
                datasource: {
                    type: 'dynamic',
                    query: {
                        target: 'commander:company',
                        company_uid: {
                            type: 'placeholder',
                            required: true,
                        },
                    },
                },
            }),
            cashflows: this.new_instance(DataSource, {
                datasource: {
                    type: 'dynamic',
                    query: {
                        target: 'commander:market_data_cashflows',
                        company_uid: {
                            type: 'placeholder',
                            required: true,
                        },
                    },
                },
            }),
        };

        this.isLoading = key =>
            this.datasources[key].loading() ||
            (this.datasources[key].data() === undefined &&
                this.datasources[key].error() === undefined);

        this.handle_cashflow_table_page_change = page => {
            this.datasources.companies.update_query({page});
        };

        this.mainComponent = CompanyPage;
        this.props = ko.pureComputed(() => {
            return {
                company: this.datasources.company.data(),
                isCompanyLoading: this.isLoading('company'),
                onDeleteCompany: this.handle_delete_company,

                cashflows: this.datasources.cashflows.data() || {},
                isCashflowsLoading: this.isLoading('cashflows'),
                onCashflowListPageChange: this.handle_cashflow_table_page_change,
                onDeleteCashflows: this.handle_delete_cashflows,
            };
        });

        this.when(this.datasources).done(() => {
            // Listen for url changes to find the uid of the current company
            Observer.register_hash_listener('company', url =>
                match_array(url, ['company', RegExps.uuid, this.on_change_company]),
            );

            this.on_enter('company', () => {
                this.datasources.company.resume();
                this.datasources.cashflows.resume();
            });

            this.on_leave('company', () => {
                this.datasources.company.stop();
                this.datasources.cashflows.stop();
            });

            this.dfd.resolve();
        });
    }
}
