/* Automatically transformed from AMD to ES6. Beware of code smell. */

import ActivityArea from 'src/libs/components/dashboard/ActivityArea';
import HTMLContent from 'src/libs/components/basic/HTMLContent';
import NotificationArea from 'src/libs/components/dashboard/NotificationArea';
import BreadcrumbHeader from 'src/libs/components/basic/BreadcrumbHeader';
import Breadcrumb from 'src/libs/components/basic/Breadcrumb';
import ko from 'knockout';
import Context from 'src/libs/Context';
import EventRegistry from 'src/libs/components/basic/EventRegistry';
import Aside from 'src/libs/components/basic/Aside';

export default function() {
    let self = new Context({
        id: 'dashboard',
    });

    self.dfd = self.new_deferred();

    self.events = self.new_instance(EventRegistry, {});

    // note, main parts: dashboard notifications, activity widgets, dashboard leaderboard

    self.activity_widgets = ko.observable();

    let breadcrumb = {
        id: 'breadcrumb',
        component: Breadcrumb,
        items: [
            {
                label: 'Welcome',
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

    // notifications: "add data" & "contact us" ribbons
    let notification_area = {
        id: 'notification_area',
        component: NotificationArea,
        data: [
            {
                notification_type: 'add_data',
                description: 'Missing NAVs for your Cobalt GP IV net fund',
            },
            {
                notification_type: 'contact_us',
                description: 'Continue your onboarding with Customer Success',
            },
        ],
    };

    let body_content = {
        id: 'body_content',
        template: 'tpl_aside_body',
        component: Aside,
        layout: {
            body: ['notification_area', 'dashboard_label', 'activity_area'],
        },
        components: [
            notification_area,
            {
                id: 'dashboard_label',
                component: HTMLContent,
                html: '<h2>My Dashboard</h2>',
            },
            {
                id: 'activity_area',
                component: ActivityArea,
            },
        ],
    };

    let body = self.new_instance(Aside, {
        id: 'body',
        template: 'tpl_dashboard_body',
        layout: {
            header: 'header',
            notification_area: 'notification_area',
            body: ['body_content'],
        },
        components: [header, notification_area, body_content],
    });

    self.page_wrapper = self.new_instance(Aside, {
        id: 'page_wrapper',
        template: 'tpl_asides',
        // asides: [body, side_panel]
        asides: [body],
    });

    // self.handle_url = function(url) {
    //     if(url) {
    //         // console.log(url);
    //     }
    // };

    // self.when(self.page_wrapper, side_panel, body).done(() => {
    self.when(self.page_wrapper, body).done(() => {
        // Observer.register_hash_listener('dashboard', function(url) {
        //     return self.handle_url(url);
        // });

        self.dfd.resolve();
    });

    return self;
}
