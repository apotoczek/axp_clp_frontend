/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import PortfolioUpdateCompanyDetailsPage from 'src/libs/components/reports/visual_reports/portfolio_update/PortfolioUpdateCompanyDetailsPage';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    self.define_template(`
            <!-- ko foreach: pages -->
                <!-- ko renderComponent: $data --><!-- /ko -->
            <!-- /ko -->
        `);

    self.operating_metrics = opts.operating_metrics;

    self.loading(true);

    self.pages = ko.computed(() => {
        let data = self.data();

        if (data && data.vehicle_overview && data.operating_metrics) {
            let pages_arr = [];
            let deals = data.vehicle_overview.companies;
            let operating_metrics_arr = data.operating_metrics.companies;

            for (let idx = 0; idx < deals.length; idx++) {
                let deal = deals[idx];
                deal.operating_metrics = operating_metrics_arr[deal.company_uid];

                let page = new PortfolioUpdateCompanyDetailsPage({
                    data: deal,
                });
                self.when(page).done(() => {
                    pages_arr.push(page);
                });
            }
            self.loading(false);
            return pages_arr;
        }
    });

    return self;
}
