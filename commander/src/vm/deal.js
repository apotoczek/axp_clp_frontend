import ko from 'knockout';
import pager from 'pager';

import {match_array, is_set} from 'src/libs/Utils';
import DataSource from 'src/libs/DataSource';
import DataThing from 'src/libs/DataThing';
import RegExps from 'src/libs/RegExps';
import Context from 'src/libs/Context';
import Observer from 'src/libs/Observer';
import DealPage from 'components/data-admin/DealPage';

import 'src/libs/bindings/react';

export default class DealVM extends Context {
    constructor() {
        super({id: 'deal'});

        this.dfd = this.new_deferred();

        this.on_change_deal = deal_uid => {
            this.datasources.deal.update_query({uid: deal_uid});
            this.datasources.cashflows.update_query({deal_uid});
        };

        this.handle_delete_deal = uid => {
            if (!is_set(uid, true)) {
                return;
            }

            this.endpoints.delete_deal({
                data: {uid},
                success: DataThing.api.XHRSuccess(() => {
                    pager.navigate('#!/deals');
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
            delete_deal: DataThing.backends.commander({url: 'delete_deals'}),
            delete_cashflows: DataThing.backends.commander({url: 'delete_market_data_cashflows'}),
        };

        this.datasources = {
            deal: this.new_instance(DataSource, {
                datasource: {
                    type: 'dynamic',
                    query: {
                        target: 'commander:deal',
                        uid: {
                            type: 'placeholder',
                            required: true,
                        },
                        include_attributes: true,
                    },
                },
            }),
            cashflows: this.new_instance(DataSource, {
                datasource: {
                    type: 'dynamic',
                    query: {
                        target: 'commander:market_data_cashflows',
                        deal_uid: {
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
            this.datasources.deals.update_query({page});
        };

        this.mainComponent = DealPage;
        this.props = ko.pureComputed(() => {
            return {
                deal: this.datasources.deal.data(),
                isDealLoading: this.isLoading('deal'),
                onDeleteDeal: this.handle_delete_deal,

                cashflows: this.datasources.cashflows.data() || {},
                isCashflowsLoading: this.isLoading('cashflows'),
                onCashflowListPageChange: this.handle_cashflow_table_page_change,
                onDeleteCashflows: this.handle_delete_cashflows,
            };
        });

        this.when(this.datasources).done(() => {
            // Listen for url changes to find the uid of the current deal
            Observer.register_hash_listener('deal', url =>
                match_array(url, ['deal', RegExps.uuid, this.on_change_deal]),
            );

            this.on_enter('deal', () => {
                this.datasources.deal.resume();
                this.datasources.cashflows.resume();
            });

            this.on_leave('deal', () => {
                this.datasources.deal.stop();
                this.datasources.cashflows.stop();
            });

            this.dfd.resolve();
        });
    }
}
