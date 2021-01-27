/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import pager from 'pager';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import * as Formatters from 'src/libs/Formatters';
import Observer from 'src/libs/Observer';
import DataThing from 'src/libs/DataThing';
import auth from 'auth';
import 'src/libs/bindings/typeahead';

export default function(opts, components) {
    const self = new BaseComponent(opts, components);

    const _dfd = self.new_deferred();

    self.template = 'tpl_pcw_widget_complete';
    self.sheet = opts.sheet;
    self.name = self.sheet.name;
    self.is_new_fund = false;

    self.is_index = self.sheet.data.entity_type === 'index';

    if (auth.user_has_feature('diligence')) {
        self.is_new_fund = true;
    }

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
    self.selected_entity = ko.observable();

    self.selected_entity_uid = ko.computed(() => {
        return self.selected_entity() ? self.selected_entity().uid : '';
    });

    self.typeahead_options = {
        minLength: 1,
        datasets: {
            source: function(query, callback) {
                DataThing.get({
                    params: {
                        target: 'diligence_list',
                        results_per_page: 5,
                    },
                    success: function(data) {
                        if (data.results) {
                            callback(data.results);
                        }
                    },
                    error: function() {},
                });
            },
            templates: {
                suggestion: function(data) {
                    return `<strong>${data.name}</strong>`;
                },
            },
        },
        on_select: function(event, vehicle) {
            self.selected_entity(vehicle);
        },
    };

    self.placeholder = ko.computed(() => {
        const default_placeholder = 'Search for diligence project to attach fund to';
        return self.selected_entity()
            ? self.selected_entity().name
            : default_placeholder.titleize();
    });

    self.navigate = function(url) {
        Observer.broadcast_for_id(self.get_id(), 'navigating', url);
        pager.navigate(url);
    };

    self.gen_message = function(data) {
        switch (data.entity_type) {
            case 'user_fund':
                return `Successfully created ${data.cashflow_type} cash flow fund &quot;${data.name}&quot;`;
            case 'portfolio':
                return `Successfully created ${data.cashflow_type} cash flow portfolio &quot;${data.name}&quot;`;
            case 'index':
                return `Successfully created index &quot;${data.name}&quot;`;
        }
    };

    self.new_fund_data = ko.computed(() => {
        if (self.sheet.data) {
            return [self.sheet.data.user_fund_uid];
        }
    });

    self.attach_suggestion =
        'If you would like to attach this fund to an existing diligence project, search for the project below';

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
    self._attach_funds_to_diligence = DataThing.backends.useractionhandler({
        url: 'attach_funds_to_diligence',
    });

    self.attach_funds_to_diligence = function() {
        if (self.selected_entity()) {
            const data = {
                user_fund_uids: self.new_fund_data(),
                project_uid: self.selected_entity_uid(),
            };
            self._attach_funds_to_diligence({
                data: {
                    user_fund_uids: self.new_fund_data(),
                    project_uid: self.selected_entity_uid(),
                },
                success: DataThing.api.XHRSuccess(() => {
                    self.selected_entity('');
                }),
            });
            Observer.broadcast_for_id(self.get_id(), 'attach_funds_to_diligence', data);
        }
    };

    self.message = self.gen_message(self.sheet.data);

    _dfd.resolve();

    return self;
}
