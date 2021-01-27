import ko from 'knockout';
import config from 'config';
import auth from 'auth';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import LocalStorage from 'src/libs/localstorage';

import $ from 'jquery';

const BISON_ANALYTICS_NAV = `
    <li data-bind="click: on_expand_sub_nav, css: { active: isCurrentPage(['company-analytics', 'fund-analytics', 'portfolio-analytics']) }">
        <a class="btn disabled" data-bind="css: { disabled: loading() }" data-toggle="collapse" href="#investments">
            <i class="icon-dollar"></i>
            <!-- ko if: !collapsed() -->Investments<!-- /ko -->
        </a>
    </li>
    <li data-bind="if: !collapsed()">
        <ul class="list-unstyled collapse sub-menu" id="investments" data-bind="css: { in: show_sub_nav(['company-analytics', 'fund-analytics', 'portfolio-analytics']) }">
            <li data-bind="css: { active: isCurrentPage(['company-analytics']) }">
                <a class="btn disabled" data-bind="page-href:'company-analytics', css: { disabled: loading() }, click: on_click_sub_nav_item" >
                    Companies
                </a>
            </li>
            <li data-bind="css: { active: isCurrentPage(['fund-analytics']) }">
                <a class="btn disabled" data-bind="page-href:'fund-analytics', css: { disabled: loading() }, click: on_click_sub_nav_item" >
                    Funds
                </a>
            </li>
            <li data-bind="css: { active: isCurrentPage(['portfolio-analytics']) }">
                <a class="btn disabled" data-bind="page-href:'portfolio-analytics', css: { disabled: loading() }, click: on_click_sub_nav_item" >
                    Portfolios
                </a>
            </li>
        </ul>
    </li>
`;

const BISON_REPORTING_NAV = `
    <li data-bind="click: on_expand_sub_nav, css: { active: isCurrentPage(['documents', 'reports', 'data-reports', 'report-menu', 'visual-reports']) }">
        <a class="btn disabled" data-bind="css: { disabled: loading() }" data-toggle="collapse" href="#reporting">
            <i class="icon-doc-text"></i>
            <!-- ko if: !collapsed() -->Reporting<!-- /ko -->
        </a>
    </li>
    <li data-bind="if: !collapsed()">
        <ul class="list-unstyled collapse sub-menu" id="reporting" data-bind="css: { in: show_sub_nav(['documents', 'reports', 'report-menu', 'data-reports', 'visual-reports']) }">
                <!-- ko if: has_features(['dashboards_beta']) -->
                <li data-bind="css: { active: isCurrentPage('documents') }">
                    <a class="btn disabled" name="dashboards" data-bind="page-href:'documents/browse', click: on_click_sub_nav_item, css: { disabled: loading() }">
                        <!-- ko if: !collapsed() -->Custom<!-- /ko -->
                    </a>
                </li>
                <!-- /ko -->
                <!-- ko if: has_features(['visual_reports', 'data_reports']) -->
                <li data-bind="css:{ active: isCurrentPage(['visual-reports', 'data-reports', 'reports', 'report-menu'])}, click: on_click_sub_nav_item">
                    <a class="btn disabled" data-bind="css: { disabled: loading() }, page-href:'reports'" name="reports" >
                        <!-- ko if: !collapsed() -->Templates<!-- /ko -->
                    </a>
                </li>
            <!-- /ko -->
        </ul>
   </li>
`;

const HL_DASHBOARD_NAV = `
    <!-- ko if: has_features(['dashboards_beta']) -->
        <li data-bind="css: { active: isCurrentPage('documents') }">
            <a class="btn disabled" name="dashboards" data-bind="page-href:'documents/browse', css: { disabled: loading() }">
                <i class="icon-gauge"></i>
                <!-- ko if: !collapsed() -->Dashboards<!-- /ko -->
            </a>
        </li>
    <!-- /ko -->
`;

