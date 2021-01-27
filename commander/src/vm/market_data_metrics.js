import BaseComponent from 'src/libs/components/basic/BaseComponent';

import MetricsPage from 'components/data-admin/MetricsPage';

import 'src/libs/bindings/react';

export default class MarketDataMetricsVM extends BaseComponent {
    constructor() {
        super({id: 'market_data_metrics'});

        this.dfd = this.new_deferred();

        this.mainComponent = MetricsPage;
        this.props = {};

        this.dfd.resolve();
    }
}
