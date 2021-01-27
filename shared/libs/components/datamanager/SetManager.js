import BaseComponent from 'src/libs/components/basic/BaseComponent';
import Aside from 'src/libs/components/basic/Aside';
import BreadcrumbHeader from 'src/libs/components/basic/BreadcrumbHeader';
import Breadcrumb from 'src/libs/components/basic/Breadcrumb';
import * as Utils from 'src/libs/Utils';
import DataSource from 'src/libs/DataSource';
import ko from 'knockout';
import ReactWrapper from 'src/libs/components/ReactWrapper';
import Observer from 'src/libs/Observer';

import CompanyMetricSet from 'containers/analytics/CompanyMetricSet';

export default class SetManager extends BaseComponent {
    constructor(opts, components) {
        super(opts, components);

        const _dfd = this.new_deferred();

        const set_uid_event = Utils.gen_event('Active.vehicle_uid', this.get_id());
        const set_uid = Observer.observable(set_uid_event);

        this.datasource = this.new_instance(DataSource, {
            datasource: {
                type: 'dynamic',
                query: {
                    target: 'metric_set',
                    metric_set_uid: {
                        type: 'observer',
                        event_type: set_uid_event,
                        required: true,
                    },
                },
            },
        });

        this.body = this.new_instance(Aside, {
            id: 'body',
            template: 'tpl_list_body_no_toolbar',
            layout: {
                header: 'header',
                body: ['set_table'],
            },
            components: [
                {
                    component: BreadcrumbHeader,
                    id: 'header',
                    template: 'tpl_breadcrumb_header',
                    css: {'full-width-page-header': true},
                    layout: {
                        breadcrumb: 'breadcrumb',
                    },
                    components: [
                        {
                            id: 'breadcrumb',
                            component: Breadcrumb,
                            data: this.datasource.data,
                            items: [
                                {
                                    label: 'Data Manager',
                                    link: '#!/data-manager',
                                },
                                {
                                    label: 'Companies',
                                    link: '#!/data-manager/companies',
                                },
                                {
                                    label_key: 'company:name',
                                    contextual_url: {
                                        url: 'company-analytics/<company:uid>',
                                    },
                                    inherit_data: true,
                                },
                                {
                                    label_key: 'metric:name',
                                    inherit_data: true,
                                },
                            ],
                        },
                    ],
                },
                {
                    id: 'set_table',
                    component: ReactWrapper,
                    reactComponent: CompanyMetricSet,
                    props: ko.pureComputed(() => {
                        return {
                            metricSetUid: set_uid(),
                        };
                    }),
                },
            ],
        });

        this.asides = [this.body];

        this.when(this.datasource, this.body).done(() => {
            _dfd.resolve();
        });
    }
}
