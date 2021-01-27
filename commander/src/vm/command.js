import Context from 'src/libs/Context';
import Aside from 'src/libs/components/basic/Aside';
import Observer from 'src/libs/Observer';
import DynamicWrapper from 'src/libs/components/basic/DynamicWrapper';
import DataThing from 'src/libs/DataThing';
import EventButton from 'src/libs/components/basic/EventButton';
import EventRegistry from 'src/libs/components/basic/EventRegistry';
import config from 'config';
import uuid from 'uuid/v4';

import 'src/libs/bindings/react';

export default class Command extends Context {
    constructor() {
        super({id: 'command'});
        this.dfd = this.new_deferred();

        const events = this.new_instance(EventRegistry, {});
        events.resolve_and_add('setup_proddata_indexes', 'EventButton');
        events.resolve_and_add('sync_hl_fund_benchmark_data', 'EventButton');
        events.resolve_and_add('sync_hl_deal_benchmark_data', 'EventButton');
        events.resolve_and_add('export_derivative_funds', 'EventButton');

        const body = {
            id: 'body',
            component: Aside,
            template: 'tpl_aside_body',
            layout: {
                body: [
                    'setup_proddata_indexes',
                    'sync_hl_fund_benchmark_data',
                    'sync_hl_deal_benchmark_data',
                    'export_derivative_funds',
                ],
            },
            components: [
                {
                    id: 'setup_proddata_indexes',
                    component: EventButton,
                    label: 'Setup Proddata Indexes',
                    id_callback: events.register_alias('setup_proddata_indexes'),
                    css: {
                        'btn-sm': true,
                        'btn-default': true,
                        'btn-success': true,
                        'spacing-vertical': true,
                        'spacing-horizontal': true,
                    },
                },
                {
                    id: 'sync_hl_fund_benchmark_data',
                    component: EventButton,
                    label:
                        'Sync HL Fund Benchmark Data <span class="glyphicon glyphicon-refresh"></span>',
                    id_callback: events.register_alias('sync_hl_fund_benchmark_data'),
                    css: {
                        'btn-sm': true,
                        'btn-default': true,
                        'btn-success': true,
                        'spacing-vertical': true,
                        'spacing-horizontal': true,
                    },
                },
                {
                    id: 'sync_hl_deal_benchmark_data',
                    component: EventButton,
                    label:
                        'Sync HL Deal Benchmark Data <span class="glyphicon glyphicon-refresh"></span>',
                    id_callback: events.register_alias('sync_hl_deal_benchmark_data'),
                    css: {
                        'btn-sm': true,
                        'btn-default': true,
                        'btn-success': true,
                        'spacing-vertical': true,
                        'spacing-horizontal': true,
                    },
                },
                {
                    id: 'export_derivative_funds',
                    component: EventButton,
                    label:
                        'Download Derivative Funds <span class="glyphicon glyphicon-download"></span>',
                    id_callback: events.register_alias('export_derivative_funds'),
                    css: {
                        'btn-sm': true,
                        'btn-default': true,
                        'btn-success': true,
                        'spacing-vertical': true,
                        'spacing-horizontal': true,
                    },
                },
            ],
        };

        /////////////////////////////ENDPOINTS//////////////////////////////////
        let _setup_indexes = DataThing.backends.commander({
            url: 'setup_indexes',
        });

        let _sync_hl_benchmark_data = DataThing.backends.commander({
            url: 'sync_hl_benchmark_data',
        });

        ////////////////////////////////////////////////////////////////////////

        this.setup_indexes = () => {
            _setup_indexes({
                success: DataThing.api.XHRSuccess(() => {
                    DataThing.status_check();
                }),
            });
        };

        this.sync_hl_benchmark_data = for_deals => {
            _sync_hl_benchmark_data({
                data: {
                    for_deals,
                },
                success: DataThing.api.XHRSuccess(() => {
                    DataThing.status_check();
                }),
                error: DataThing.api.XHRError(e => {
                    alert(e);
                }),
            });
        };

        this.export_derivative_funds = () => {
            DataThing.get({
                params: {
                    target: 'export_derivative_funds',
                    hash: uuid(),
                },
                success: key => {
                    DataThing.form_post(config.download_file_base + key);
                },
                error: () => {
                    alert('Export failed');
                },
            });
        };

        this.page_wrapper = this.new_instance(DynamicWrapper, {
            id: 'page_wrapper',
            template: 'tpl_dynamic_wrapper',
            active_component: 'body',
            components: [body],
        });

        Observer.register(events.get('setup_proddata_indexes'), () => {
            this.setup_indexes();
        });

        Observer.register(events.get('sync_hl_fund_benchmark_data'), () => {
            this.sync_hl_benchmark_data(false);
        });

        Observer.register(events.get('sync_hl_deal_benchmark_data'), () => {
            this.sync_hl_benchmark_data(true);
        });

        Observer.register(events.get('export_derivative_funds'), () => {
            this.export_derivative_funds();
        });

        this.when(this.page_wrapper).done(() => {
            this.dfd.resolve();
        });
    }
}
