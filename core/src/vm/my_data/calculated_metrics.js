import BaseComponent from 'src/libs/components/basic/BaseComponent';
import 'src/libs/bindings/react';

import Aside from 'src/libs/components/basic/Aside';
import Breadcrumb from 'src/libs/components/basic/Breadcrumb';
import BreadcrumbHeader from 'src/libs/components/basic/BreadcrumbHeader';
import ReactWrapper from 'src/libs/components/ReactWrapper';

import Mount from 'src/react/containers/datamanager/CalculatedMetrics';

export default class CalculatedMetrics extends BaseComponent {
    constructor(opts, components) {
        super(opts, components);
        this.props = {};

        this.body = this.new_instance(Aside, {
            id: 'body',
            template: 'tpl_list_body_no_toolbar',
            layout: {
                header: 'header',
                body: ['calculated_metrics'],
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
                                    link: '#!/data-manager',
                                },
                                {
                                    label: 'Calculated Metrics',
                                    link: '#!/data-manager/metrics:calculated',
                                },
                            ],
                        },
                    ],
                },
                {
                    id: 'calculated_metrics',
                    component: ReactWrapper,
                    reactComponent: Mount,
                },
            ],
        });
    }
}
