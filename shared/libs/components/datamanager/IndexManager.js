/* Automatically transformed from AMD to ES6. Beware of code smell. */
import IndexCharacteristics from 'src/libs/components/datamanager/IndexCharacteristics';
import DataTable from 'src/libs/components/basic/DataTable';
import MarketPriceChart from 'src/libs/components/charts/MarketPriceChart';
import ActionHeader from 'src/libs/components/basic/ActionHeader';
import Breadcrumb from 'src/libs/components/basic/Breadcrumb';
import BreadcrumbHeader from 'src/libs/components/basic/BreadcrumbHeader';
import RadioButtons from 'src/libs/components/basic/RadioButtons';
import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import Aside from 'src/libs/components/basic/Aside';
import DynamicWrapper from 'src/libs/components/basic/DynamicWrapper';
import DataSource from 'src/libs/DataSource';
import * as Utils from 'src/libs/Utils';
import DataManagerHelper from 'src/libs/helpers/DataManagerHelper';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    let _dfd = self.new_deferred();

    self.market_id_event = Utils.gen_event('Active.market_id', self.get_id());

    self.register_export_id = Utils.gen_id(
        self.get_id(),
        'body',
        'action_toolbar',
        'export_actions',
    );

    DataManagerHelper.register_view_in_analytics_events([
        Utils.gen_event(
            'ActionButton.action.view_in_analytics',
            self.get_id(),
            'body',
            'header',
            'view_in_analytics',
        ),
    ]);

    DataManagerHelper.register_upload_wizard_events([
        Utils.gen_event('ActionButton.action.upload', self.get_id(), 'body', 'header', 'upload'),
    ]);

    DataManagerHelper.register_create_new_entity_action_buttons([
        Utils.gen_id(self.get_id(), 'body', 'header', 'new'),
    ]);

    self.cpanel = new Aside({
        parent_id: self.get_id(),
        id: 'cpanel',
        title: 'Data Manager',
        title_css: 'data-manager',
        template: 'tpl_analytics_cpanel',
        layout: {
            header: 'navigation',
        },
        components: [
            {
                id: 'navigation',
                component: RadioButtons,
                template: 'tpl_full_width_radio_buttons',
                default_state: 'characteristics',
                button_css: {
                    'btn-block': true,
                    'btn-sm': true,
                    'btn-cpanel-primary': true,
                },
                buttons: [
                    {
                        label: 'Characteristics',
                        state: 'characteristics',
                    },
                    {
                        label: 'Prices',
                        state: 'prices',
                    },
                ],
                reset_event: self.reset_event,
            },
        ],
    });

    self.market = self.new_instance(DataSource, {
        datasource: {
            type: 'dynamic',
            query: {
                target: 'index:data',
                millisecond_dates: true,
                market_id: {
                    type: 'observer',
                    event_type: self.market_id_event,
                    required: true,
                },
            },
        },
    });

    self.body = self.new_instance(DynamicWrapper, {
        id: 'body',
        template: 'tpl_analytics_body',
        active_component: 'characteristics',
        set_active_event: Utils.gen_event('RadioButtons.state', self.cpanel.get_id(), 'navigation'),
        layout: {
            header: 'header',
            toolbar: 'action_toolbar',
        },
        components: [
            {
                component: BreadcrumbHeader,
                id: 'header',
                template: 'tpl_breadcrumb_header',
                layout: {
                    breadcrumb: 'breadcrumb',
                },
                components: [
                    {
                        id: 'breadcrumb',
                        component: Breadcrumb,
                        items: [
                            {
                                label: 'Data Manager',
                                link: '#!/data-manager/indexes',
                            },
                            {
                                label: 'Indexes',
                                link: '#!/data-manager/indexes',
                            },
                            {
                                datasource: {
                                    key: 'name',
                                    type: 'dynamic',
                                    query: {
                                        target: 'index:data',
                                        include_prices: false,
                                        market_id: {
                                            type: 'observer',
                                            event_type: self.market_id_event,
                                            required: true,
                                        },
                                    },
                                },
                            },
                        ],
                    },
                ],
                datasource: {
                    type: 'dynamic',
                    query: {
                        target: 'index:data',
                        include_prices: false,
                        market_id: {
                            type: 'observer',
                            event_type: self.market_id_event,
                            required: true,
                        },
                    },
                },
            },
            {
                id: 'action_toolbar',
                component: ActionHeader,
                template: 'tpl_action_toolbar',
                buttons: [
                    DataManagerHelper.buttons.share({
                        data_table_id: self.data_table_id,
                        check_permissions: true,
                    }),
                    DataManagerHelper.buttons.delete_entities({
                        origin_url: '#!/data-manager/indexes',
                        check_permissions: true,
                    }),
                ],
                datasource: {
                    type: 'dynamic',
                    query: {
                        target: 'index:data',
                        include_prices: false,
                        market_id: {
                            type: 'observer',
                            event_type: self.market_id_event,
                            required: true,
                        },
                    },
                },
            },
            {
                id: 'prices',
                component: Aside,
                template: 'tpl_aside_body',
                layout: {
                    body: ['price_chart', 'price_table'],
                },
                components: [
                    {
                        id: 'price_chart',
                        component: MarketPriceChart,
                        dependencies: [self.market.get_id()],
                        label: 'Prices',
                        template: 'tpl_chart_box',
                        legend: true,
                        data: self.market.data,
                    },
                    {
                        id: 'price_table',
                        dependencies: [self.market.get_id()],
                        component: DataTable,
                        register_export: {
                            export_event_id: self.register_export_id,
                            title: 'Prices',
                            subtitle: 'CSV',
                        },
                        hide_empty: true,
                        label: 'Prices',
                        css: {'table-light': true, 'table-sm': true},
                        inline_data: true,
                        columns: [
                            {
                                label: 'Date',
                                key: 'date',
                                format: 'date',
                            },
                            {
                                label: 'Price',
                                key: 'price',
                                format: 'usd',
                            },
                        ],
                        data: ko.pureComputed(() => {
                            let data = self.market.data();

                            if (data && data.prices) {
                                // Only return prices if the use has share permisson
                                if (data.share) {
                                    return data.prices.map(([date, price]) => {
                                        return {
                                            date: date,
                                            price: price,
                                        };
                                    });
                                }
                            }

                            return [];
                        }),
                    },
                ],
            },
            {
                id: 'characteristics',
                component: IndexCharacteristics,
                label: 'Characteristics',
                legend: true,
                market_id_event: self.market_id_event,
            },
        ],
    });

    self.asides = [self.cpanel, self.body];

    self.when(self.body, self.cpanel, self.market).done(() => {
        _dfd.resolve();
    });

    return self;
}
