/* Automatically transformed from AMD to ES6. Beware of code smell. */

import ko from 'knockout';
import pager from 'pager';
import Context from 'src/libs/Context';
import Observer from 'src/libs/Observer';
import * as Utils from 'src/libs/Utils';
import ReportStart from 'src/libs/components/reports/data_reports/ReportStart';
import SingleVehicleWizard from 'src/libs/components/reports/data_reports/SingleVehicleWizard';
import MultiVehicleWizard from 'src/libs/components/reports/data_reports/MultiVehicleWizard';
import ReportViewer from 'src/libs/components/reports/data_reports/ReportViewer';

export default function() {
    let self = new Context({
        id: 'data-reports',
    });

    /*********************************************************
     *                    Variables                          *
     *********************************************************/

    self.dfd = self.new_deferred();

    let progress_update_event = Utils.gen_event('DataReports.progress', 'reports');

    self.start = self.new_instance(ReportStart, {
        progress_update_event: progress_update_event,
    });

    self.wizards = {
        multi_net_vehicle: self.new_instance(MultiVehicleWizard, {
            progress_update_event: progress_update_event,
            cashflow_types: ['net'],
        }),
        single_net_fund: self.new_instance(SingleVehicleWizard, {
            progress_update_event: progress_update_event,
            cashflow_types: ['net'],
            entity_types: ['user_fund'],
        }),
    };

    self.render_wizards = ko.pureComputed(() => {
        let list = [];

        for (let [key, component] of Object.entries(self.wizards)) {
            list.push({
                key: key,
                component: component,
            });
        }

        return list;
    });

    self.sub_type_wizard_map = {
        lp_report: 'single_net_fund',
        net_overview: 'multi_net_vehicle',
        net_cashflows: 'multi_net_vehicle',
        pme_benchmark: 'multi_net_vehicle',
        time_weighted: 'multi_net_vehicle',
        peer_benchmark: 'multi_net_vehicle',
        quarterly_progression: 'multi_net_vehicle',
        delayed_cashflows: 'multi_net_vehicle',
    };

    self.viewer = self.new_instance(ReportViewer, {});

    self.active_mode = ko.observable('start');

    self.handle_url = function(url) {
        if (url.length === 1) {
            self.active_mode('start');
            return true;
        } else if (url.length === 2) {
            let sub_type = url[1];

            let wizard = self.sub_type_wizard_map[sub_type];

            self.wizards[wizard].reset(sub_type);

            self.active_mode(wizard);
            return true;
        } else if (url.length === 3) {
            self.active_mode(undefined);

            self.viewer.sub_type(url[1]);
            self.viewer.get_report(url[2], () => {
                self.active_mode('viewer');
            });

            return true;
        } else if (url.length === 4 && url[2] == 'rerun') {
            self.active_mode(undefined);

            let sub_type = url[1];

            let wizard = self.sub_type_wizard_map[sub_type];
            self.wizards[wizard].reset(sub_type);
            self.wizards[wizard].restore_from_previous(url[3], () => {
                self.active_mode(wizard);
            });

            return true;
        }

        return false;
    };

    /*********************************************************
     *           Initialize listeners                        *
     *********************************************************/

    self.when(
        self.start,
        self.wizards.multi_net_vehicle,
        self.wizards.single_net_fund,
        self.viewer,
    ).done(() => {
        Observer.register_hash_listener('data-reports', url => {
            return self.handle_url(url);
        });

        Observer.register(self.start.events.get('generate_report'), sub_type => {
            pager.navigate(`#!/data-reports/${sub_type}/`);
        });

        self.dfd.resolve();
    });

    return self;
}
