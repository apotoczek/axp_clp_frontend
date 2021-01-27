/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import TotalValueChart from 'src/libs/components/charts/TotalValueChart';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    let _dfd = self.new_deferred();

    self.define_default_template(`
            <div class="big-message" data-bind="visible: loading">
                <span class="glyphicon glyphicon-cog animate-spin"></span>
                <h1>Loading..</h1>
            </div>
            <!-- ko if: !loading() && error() && error_template() -->
                <!-- ko template: error_template --><!-- /ko -->
            <!-- /ko -->
            <!-- ko if: !loading() && !error() -->
            <div data-bind="attr: { id: html_id() }">
                <div class="component-box">
                    <h2>Total Value Curve</h2>
                    <p class="lead text-halfmuted">The total value curve illustrates what proportion each group represents as a percentage of the fund&apos;s total value.</p>
                    <!-- ko if: has_data -->
                        <!-- ko renderComponent: chart --><!--/ko -->
                    <!-- /ko -->
                    <!-- ko ifnot: has_data -->
                        <div style="margin-top:50px;" class="big-message">
                            <span class="glyphicon glyphicon-exclamation-sign"></span>
                            <h1>No data for this grouping</h1>
                            <p class="lead">
                                Try a different grouping or update your data
                                to view the Total Value Curve.
                            </p>
                        </div>
                    <!-- /ko -->
                </div>
            </div>
            <!-- /ko -->
        `);

    self.has_data = ko.pureComputed(() => {
        const data = self.data();

        if (data && data.categories && data.categories.length) {
            return true;
        }

        return false;
    });

    self.chart = self.new_instance(TotalValueChart, {
        id: 'chart',
        cashflow_chart_template: 'tpl_chart',
        format: 'percent',
        exporting: true,
        chart_height: 600,
        data: self.data,
    });

    self.when(self.chart).done(() => {
        _dfd.resolve();
    });

    return self;
}