const HL_REPORTING_NAV = `
    <!-- ko if: has_features(['visual_reports', 'data_reports']) -->
    <li data-bind="css:{ active: isCurrentPage(['visual-reports', 'data-reports', 'reports', 'report-menu'])}">
        <a class="btn disabled" data-bind="css: { disabled: loading() }, page-href:'reports'" name="reports" >
            <i class="icon-doc-text"></i>
            <!-- ko if: !collapsed() -->Reports<!-- /ko -->
        </a>
    </li>
    <!-- /ko -->
`;

const HL_ANALYTICS_NAV = `
    <li data-bind="click: on_expand_sub_nav, css: { active: isCurrentPage(['company-analytics', 'fund-analytics', 'portfolio-analytics']) }">
    <a class="btn disabled" data-bind="css: { disabled: loading() }, click: on_click_sub_nav_item" data-toggle="collapse" href="#investments">
        <i class="icon-dollar"></i>
        <!-- ko if: !collapsed() -->Investments<!-- /ko -->
    </a>
    </li>
    <li>
    <ul class="list-unstyled collapse sub-menu" id="investments" data-bind="css: { in: show_sub_nav(['company-analytics', 'fund-analytics', 'portfolio-analytics']) }">
        <li data-bind="css: { active: isCurrentPage(['portfolio-analytics']) }">
            <a class="btn disabled" data-bind="page-href:'portfolio-analytics', css: { disabled: loading() }" >
                Portfolios
            </a>
        </li>
        <li data-bind="css: { active: isCurrentPage(['fund-analytics']) }">
            <a class="btn disabled" data-bind="page-href:'fund-analytics', css: { disabled: loading() }" >
                Funds
            </a>
        </li>
        <!-- <li data-bind="css: { active: isCurrentPage(['company-analytics']) }">
            <a class="btn disabled" data-bind="page-href:'company-analytics', css: { disabled: loading() }" >
                Companies
            </a>
        </li> -->
    </ul>
    </li>
`;

// const CLIENT_NAME_HEADER = `
//     <div id="client-name-header" data-bind="click: toggle_collapsed">
//         <!-- ko if: !collapsed() -->
//         <div data-bind="text: client_name, attr: {title: client_name}"></div>
//         <!-- /ko -->
//         <!-- ko if: collapsed() -->
//             <i class="glyphicon glyphicon-chevron-right"></i>
//         <!-- /ko -->
//         <!-- ko if: !collapsed() -->
//             <i class="glyphicon glyphicon-chevron-left"></i>
//         <!-- /ko -->
//     </div>
// `;

