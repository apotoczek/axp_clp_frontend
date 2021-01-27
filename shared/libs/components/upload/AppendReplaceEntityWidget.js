/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import * as Formatters from 'src/libs/Formatters';
import Observer from 'src/libs/Observer';
import * as Utils from 'src/libs/Utils';
import DataThing from 'src/libs/DataThing';
import 'src/libs/bindings/typeahead';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    self.template = 'tpl_widget_append_replace_entity';
    self.sheet = opts.sheet;

    self.prompt_text = opts.prompt || 'Please select something to replace';
    self.loading = ko.observable(false);
    self.selected_entity = ko.observable();

    self.selected_entity_name = ko.computed(() => {
        return self.selected_entity() ? self.selected_entity().name : '';
    });
    self.placeholder = ko.computed(() => {
        return self.selected_entity()
            ? self.selected_entity().name
            : 'Search for entity to replace';
    });

    if (opts.entity_type === 'index') {
        self.typeahead_options = {
            minLength: 1,
            datasets: {
                source: function(query, callback) {
                    DataThing.get({
                        params: {
                            target: 'user:indexes',
                            exclude_open_indexes: true,
                            filters: {
                                name: query,
                                permissions: ['write', 'share'],
                            },
                            results_per_page: 5,
                            order_by: [{name: 'name_startswith', sort: 'asc'}],
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
            on_select: function(event, index) {
                self.selected_entity(index);
            },
        };
    } else {
        let entity_type_formatter = Formatters.gen_formatter('entity_type');

        self.typeahead_options = {
            minLength: 1,
            datasets: {
                source: function(query, callback) {
                    DataThing.get({
                        params: {
                            target: 'vehicles',
                            filters: {
                                name: query,
                                entity_type: opts.entity_type,
                                cashflow_type: opts.cashflow_type,
                                exclude_portfolio_only: true,
                                exclude_package_content: true,
                                permissions: ['write', 'share'],
                            },
                            results_per_page: 5,
                            order_by: [{name: 'name_startswith', sort: 'asc'}],
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
                        return (
                            `<strong>${data.name}</strong> ` +
                            `<span>${entity_type_formatter(opts.entity_type)}</span>`
                        );
                    },
                },
            },
            on_select: function(event, vehicle) {
                self.selected_entity(vehicle);
            },
        };
    }

    self.get_data_from_selected = function(selected) {
        if (opts.entity_type === 'index') {
            return selected.id;
        }

        return Utils.get_vehicle_uid(selected);
    };

    self.finish = function() {
        let selected_entity = self.selected_entity();

        if (selected_entity) {
            self.loading(true);
            let data = {
                data: self.get_data_from_selected(selected_entity),
                identifier: opts.sheet.identifier,
                action: opts.sheet.required_action,
            };

            Observer.broadcast_for_id(self.get_id(), 'resolve_spreadsheet_action', data);
        } else {
            return;
        }
    };

    return self;
}
