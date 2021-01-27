/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import NotificationWidget from 'src/libs/components/dashboard/NotificationWidget';
import DataSource from 'src/libs/DataSource';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);
    self.dfd = self.new_deferred();
    self.template = opts.template || 'tpl_notification_area';

    //       {
    //   "can_dismiss": true,
    //   "classification": 2,
    //   "classification_str": "CONTACT_US",
    //   "client_uid": "0655c66a-9456-4651-946e-aff827147ea6",
    //   "created": 1494873583,
    //   "data": null,
    //   "dismissed": false,
    //   "expiry": 1495478383,
    //   "modified": 1494873583,
    //   "title": "Higher Trimmers Sure Residents Mall Iffy Get Commentary Sure Blart",
    //   "uid": "2938d3d4-1651-482c-b114-de1cb61c2718",
    //   "user_specific": true,
    //   "user_uid": null
    // },
    // {
    //   "can_dismiss": true,
    //   "classification": 3,
    //   "classification_str": "MISSING_DATA",
    //   "client_uid": "0655c66a-9456-4651-946e-aff827147ea6",
    //   "created": 1494873583,
    //   "data": null,
    //   "dismissed": false,
    //   "expiry": 1495478383,
    //   "modified": 1494873583,
    //   "title": "So Giants Opportunity Residents Provides Mall Get",
    //   "uid": "3c5a9f5c-ec18-47c9-a131-a01eb54144bb",
    //   "user_specific": true

    self.get_template = function(key) {
        switch (key) {
            case 'CONTACT_US':
                return 'tpl_dashboard_notification_contact_us';
            case 'MISSING_DATA':
                return 'tpl_dashboard_notification_add_data';
        }
    };

    self.init_widget = function(opts) {
        return self.new_instance(NotificationWidget, {
            template: self.get_template(opts.classification_str),
            data: opts,
        });
    };

    self.recent_notitifications = self.new_instance(DataSource, {
        datasource: {
            type: 'dynamic',
            query: {
                target: 'landing_notifications_for_user',
            },
        },
    });

    self.widgets = ko.pureComputed(() => {
        let res = self.recent_notitifications.data();

        if (res) {
            return res.map(self.init_widget);
        }

        return [];
    });

    self.dfd.resolve();

    return self;
}