const DEFAULT_TEMPLATE = `
    <section class="layout-aside" id="mainnav-wide" data-bind="css: {collapsed: collapsed}">
        <a data-bind="page-href:'${
            __DEPLOYMENT__ === 'hl' ? 'start' : 'fund-analytics'
        }', css: { disabled: loading() }">
            <img data-bind="attr: { src: logo_urls.horizontal, alt: platform_name }, style: logo_style" />
        </a>
        <ul>
            <!-- ko if: development_mode -->
            <li data-bind="css: { active: isCurrentPage('playground') }">
                <a class="btn disabled" name="playground, click: on_click_sub_nav_item" data-bind="page-href:'playground', css: { disabled: loading() }">
                    <i class="icon-gauge"></i>
                    <!-- ko if: !collapsed() -->React Playground<!-- /ko -->
                </a>
            </li>
            <!-- /ko -->
                ${__DEPLOYMENT__ == 'hl' ? HL_DASHBOARD_NAV : BISON_REPORTING_NAV}
            <!-- ko if: has_features(['analytics']) -->
                ${__DEPLOYMENT__ === 'hl' ? HL_ANALYTICS_NAV : BISON_ANALYTICS_NAV}
            <!-- /ko -->
            <!-- ko if: has_features(['diligence', 'view_market_data'], true) -->
            <li data-bind="click: on_expand_sub_nav, css: { active: isCurrentPage(['diligence', 'families', 'fund-in-family', 'provisional-fund']) }">
                <a class="btn disabled" data-bind="css: { disabled: loading() }, click: on_click_sub_nav_item" data-toggle="collapse" href="#main-diligence">
                    <i class="icon-chart-pie"></i>
                    <!-- ko if: !collapsed() -->Diligence<!-- /ko -->
                </a>
            </li>
            <li data-bind="if: !collapsed()">
                <ul class="list-unstyled collapse sub-menu" id="main-diligence" data-bind="css: { in: show_sub_nav(['diligence', 'families', 'fund-in-family', 'provisional-fund']) }">
                    <li data-bind="css: { active: isCurrentPage(['diligence', 'provisional-fund'])}">
                        <a class="btn disabled" name="diligence" data-bind="page-href:'diligence', css: { disabled: loading() }, click: on_click_sub_nav_item">
                            Projects
                        </a>
                    </li>
                    <!-- ko if: has_features(['view_families']) -->
                        <li data-bind="css: { active: isCurrentPage(['families'])}">
                            <a class="btn disabled" name="families" data-bind="page-href:'families', css: { disabled: loading() }, click: on_click_sub_nav_item">
                                Browse Funds
                            </a>
                        </li>
                    <!-- /ko -->
                </ul>
            </li>
            <!-- /ko -->
            ${__DEPLOYMENT__ == 'hl' ? HL_REPORTING_NAV : ''}
            <!-- ko if: has_features(['view_benchmarks']) -->
            <li data-bind="css:{ active: isCurrentPage('benchmark')}">
                <a class="btn disabled" name="benchmark" data-bind="page-href:'benchmark/fund_level_benchmark:browse', css: { disabled: loading() }, click: on_click_sub_nav_item">
                    <i class="icon-chart-bar"></i>
                    <!-- ko if: !collapsed() -->Benchmark<!-- /ko -->
                </a>
            </li>
            <!-- /ko -->
            <!-- ko if: has_features(['view_benchmarks']) -->
            <li data-bind="css:{ active: isCurrentPage('risk-return')}">
                <a class="btn disabled" name="risk-return" data-bind="page-href:'risk-return', css: { disabled: loading() }, click: on_click_sub_nav_item">
                    <i class="icon-beaker"></i>
                    <!-- ko if: !collapsed() -->Risk / Return<!-- /ko -->
                </a>
            </li>
            <!-- /ko -->
            <!-- ko if: has_portal_analytics -->
                <li data-bind="css: { active: isCurrentPage(['reporting-analytics']) }">
                    <a class="btn disabled" name="reporting-analytics" data-bind="page-href:'reporting-analytics', css: { disabled: loading() }, click: on_click_sub_nav_item" >
                    <i class="icon-dollar"></i>
                    <!-- ko if: !collapsed() -->Analytics<!-- /ko -->
                    </a>
                </li>
            <!-- /ko -->
            <!-- ko if: has_features(['data_collection']) -->
                <li data-bind="click: on_expand_sub_nav, css: { active: isCurrentPage(['reporting-relationships', 'reporting-activity', 'reporting-templates', 'reporting-mandates', 'reporting-emails']) }">
                    <a class="btn disabled" data-bind="css: { disabled: loading() }, click: on_click_sub_nav_item" data-toggle="collapse" href="#data-collection">
                        <i class="icon-layout"></i>
                        <!-- ko if: !collapsed() -->Data Collection<!-- /ko -->
                    </a>
                </li>
                <li data-bind="if: !collapsed()">
                    <ul class="list-unstyled collapse sub-menu" id="data-collection" data-bind="css: { in: show_sub_nav(['reporting-relationships', 'reporting-activity', 'reporting-templates', 'reporting-mandates', 'reporting-mandates', 'reporting-emails']) }">
                        <li ko if: data-bind="css: { active: isCurrentPage(['reporting-relationships']) }">
                            <a class="btn disabled" name="reporting-relationships" data-bind="page-href:'reporting-relationships', click: on_click_sub_nav_item, css: { disabled: loading() }, text: my_companies_label" >
                            </a>
                        </li>
                        <li data-bind="css: { active: isCurrentPage(['reporting-activity']) }">
                            <a class="btn disabled" name="reporting-activity" data-bind="page-href:'reporting-activity', click: on_click_sub_nav_item, css: { disabled: loading() }" >
                                Activity
                            </a>
                        </li>
                        <li data-bind="css: { active: isCurrentPage(['reporting-templates']) }">
                            <a class="btn disabled" name="reporting-templates" data-bind="page-href:'reporting-templates', click: on_click_sub_nav_item, css: { disabled: loading() }" >
                                Data Templates
                            </a>
                        </li>
                        <li data-bind="css: { active: isCurrentPage(['reporting-emails']) }">
                            <a class="btn disabled" name="reporting-emails" data-bind="page-href:'reporting-emails', click: on_click_sub_nav_item, css: { disabled: loading() }" >
                                Email Center
                            </a>
                        </li>
                        <li data-bind="css: { active: isCurrentPage(['reporting-mandates']) }">
                            <a class="btn disabled" name="reporting-mandates" data-bind="page-href:'reporting-mandates', click: on_click_sub_nav_item, css: { disabled: loading() }" >
                                Data Requests
                            </a>
                        </li>
                    </ul>
                </li>
            <!-- /ko -->
            <!-- ko if: has_features(['market_analysis_access']) -->
            <li data-bind="css:{ active: isCurrentPage('market-analysis')}">
                <a class="btn disabled" name="market-analysis" data-bind="page-href:'market-analysis', css: { disabled: loading() }, click: on_click_sub_nav_item">
                    <i class='icon-chart-area'></i>
                    <!-- ko if: !collapsed() -->Market Analysis<!-- /ko -->
                </a>
            </li>
            <!-- /ko -->
            <!-- ko if: has_features(['search_market_data']) -->
                <li data-bind="click: on_expand_sub_nav, css: { active: isCurrentPage(['firms', 'funds', 'funds-in-market', 'investors', 'investments', 'fund', 'firm', 'investor']) }">
                    <a class="btn disabled" data-bind="css: { disabled: loading() }, click: on_click_sub_nav_item" data-toggle="collapse" href="#market-insights">
                        <i name="market-insights" class="icon-sitemap"></i>
                        <!-- ko if: !collapsed() -->Market Data<!-- /ko -->
                    </a>
                </li>
                <li data-bind="if: !collapsed()">
                    <ul class="list-unstyled collapse sub-menu" id="market-insights" data-bind="css: { in: show_sub_nav(['firms', 'funds', 'funds-in-market', 'investors', 'investments', 'fund', 'firm', 'investor']) }">
                        <li data-bind="css: { active: isCurrentPage(['firms', 'firm']) }">
                            <a class="btn disabled" name="firms" data-bind="page-href:'firms', click: on_click_sub_nav_item, css: { disabled: loading() }" >
                                Firms
                            </a>
                        </li>
                        <li data-bind="css: { active: isCurrentPage(['funds', 'fund'])}">
                            <a class="btn disabled" name="funds" data-bind="page-href:'funds', click: on_click_sub_nav_item, css: { disabled: loading() }">
                                Historic Funds
                            </a>
                        </li>
                        <li data-bind="css: { active: isCurrentPage(['funds-in-market'])}">
                            <a class="btn disabled" name="funds-in-market" data-bind="page-href:'funds-in-market', click: on_click_sub_nav_item, css: { disabled: loading() }">
                                Funds in Market
                            </a>
                        </li>
                        <li data-bind="css:{ active: isCurrentPage(['investors', 'investor'])}">
                            <a class="btn disabled" name="investors" data-bind="page-href:'investors', click: on_click_sub_nav_item, css: { disabled: loading() }">
                                Investors
                            </a>
                        </li>
                        <li data-bind="css:{ active: isCurrentPage('investments')}">
                            <a class="btn disabled" name="investments" data-bind="page-href:'investments', click: on_click_sub_nav_item, css: { disabled: loading() }">
                                Investments
                            </a>
                        </li>
                    </ul>
                </li>
            <!-- /ko -->
            <!-- ko if: has_features(['view_market_data']) -->
            <li data-bind="css: { active: isCurrentPage('lists') }">
                <a class="btn disabled" name="lists" data-bind="page-href:'lists', css: { disabled: loading() }, click: on_click_sub_nav_item">
                    <i class="icon-th-list"></i>
                    <!-- ko if: !collapsed() -->Lists<!-- /ko -->
                </a>
            </li>
            <!-- /ko -->
            <!-- ko if: has_features(['data_manager'])-->
            <li data-bind="css:{ active: isCurrentPage('data-manager')}">
                <a class="btn disabled" data-bind="page-href:'data-manager', css: { disabled: loading() }, click: on_click_sub_nav_item">
                    <i class="icon-upload"></i>
                    <!-- ko if: !collapsed() -->My Data<!-- /ko -->
                </a>
            </li>
            <!-- /ko -->
            <li data-bind="css: { active: isCurrentPage(['account']) }">
                <a class="btn disabled" name="account" data-bind="page-href:'account', css: { disabled: loading() }, click: on_click_sub_nav_item">
                    <i class="icon-user"></i>
                    <!-- ko if: !collapsed() -->Account<!-- /ko -->
                </a>
            </li>
        </ul>
    </section>
`;

