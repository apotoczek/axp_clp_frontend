import ko from 'knockout';
import auth from 'auth';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import DataSource from 'src/libs/DataSource';

class ReportMenu extends BaseComponent {
    constructor(opts = {}, components = {}) {
        super(opts, components);

        // taken from ReportStart
        this.define_default_template(`
            <div class="full-body new-report-menu">
                <!-- ko if: visual_reports -->
                    <h2>Visual Reports</h2>
                    <div data-bind="foreach: visual_reports">
                        <a class="link-card" data-bind="attr: {href: link_url}">
                            <h3 data-bind="text:name"></h3>
                            <p class="description" data-bind="text:description"></p>
                            <!-- ko if: (features.length > 0) -->
                            <ul>
                                <!-- ko foreach: features --><li data-bind="text:$data"></li><!-- /ko -->
                            </ul>
                            <!-- /ko -->
                        </a>
                    </div>
                <!-- /ko -->
                <!-- ko if: data_reports -->
                    <h2>Data Reports</h2>
                    <div data-bind="foreach: data_reports">
                        <a class="link-card" data-bind="attr: {href:'#!/data-reports/'+id}">
                            <h3 data-bind="text:name"></h3>
                            <p class="description" data-bind="text:description"></p>
                        </a>
                    </div>
                <!-- /ko -->
            </div>
        `);

        /*********************************************************
         *                    Variables                          *
         *********************************************************/

        this.dfd = this.new_deferred();

        /*********************************************************
         *               Visual Reports                          *
         *********************************************************/

        this.visual_reports = [
            {
                id: 'lp_update',
                link_url: '#!/visual-reports/lp_update',
                enabled: true,
                name: 'Performance Dashboard',
                description:
                    "A customizable snapshot view of your fund's performance at any point in time",
                preview_img: require('src/img/monitor_performance_dashboard.png'),
                features: [
                    'Net Performance Overview',
                    'PME',
                    'Point in Time',
                    'Peer Benchmark',
                    'Peer Side by Side',
                    'Momentum Analysis',
                ],
            },
            {
                id: 'deal_report',
                link_url: '#!/visual-reports/deal_report',
                enabled: true,
                name: 'Deal Intelligence Report',
                description:
                    "Powerful portfolio insights into your fund's performance on a deal-by-deal basis.",
                preview_img: require('src/img/monitor_deal_report.png'),
                features: [
                    'Gross Performance Overview',
                    'Deal Analysis',
                    'Operational Performance',
                    'Valuation Bridge',
                    'Risk Analysis',
                ],
            },
        ];

        if (auth.user_has_feature('portfolio_update_report')) {
            this.visual_reports.push({
                id: 'portfolio_update',
                link_url: '#!/visual-reports/portfolio_update',
                enabled: true,
                name: 'Portfolio Update',
                description:
                    'The Portfolio Update Report provides a detailed, data-driven update on all your portfolio companies.',
                features: ['Fund Overview', 'Portfolio Details', 'Company Details'],
            });
        }

        if (auth.user_has_feature('hl_portfolio_report')) {
            this.visual_reports.push({
                id: 'hl_portfolio_report',
                link_url: '#!/visual-reports/hl_portfolio_report',
                enabled: true,
                name: 'Portfolio Review Report',
                description: 'Portfolio-level report with fund-level analytics.',
                features: [
                    'Portfolio Overview',
                    'NAV Breakdown',
                    'Fund Details',
                    'Trailing Performance',
                ],
            });
        }

        if (auth.user_has_feature('data_admin')) {
            this.visual_reports.push({
                id: 'fbr',
                link_url: '#!/visual-reports/fbr',
                enabled: true,
                name: 'FBR',
                description: 'Fund Benchmark Report',
                preview_img: require('src/img/Monitor_LP_update.png'),
                features: [
                    'Fund Overview',
                    'Benchmarking',
                    'Value Growth',
                    'Peer Tracking',
                    'Fund Management',
                    'Risk Exposure',
                ],
            });
        }

        if (auth.user_has_feature('fund_screening_report')) {
            this.visual_reports.push({
                id: 'fund_screening',
                link_url: '#!/visual-reports/fund_screening',
                enabled: true,
                name: 'Fund Screening Report',
                description: 'Fund Screening Report',
                preview_img: require('src/img/Monitor_LP_update.png'),
                features: [
                    'Fund Overview',
                    'Benchmarking',
                    'Value Growth',
                    'Peer Tracking',
                    'Fund Management',
                ],
            });
        }

        if (auth.user_has_feature('fund_modeler')) {
            this.visual_reports.push({
                id: 'lp_insider',
                link_url: '#!/wizard/lp-insider',
                enabled: true,
                name: 'LP Report',
                description:
                    "Model your funds inside an LP's portfolio to see portfolio performance compared to your funds.",
                features: [
                    'Recent Performance',
                    'Recent Commitments',
                    'Core Relationships',
                    'Retention',
                    'Forward Calendar',
                    'Alpha Driver Analysis',
                ],
            });
            this.visual_reports.push({
                id: 'peer_report',
                link_url: '#!/wizard/peer-report',
                enabled: true,
                name: 'Peer Report',
                description:
                    'A custom, side by side review of your fund against a key competitor of your choice.',
                features: [
                    'Trend Analysis',
                    'IRR J-curve',
                    'Horizon Analysis',
                    'Cash Flow J-Curve',
                    'Absolute Returns',
                    'Remaining Value Trend',
                ],
            });
        }

        /*********************************************************
         *                 Data Reports                          *
         *********************************************************/

        this.data_reports = this.new_instance(DataSource, {
            id: 'report_template_selector',
            datasource: {
                type: 'dynamic',
                query: {
                    target: 'data_report_templates',
                },
            },
        });

        this.initializing = ko.observable(false);

        this.when(this.data_reports).done(() => {
            this.dfd.resolve();
        });
    }
}

export default ReportMenu;
