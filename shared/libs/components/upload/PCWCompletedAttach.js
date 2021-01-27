/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import pager from 'pager';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import * as Formatters from 'src/libs/Formatters';
import Observer from 'src/libs/Observer';

export default function(opts, components) {
    const self = new BaseComponent(opts, components);

    const _dfd = self.new_deferred();

    self.template = 'tpl_pcw_widget_complete';

    self.sheet = opts.sheet;
    self.name = self.sheet.name;

    self.is_index = self.sheet.data.entity_type === 'index';
    self.is_new_fund = false;
    self.view_in_analytics = function() {
        const url = Formatters.entity_analytics_url(self.sheet.data);
        if (url) {
            self.navigate(url);
        }
    };

    self.view_in_datamanager = function() {
        const url = Formatters.entity_edit_url(self.sheet.data);
        if (url) {
            self.navigate(url);
        }
    };

    self.navigate = function(url) {
        Observer.broadcast_for_id(self.get_id(), 'navigating', url);
        pager.navigate(url);
    };

    self.gen_message = function(data) {
        if (data.updated_funds !== undefined) {
            return `Successfully updated characteristics for ${data.updated_funds} funds in &quot;${data.name}&quot;`;
        } else if (data.attached_valuations !== undefined) {
            if (data.entity_type == 'user_fund') {
                return `Successfully added ${data.attached_valuations} valuations to companies in &quot;${data.name}&quot;`;
            }

            return `Successfully added ${data.attached_valuations} valuations to &quot;${data.name}&quot;`;
        } else if (data.updated_companies !== undefined) {
            return `Successfully updated characteristics for ${data.updated_companies} companies in &quot;${data.name}&quot;`;
        }
    };

    self.alerts = ko.computed(() => {
        let alerts = false;
        if (
            self.sheet &&
            self.sheet.data &&
            self.sheet.data.alerts &&
            self.sheet.data.alerts.length > 0
        ) {
            alerts = self.sheet.data.alerts;
        }

        if (!alerts || !alerts.length) {
            return false;
        }

        return {
            first: alerts[0],
            more: alerts.slice(1),
            moreCount: alerts.length - 1,
        };
    });

    self.message = self.gen_message(self.sheet.data);

    _dfd.resolve();

    return self;
}