export default class MainNav extends BaseComponent {
    constructor(opts = {}, components = {}) {
        super({...opts, get_user: true}, components);

        this.logo_urls = config.logo_urls;
        this.platform_name = config.lang.platform_name;
        this.logo_style = config.app_logo_style || {};
        this.development_mode = opts.development_mode;

        let _dfd = this.new_deferred();

        this.define_template('default', DEFAULT_TEMPLATE);

        this.has_features = (features, require_all) =>
            ko.pureComputed(() => {
                if (require_all) {
                    return features.every(this.user_has_feature.bind(this));
                }
                return features.some(this.user_has_feature.bind(this));
            });

        this.has_portal_analytics = ko.pureComputed(() => {
            return this.user_has_feature('data_collection') && !this.user_has_feature('analytics');
        });

        this.my_companies_label = ko.pureComputed(() => {
            if (this.user_has_feature('data_collection_internal')) {
                return 'My Companies';
            }
            return 'My Portals';
        });

        this.temporarily_expanded = ko.observable(false);

        const default_collapsed = false; // LocalStorage.get('MainNav.collapsed');
        this._collapsed = ko.observable(default_collapsed);

        this.collapsed = ko.pureComputed(() => {
            return this._collapsed() && !this.temporarily_expanded();
        });

        this.on_expand_sub_nav = () => {
            if (this._collapsed()) {
                this.temporarily_expanded(true);
            }

            return true;
        };

        this.close_sub_navs = () => {
            $('.collapse').collapse('hide');
            $('#investments').collapse('hide');
            $('#reporting').collapse('hide');
            $('#investments').collapse('hide');
            $('#mainnav-wide').collapse('hide');
            $('#main-diligence').collapse('hide');
            $('#data-collection').collapse('hide');
            $('#market-insights').collapse('hide');
        };

        this.on_click_sub_nav_item = () => {
            if (this.temporarily_expanded()) {
                this.temporarily_expanded(false);
            }

            return true;
        };

        this.toggle_collapsed = () => {
            this._collapsed(!this.collapsed());
            this.temporarily_expanded(false);

            LocalStorage.set('MainNav.collapsed', this.collapsed());
        };

        this.show_sub_nav = page_array => {
            if (this.temporarily_expanded()) {
                return false;
            }

            return isCurrentPage(page_array); // eslint-disable-line no-undef
        };

        this.client_name = ko.pureComputed(() => auth.client().name);

        _dfd.resolve();
    }

    sign_out() {
        auth.sign_out();
    }
}
