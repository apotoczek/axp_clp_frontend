import BaseComponent from 'src/libs/components/basic/BaseComponent';
import DataSource from 'src/libs/DataSource';
import * as Utils from 'src/libs/Utils';
import DataThing from 'src/libs/DataThing';
import ko from 'knockout';
import config from 'config';
import auth from 'auth';
import {flattenMembers} from 'bison/utils/attributes';
import Observer from 'src/libs/Observer';

import Manager from 'components/datamanager/company/Manager';
import SpreadsheetUploadWizard from 'src/libs/components/upload/SpreadsheetUploadWizard';

import pager from 'pager';

import 'src/libs/bindings/react';

const gen_endpoint = url =>
    DataThing.backends.useractionhandler({
        url: url,
    });

const gen_text_data_endpoint = url =>
    DataThing.backends.text_data({
        url: url,
    });

// Note! This page exists and is routed to, but we don't really have any links that lead to it. The links that
// used to take you to this page now take you to the company-analytics page. It's kept in order to prevent dead
// links or if we missed something when removing the routing to it, but if you're looking here to add a feature,
// go to CompanyAnalytics.jsx instead!
class CompanyManager extends BaseComponent {
    constructor(opts, components) {
        super(opts, components);

        opts = opts || {};

        const dfd = this.new_deferred();

        const company_uid_event =
            opts.company_uid_event || Utils.gen_event('Active.company_uid', this.get_id());

        this.define_template(`
            <div style="display: table-cell; height: 100%;" data-bind="renderReactComponent: Manager, props: props"></div>
        `);

        const company_uid = ko.observable();
        Observer.register(company_uid_event, company_uid);

        this.text_specs = this.new_instance(DataSource, {
            datasource: {
                type: 'dynamic',
                key: 'specs',
                query: {
                    target: 'text_data_specs',
                },
            },
        });

        this.text_values = this.new_instance(DataSource, {
            datasource: {
                type: 'dynamic',
                key: 'values',
                query: {
                    target: 'company_text_data',
                    most_recent_only: false,
                    company_uid: {
                        type: 'observer',
                        event_type: company_uid_event,
                        required: true,
                    },
                },
            },
        });

        this.valuations = this.new_instance(DataSource, {
            datasource: {
                type: 'dynamic',
                key: 'results',
                query: {
                    target: 'filter_valuations',
                    results_per_page: 'all',
                    company_uid: {
                        type: 'observer',
                        event_type: company_uid_event,
                        required: true,
                    },
                },
            },
        });

        this.funds = this.new_instance(DataSource, {
            datasource: {
                type: 'dynamic',
                query: {
                    target: 'vehicles',
                    results_per_page: 'all',
                    filters: {
                        entity_type: 'user_fund',
                        cashflow_type: 'gross',
                        permission: ['write', 'share'],
                        exclude_portfolio_only: true,
                    },
                },
                mapping: ({results}) => {
                    const funds = {};

                    for (const vehicle of results) {
                        funds[vehicle.user_fund_uid] = vehicle.name;
                    }

                    return funds;
                },
            },
        });

        this.derived_valuations = this.new_instance(DataSource, {
            datasource: {
                type: 'dynamic',
                query: {
                    target: 'derived_valuations',
                    company_uid: {
                        type: 'observer',
                        event_type: company_uid_event,
                        required: true,
                    },
                },
            },
        });

        this.deals = this.new_instance(DataSource, {
            datasource: {
                type: 'dynamic',
                key: 'results',
                query: {
                    target: 'deals',
                    results_per_page: 'all',
                    company_uid: {
                        type: 'observer',
                        event_type: company_uid_event,
                        required: true,
                    },
                    attribute_uid_mapping: true,
                    include_company_attributes: false,
                },
            },
        });

        this.company = this.new_instance(DataSource, {
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
                mapping: company => {
                    return {
                        ...company,
                        fiscal_year_end: company.fiscal_year_end
                            ? Utils.epoch_to_date(company.fiscal_year_end)
                            : null,
                    };
                },
            },
        });

        this.fiscal_quarters = this.new_instance(DataSource, {
            datasource: {
                type: 'dynamic',
                query: {
                    target: 'fiscal_quarters',
                    company_uid: {
                        type: 'observer',
                        event_type: company_uid_event,
                        required: true,
                    },
                },
            },
        });

        this.currencies = this.new_instance(DataSource, {
            datasource: {
                mapping: results => {
                    const currencies = {};

                    for (const currency of results) {
                        currencies[currency.id] = `${currency.symbol} - ${currency.name}`;
                    }

                    return currencies;
                },
                type: 'dynamic',
                query: {
                    target: 'currency:markets',
                },
            },
        });

        this.attributes = this.new_instance(DataSource, {
            datasource: {
                type: 'dynamic',
                query: {
                    target: 'attributes',
                    include_members: true,
                    include_public_attributes: true,
                    results_per_page: 'all',
                },
                mapping: ({results}) => {
                    const attributes = {};

                    for (const attribute of results) {
                        attributes[attribute.uid] = {
                            uid: attribute.uid,
                            name: attribute.name,
                            members: flattenMembers(attribute.members),
                            scope: attribute.scope,
                        };
                    }

                    return attributes;
                },
            },
        });

        this.mode = ko.observable();
        this.create_new = ko.observable(false);

        this.Manager = Manager;

