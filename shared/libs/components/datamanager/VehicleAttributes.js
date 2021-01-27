/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import $ from 'jquery';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import Observer from 'src/libs/Observer';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    opts = opts || {};

    self.broadcast_id = opts.broadcast_id;

    self.template = opts.template || 'tpl_data_manager_characteristics';

    self.dfd = $.Deferred();
    self.dfds.push(self.dfd);

    self.vehicle_uid_event = opts.vehicle_uid_event || {};
    self.vehicle_uid = ko.observable();

    self.save_data = function() {};

    self.views = [];

    $.when($.when(...self.geography.dfds)).done(() => {
        Observer.register(self.vehicle_uid_event, uid => {
            self.vehicle_uid(uid);
        });

        self.dfd.resolve();
    });

    return self;
}
