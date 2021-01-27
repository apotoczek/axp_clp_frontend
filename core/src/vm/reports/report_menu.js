/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ActionButton from 'src/libs/components/basic/ActionButton';
import ActionHeader from 'src/libs/components/basic/ActionHeader';
import ReportMenu from 'src/libs/components/reports/ReportMenu';
import Breadcrumb from 'src/libs/components/basic/Breadcrumb';
import Context from 'src/libs/Context';
import BreadcrumbHeader from 'src/libs/components/basic/BreadcrumbHeader';
import Aside from 'src/libs/components/basic/Aside';

export default function() {
    let self = new Context({
        id: 'report-menu',
    });

    self.dfd = self.new_deferred();

    let breadcrumb = {
        id: 'breadcrumb',
        component: Breadcrumb,
        items: [
            {
                label: 'Reports',
                link: '#!/reports',
            },
            {
                label: 'New Report',
            },
        ],
    };

    let header = {
        component: BreadcrumbHeader,
        id: 'header',
        template: 'tpl_breadcrumb_header',
        css: {'full-width-page-header': true},
        buttons: [],
        layout: {
            breadcrumb: 'breadcrumb',
        },
        components: [breadcrumb],
    };

    let body = {
        id: 'body',
        component: ReportMenu,
    };

    self.page_wrapper = self.new_instance(Aside, {
        id: 'page_wrapper',
        // LOOK INTO: use 'tpl_body' as template so only content scrolls
        template: 'tpl_report_menu_wrapper',
        layout: {
            header: 'header',
            toolbar: 'action_toolbar',
            body: 'body',
        },
        components: [
            header,
            {
                component: ActionHeader,
                id: 'action_toolbar',
                template: 'tpl_action_toolbar',
                disable_export: true,
                buttons: [
                    {
                        id: 'report_archive',
                        component: ActionButton,
                        label:
                            '<span class="glyphicon glyphicon-folder-open"></span>&nbsp; &nbsp; Back to Report Archive',
                        css: {
                            'report-archive-link': true,
                        },
                        trigger_url: {url: 'reports'},
                    },
                ],
            },
            body,
        ],
    });

    self.when(self.page_wrapper).done(() => {
        self.dfd.resolve();
    });

    return self;
}