        this.endpoints = {
            update_company: gen_endpoint('update_company'),
            new_deal: gen_endpoint('new_deal'),
            new_company: gen_endpoint('new_company'),
            delete_metric_sets: gen_endpoint('delete_metric_sets'),
            update_metric_sets: gen_endpoint('update_metric_sets'),
            prepare_valuations_template: gen_endpoint('prepare_valuations_template'),
            prepare_metrics_template: gen_endpoint('prepare_metrics_template'),
            create_text_data_value: gen_text_data_endpoint('create_value'),
            update_text_data_value: gen_text_data_endpoint('update_value'),
            delete_text_data_values: gen_text_data_endpoint('delete_values'),
        };

        this.upload_wizard = this.new_instance(SpreadsheetUploadWizard, {});

        this.loading = ko.pureComputed(() => {
            return [
                this.funds,
                this.company,
                this.deals,
                this.attributes,
                this.currencies,
                this.valuations,
                this.fiscal_quarters,
                this.derived_valuations,
                this.text_values,
                this.text_specs,
            ].reduce((res, src) => res || src.loading(), false);
        });

        this.modes = ko.pureComputed(() => {
            const company = this.company.data() || {};
            const modes = [
                {label: 'Overview', key: 'overview'},
                ...Utils.conditional_element(
                    [{label: 'Metrics', key: 'metrics'}],
                    auth.user_has_feature('metric_upload'),
                ),
                {label: 'Valuations', key: 'valuations'},
                {label: 'Text Values', key: 'text-values'},
                {
                    label: 'Reporting Components',
                    key: 'reporting-components',
                    url: `#!/company-analytics/${company.uid}/reporting-components`,
                },
            ];

            return modes;
        });

        this.props = ko.pureComputed(() => {
            const company = this.company.data();
            const specs = this.text_specs.data() || [];

            const textGroups = [];
            const textSpecs = {};

            for (const {uid, label, group, attribute = {}} of specs) {
                if (textSpecs[group.uid] === undefined) {
                    textGroups.push({value: group.uid, label: group.label});
                    textSpecs[group.uid] = [];
                }

                textSpecs[group.uid].push({value: uid, label, attributeUid: attribute.uid});
            }

            return {
                modes: this.modes(),
                company: company,
                deals: this.deals.data(),
                attributes: this.attributes.data(),
                options: {
                    currencies: this.currencies.data(),
                    funds: this.funds.data(),
                    textSpecs,
                    textGroups,
                },
                uid: company_uid(),
                valuations: this.valuations.data(),
                derivedValuations: this.derived_valuations.data(),
                fiscalQuarters: this.fiscal_quarters.data(),
                textValues: this.text_values.data(),
                isLoading: this.loading(),
                activeMode: this.mode(),
                createNew: this.create_new(),
                setMode: mode => this.mode(mode),
                onCancelNewCompany: () => {
                    pager.navigate('#!/data-manager/companies');
                },
                onNewCompany: data => {
                    this.endpoints.new_company({
                        data: data,
                        success: DataThing.api.XHRSuccess(company_uid => {
                            DataThing.status_check();
                            pager.navigate(`#!/company-analytics/${company_uid}`);
                        }),
                    });
                },
                onNewDeal: ({user_fund_uid, company_uid, ...data}) => {
                    this.endpoints.new_deal({
                        data: {
                            company_uid: company_uid,
                            user_fund_uid: user_fund_uid,
                            data,
                        },
                        success: DataThing.api.XHRSuccess(() => {
                            DataThing.status_check();
                        }),
                    });
                },
                onUpload: () => {
                    this.upload_wizard.show();
                },
                onDownloadValuations: () => {
                    this.endpoints.prepare_valuations_template({
                        data: {
                            entity_uid: company.uid,
                            entity_type: 'company',
                        },
                        success: DataThing.api.XHRSuccess(key => {
                            DataThing.form_post(config.download_file_base + key);
                        }),
                    });
                },
                onUpdateCharacteristics: updates => {
                    this.endpoints.update_company({
                        data: {
                            company_uid: company.uid,
                            updates: updates,
                        },
                        success: DataThing.api.XHRSuccess(() => {
                            DataThing.status_check();
                        }),
                    });
                },
                onUpdateValue: ({uid, specUid, value, asOfDate}) => {
                    this.endpoints.update_text_data_value({
                        data: {
                            uid,
                            spec_uid: specUid,
                            value,
                            as_of_date: Utils.date_to_epoch(asOfDate),
                        },
                        success: DataThing.api.XHRSuccess(() => {
                            DataThing.status_check();
                        }),
                    });
                },
                onAddValue: ({specUid, value, asOfDate}) => {
                    this.endpoints.create_text_data_value({
                        data: {
                            company_uid: company.uid,
                            spec_uid: specUid,
                            value,
                            as_of_date: Utils.date_to_epoch(asOfDate),
                        },
                        success: DataThing.api.XHRSuccess(() => {
                            DataThing.status_check();
                        }),
                    });
                },
                onDeleteValues: ({uids}) => {
                    this.endpoints.delete_text_data_values({
                        data: {
                            value_uids: uids,
                        },
                        success: DataThing.api.XHRSuccess(() => {
                            DataThing.status_check();
                        }),
                    });
                },
            };
        });

        dfd.resolve();
    }
}

export default CompanyManager;
