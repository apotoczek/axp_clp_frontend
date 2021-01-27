import BaseComponent from 'src/libs/components/basic/BaseComponent';
import * as Utils from 'src/libs/Utils';
import ko from 'knockout';
import Observer from 'src/libs/Observer';
import 'src/libs/bindings/react';

import Manager from 'containers/analytics/CompanyCalculatedMetricSet';

class CalculatedMetricSetManager extends BaseComponent {
    constructor(opts, components) {
        super(opts, components);

        opts = opts || {};

        const dfd = this.new_deferred();

        const args_event = Utils.gen_event('Active.args', this.get_id());
        const args = ko.observable();
        Observer.register(args_event, args);

        this.Manager = Manager;
        this.mode = ko.observable();
        this.create_new = ko.observable(false);

        this.props = ko.pureComputed(() => {
            const {company_uid, metric_uid, time_frame, frequency, version_uid} = args() ?? {};
            return {
                companyUid: company_uid,
                metricUid: metric_uid,
                timeFrame: parseInt(time_frame),
                frequency: parseInt(frequency),
                versionUid: version_uid,
                forDataManager: true,
            };
        });

        this.define_template(`
            <div style="display: table-cell; height: 100%;"
                 data-bind="renderReactComponent: Manager, props: props"></div>
        `);

        dfd.resolve();
    }
}

export default CalculatedMetricSetManager;
