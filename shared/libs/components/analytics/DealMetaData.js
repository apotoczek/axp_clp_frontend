import HTMLContent from 'src/libs/components/basic/HTMLContent';
import NewPopoverButton from 'src/libs/components/popovers/NewPopoverButton';
import Radiolist from 'src/libs/components/basic/Radiolist';
import DataSource from 'src/libs/DataSource';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import DynamicWrapper from 'src/libs/components/basic/DynamicWrapper';
import Aside from 'src/libs/components/basic/Aside';
import ko from 'knockout';
import MetaDataTable from 'components/reporting/MetaDataTable';
import * as Formatters from 'src/libs/Formatters';
import {grouped_text_data} from 'src/libs/Mapping';

import 'src/libs/bindings/react';
class MetaTable extends BaseComponent {
    constructor(opts = {}, components = {}) {
        super(opts, components);

        let _dfd = this.new_deferred();

        this.define_template(`
            <div class="big-message" data-bind="visible: loading" style="display: none">
                <span class="glyphicon glyphicon-cog animate-spin"></span>
                <h1>Loading..</h1>
            </div>
            <div data-bind="visible: !loading()" style="display: none">
                <div style="padding: 20px 20px 0"  class="clearfix">
                    <div
                        data-bind="
                            renderReactComponent: MetaDataTable,
                            props: header_props,
                        "
                    ></div>
                </div>
                <div style="padding: 20px" class="clearfix">
                    <div
                        data-bind="
                            renderReactComponent: MetaDataTable,
                            props: meta_props,
                        "
                    >
                    </div>
                </div>
            </div>
        `);

        this.header_props = this.init_header_props(opts.company_uid_event);
        this.meta_props = this.init_meta_props(opts.company_uid_event, opts.as_of_date_event);

        this.MetaDataTable = MetaDataTable;

        this.date_formatter = value => (value ? Formatters.backend_date(value) : 'N/A');

        _dfd.resolve();
    }

    init_header_props(company_uid_event) {
        const datasource = this.new_instance(DataSource, {
            datasource: {
                type: 'dynamic',
                query: {
                    target: 'company_data',
                    company_uid: {
                        type: 'observer',
                        event_type: company_uid_event,
                        required: true,
                    },
                },
                mapping: data => {
                    return [
                        {
                            label: 'Overview',
                            values: [
                                {
                                    label: 'Name',
                                    value: data.name,
                                },
                            ],
                        },
                    ];
                },
            },
        });

        this.add_dependency(datasource);

        return ko.pureComputed(() => {
            return {
                metaData: datasource.data(),
                theme: 'light',
            };
        });
    }

    init_meta_props(company_uid_event, as_of_date_event) {
        const datasource = this.new_instance(DataSource, {
            datasource: {
                type: 'dynamic',
                key: 'values',
                query: {
                    target: 'company_text_data',
                    company_uid: {
                        type: 'observer',
                        event_type: company_uid_event,
                        required: true,
                    },
                    as_of_date: {
                        type: 'observer',
                        event_type: as_of_date_event,
                        required: true,
                        mapping: 'get_value',
                    },
                },
                mapping: text_data => grouped_text_data(text_data),
            },
        });

        this.add_dependency(datasource);

        return ko.pureComputed(() => {
            return {
                metaData: datasource.data(),
                theme: 'light',
            };
        });
    }
}

class DealMeta extends BaseComponent {
    constructor(opts = {}, components = {}) {
        super(opts, components);

        let _dfd = this.new_deferred();
        let _events = opts.events;

        _events.resolve_and_add('deal_meta_as_of_date', 'PopoverButton.value');

        if (!_events || !_events.get('company_uid')) {
            throw 'Trying to initialize DealPerformance without company_uid_event';
        }

        const cpanel_components = [
            {
                id: 'charts_label',
                component: HTMLContent,
                html: '<h5>Chart Filters</h5>',
            },
            {
                id: 'deal_meta_as_of_date',
                id_callback: _events.register_alias('deal_meta_as_of_date'),
                component: NewPopoverButton,
                label_track_selection: true,
                label: 'As of',
                css: {
                    'btn-block': true,
                    'btn-cpanel-primary': true,
                    'btn-sm': true,
                },
                popover_options: {
                    title: 'Select as of',
                    placement: 'right',
                    css_class: 'popover-cpanel',
                },
                popover_config: {
                    component: Radiolist,
                    default_selected_index: 0,
                    datasource: {
                        mapping: 'list_to_options',
                        mapping_args: {
                            format: 'backend_date',
                        },
                        type: 'dynamic',
                        query: {
                            target: 'company_text_data_as_of_dates',
                            company_uid: {
                                type: 'observer',
                                event_type: _events.get('company_uid'),
                                required: true,
                            },
                        },
                    },
                },
            },
        ];

        const cpanel_body_layout = ['deal_meta_as_of_date'];

        this.body = this.new_instance(DynamicWrapper, {
            id: 'main',
            component: Aside,
            template: 'tpl_analytics_body_static',
            layout: {
                header: 'breadcrumbs',
                toolbar: 'header',
                expandable_meta_data: 'meta_data',
                body: ['body'],
            },
            components: [
                {
                    id: 'body',
                    component: MetaTable,
                    company_uid_event: _events.get('company_uid'),
                    as_of_date_event: _events.get('deal_meta_as_of_date'),
                },
            ],
        });

        this.cpanel = this.new_instance(Aside, {
            id: 'cpanel',
            template: 'tpl_analytics_cpanel',
            layout: {
                header: 'mode_toggle',
                body: cpanel_body_layout,
            },
            components: cpanel_components,
        });

        this.when(this.body, this.cpanel).done(() => {
            _dfd.resolve();
        });
    }
}

export default DealMeta;
