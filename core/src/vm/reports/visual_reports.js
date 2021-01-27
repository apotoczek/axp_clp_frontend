/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import pager from 'pager';
import Context from 'src/libs/Context';
import Observer from 'src/libs/Observer';
import ReportStart from 'src/libs/components/reports/visual_reports/ReportStart';
import FBRReport from 'src/libs/components/reports/visual_reports/FBRReport';
import LPUpdateReport from 'src/libs/components/reports/visual_reports/LPUpdateReport';
import GrossDealReport from 'src/libs/components/reports/visual_reports/GrossDealReport';
import FundScreeningReport from 'src/libs/components/reports/visual_reports/FundScreeningReport';
import PortfolioUpdateReport from 'src/libs/components/reports/visual_reports/PortfolioUpdateReport';
import HLPortfolio from 'src/libs/components/reports/visual_reports/HLPortfolio';

export default function() {
    let self = new Context({
        id: 'visual-reports',
    });

    /*********************************************************
     *                    Variables                          *
     *********************************************************/

    self.dfd = self.new_deferred();

    /*********************************************************
     *               Generated events                        *
     *********************************************************/

    self.report_configs = {
        fbr: FBRReport,
        lp_update: LPUpdateReport,
        deal_report: GrossDealReport,
        fund_screening: FundScreeningReport,
        portfolio_update: PortfolioUpdateReport,
        hl_portfolio_report: HLPortfolio,
    };

    self.initialized = ko.observableArray([]);

    self.start = self.new_instance(ReportStart, {});
    self.instances = {};

    self.initializing = ko.observable(false);
    self.active_mode = ko.observable('start');

    self.get_instance = function(sub_type, state) {
        if (sub_type in self.instances) {
            self.instances[sub_type].set_state(state);
        } else {
            if (sub_type in self.report_configs) {
                self.instances[sub_type] = self.new_instance(self.report_configs[sub_type], {
                    sub_type: sub_type,
                    initial_state: state,
                });
            } else {
                throw `Report sub type "${sub_type}" not implemented...`;
            }
        }

        return self.instances[sub_type];
    };

    self.reset_instances = function(exclude_type) {
        for (let [sub_type, instance] of Object.entries(self.instances)) {
            if (exclude_type === undefined || sub_type !== exclude_type) {
                instance.reset_state();
            }
        }
    };

    self.handle_url = function(url) {
        if (url.length === 1) {
            self.active_mode('start');
            self.reset_instances();
            Observer.broadcast_for_id('UserAction', 'record_action', {
                action_type: 'view_visual_reports',
            });

            return true;
        }

        let active_mode = self.active_mode();
        let sub_type = url[1];
        let state = url[2] || 'wizard';
        let uid = url[3];

        let instance = self.get_instance(sub_type, {
            state: state,
            uid: uid,
        });

        if (!active_mode || active_mode !== sub_type) {
            self.initializing(true);
            self.when(instance).done(() => {
                if (self.initialized.indexOf(sub_type) === -1) {
                    self.initialized.push(sub_type);
                }

                self.active_mode(sub_type);
                self.initializing(false);
            });
        }

        self.reset_instances(sub_type);

        return true;
    };

    /*********************************************************
     *           Initialize listeners                        *
     *********************************************************/

    self.when(self.start).done(() => {
        Observer.register_hash_listener('visual-reports', url => {
            return self.handle_url(url);
        });

        Observer.register(self.start.events.get('generate_report'), sub_type => {
            pager.navigate(`#!/visual-reports/${sub_type}/`);
        });

        self.dfd.resolve();
    });

    return self;
}
