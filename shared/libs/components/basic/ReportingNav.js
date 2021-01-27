import ko from 'knockout';
import config from 'config';
import auth from 'auth';
import BaseComponent from 'src/libs/components/basic/BaseComponent';

import Observer from 'src/libs/Observer';

const DEFAULT_TEMPLATE = `
    <section class="layout-aside" id="mainnav-wide" data-bind="css: {collapsed: collapsed}">
        <a data-bind="page-href:'reporting-dashboard', css: { disabled: loading() }">
            <img data-bind="attr: { src: logo_urls.horizontal, alt: platform_name }" />
        </a>
        <ul>
            <li data-bind="css: { active: isCurrentPage(['reporting-dashboard']) }">
                <a class="btn disabled" name="data_collection_pc" data-bind="page-href:'reporting-dashboard', css: { disabled: loading() }">
                    <i class="icon-doc-text"></i>Reporting
                </a>
            </li>
            <!-- ko if: showDashboards -->
            <li data-bind="css: { active: isCurrentPage('documents') }">
                <a class="btn disabled" name="documents" data-bind="page-href:'documents/browse', css: { disabled: loading() }">
                    <i class="icon-gauge"></i>
                    <!-- ko if: !collapsed() -->Dashboards<!-- /ko -->
                </a>
            </li>
            <!-- /ko -->
            <li data-bind="css: { active: isCurrentPage(['reporting-analytics']) }">
                <a class="btn disabled" name="analytics" data-bind="page-href:'reporting-analytics', css: { disabled: loading() }">
                    <i class="icon-chart-bar"></i>Analytics
                </a>
            </li>
            <li data-bind="css: { active: isCurrentPage(['account']) }">
                <a class="btn disabled" name="account" data-bind="page-href:'account/settings', css: { disabled: loading() }">
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

        let _dfd = this.new_deferred();

        this.define_template('default', DEFAULT_TEMPLATE);

        this.showDashboards = ko.pureComputed(() => this.user_has_feature('dashboards_beta'));

        this.collapsed = Observer.observable('MainNav.set_collapsed', false);
        this.on_expand_sub_nav = () => {
            // NOTE This won't work if we have more than one collapsible item
            // in the main nav. But it works fine for now.
            // this.collapsed(!this.collapsed());
        };

        _dfd.resolve();
    }

    sign_out() {
        auth.sign_out();
    }
}
