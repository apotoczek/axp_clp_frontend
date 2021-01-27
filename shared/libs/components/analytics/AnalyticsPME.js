/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import config from 'config';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import PMEBox from 'src/libs/components/PMEBox';
import MarketChart from 'src/libs/components/charts/MarketChart';
import MultiPMEModal from 'src/libs/components/modals/MultiPMEModal';
import Observer from 'src/libs/Observer';
import * as Utils from 'src/libs/Utils';
import DataThing from 'src/libs/DataThing';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    self.define_default_template(`
            <div class="big-message" data-bind="visible: loading">
                <span class="glyphicon glyphicon-cog animate-spin"></span>
                <h1>Loading PME Benchmark..</h1>
            </div>
            <!-- ko if: !loading() && error() && error_template() -->
                <!-- ko template: error_template --><!-- /ko -->
            <!-- /ko -->
            <!-- ko if: !loading() && !error() -->
            <div class="component-box" data-bind="attr: { id: html_id() }">
                <div class="row">
                    <div class="col-xs-12 col-md-6" data-bind="renderComponent: left">
                    </div>
                    <div class="col-xs-12 col-md-6" data-bind="renderComponent: right">
                    </div>
                </div>
                <div class="page-break"></div>
                <div class="row">
                    <div class="col-xs-12" data-bind="renderComponent: market_chart">
                    </div>
                </div>
                <div data-bind="foreach: footnotes">
                    <p data-bind="text: $data" class='footnote'></p>
                </div>
            </div>
            <!-- /ko -->
        `);

    let _dfd = self.new_deferred();

    if (opts.request_data_event) {
        self.request_data_event = opts.request_data_event;
        Observer.register(self.request_data_event, action => {
            let data = {
                methodologies: self.methodologies(),
                market_chart: self.market_chart.data(),
            };
            Observer.broadcast_for_id(self.get_id(), 'Report.data_snapshot', {
                id: self.id,
                data: data,
                action: action,
            });
        });
    }

    if (opts.restore_data_event) {
        self.restore_data_event = opts.restore_data_event;
        Observer.register(self.restore_data_event, data => {
            if (data.id == self.id) {
                self.methodologies(data.methodologies);
                self.market_chart.data(data.market_chart);
            }
        });
    }

    /********************************************************************
         AnalyticsPME:
            Uses backend PME data (target: 'vehicle:pme') which returns
            an object with 'methodologies', 'chart_data', 'footnotes'
        ********************************************************************/

    /********************************************************************
         Get the methodolgies and use them in two PMEBoxes.
        ********************************************************************/
    self.methodologies = ko.computed(() => {
        let data = self.data();
        if (data) {
            return data['methodologies'];
        }
    });

    self.footnotes = ko.computed(() => {
        let data = self.data();
        if (data) {
            return data['footnotes'];
        }
        return [];
    });

    self.left = self.new_instance(PMEBox, {
        loading: self.loading,
        data: self.methodologies,
        dynamic: true,
        default_methodology: 'kaplan_schoar',
    });

    self.right = self.new_instance(PMEBox, {
        loading: self.loading,
        data: self.methodologies,
        dynamic: true,
        default_methodology: 'bison_pme',
    });

    self._prepare_pme_summary = DataThing.backends.useractionhandler({
        url: 'prepare_pme_summary',
    });

    self.export_pme_summary = function(methodology) {
        let data = self.get_query_params();

        data.methodology = methodology || 'All';

        self._prepare_pme_summary({
            data: data,
            success: DataThing.api.XHRSuccess(key => {
                DataThing.form_post(config.download_file_base + key);
            }),
            error: DataThing.api.XHRError(() => {}),
        });
    };

    if (opts.register_export_event) {
        self.register_export = function(methodology) {
            let title, event_type;

            if (methodology) {
                title = methodology;
                event_type = `AnalyticsPME.export_${methodology
                    .replace(/\s+/g, '_')
                    .replace('+', '_plus')
                    .toLowerCase()}`;
            } else {
                title = 'Full Summary';
                event_type = 'AnalyticsPME.export_all';
            }

            let export_csv_event = Utils.gen_event(event_type, self.get_id());

            Observer.broadcast(
                opts.register_export_event,
                {
                    title: title,
                    subtitle: 'XLS',
                    type: 'PME Benchmark',
                    event_type: export_csv_event,
                    data: methodology,
                },
                true,
            );

            Observer.register(export_csv_event, methodology => {
                self.export_pme_summary(methodology);
            });
        };

        let methodologies = [
            'Cobalt PME',
            'Direct Alpha',
            'Kaplan Schoar',
            'Long Nickels',
            'GEM IPP',
            'PME+',
            'mPME',
        ];

        for (let i = 0, l = methodologies.length; i < l; i++) {
            self.register_export(methodologies[i]);
        }

        self.register_export();
    }

    /********************************************************************
         Market chart
        ********************************************************************/
    self.market_chart = self.new_instance(MarketChart, {
        loading: self.loading,
        render_currency: ko.computed(() => {
            let data = self.data();
            if (data) {
                return data['render_currency'];
            }
        }),
        data: ko.computed(() => {
            let data = self.data();
            if (data) {
                return data['chart_data'];
            }
        }),
        legend: true,
        exporting: true,
        label_in_chart: true,
        label: 'Net Cash Flows across Market Change',
    });

    if (opts.multi_pme) {
        self.multi_pme_modal = self.new_instance(MultiPMEModal, {
            datasource: opts.multi_pme.datasource,
            as_of_date_event: opts.as_of_date_event,
            horizon_event: opts.horizon_event,
            in_user_fund: opts.vehicle_is_gross_fund,
        });

        self.multi_pme_active = ko.observable(false);

        Observer.register_for_id(self.get_id(), opts.multi_pme.active_event, active => {
            self.multi_pme_active(active);
        });

        Observer.register_for_id(self.get_id(), opts.multi_pme.settings_event, () => {
            self.multi_pme_modal.show();
        });

        self.multi_pme_active.subscribe(active => {
            if (active) {
                self.update_query({
                    multi_index: self.multi_pme_modal.config,
                });
            } else {
                self.update_query({
                    multi_index: undefined,
                });
            }
        });

        Observer.register_for_id(
            self.get_id(),
            Utils.gen_event('MultiPMEModal.config', self.multi_pme_modal.get_id()),
            () => {
                let active = self.multi_pme_active();
                if (active) {
                    self.update_query({
                        multi_index: self.multi_pme_modal.config,
                    });
                }
            },
        );
    }

    self.when(self.left, self.right, self.market_chart).done(() => {
        _dfd.resolve();
    });

    return self;
}
