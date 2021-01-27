/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import DataThing from 'src/libs/DataThing';
import 'src/libs/bindings/typeahead';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    self.define_template(`
        <div class="form-group popover-entity-search" data-bind="event_horizon:true">
            <input type="text" class="form-control input-sm" data-bind="
            typeahead:typeahead_options,
            attr: {
            placeholder: placeholder
            }
            ">
            <ul class="force-scrollable-y selected-entities" data-bind="foreach:entities">
                <li class="btn btn-cpanel-ghost btn-block btn-xs clearfix" data-bind="click:$parent.remove_entity"><span data-bind="text:name" class="btn-label name pull-left"></span><span class="btn-icon pull-right glyphicon glyphicon-remove text-default"></span></li>
            </ul>
            <div class="hr hr-padded"></div>
            <button type="button" class="btn btn-block btn-sm btn-default close-popover">Done</button>
            <button type="button" class="btn btn-block btn-sm btn-cpanel-ghost-strong clear-popover" data-bind="click:clear">Clear</button>
        </div>
    `);

    let _dfd = self.new_deferred();

    self.waiting = ko.observable(false);
    self.enabled = ko.observable(true);
    self.pause_bindings = ko.observable(false);
    self.placement = opts.placement;
    self.placeholder = opts.placeholder || 'Find Entity';
    self.uid_key = opts.uid_key || 'uid';
    self.name_key = opts.name_key || 'name';

    self.entities = ko.observableArray();

    self.single_selection = opts.single_selection || false;

    self.on_select = function(event, suggestion) {
        let entity = {
            uid: suggestion[self.uid_key],
            name: suggestion[self.name_key],
            entity_type: suggestion.entity_type,
        };

        if (self.single_selection) {
            self.entities([entity]);
        } else {
            if (self.entities().indexOf(entity) == -1) {
                self.entities.push(entity);
            }
        }
    };

    self.typeahead_options = {
        minLength: 1,
        datasets: {
            source: function(query, callback) {
                DataThing.get({
                    params: {
                        target: opts.data_target,
                        filters: {
                            name: query,
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
                    return `<strong>${data[self.name_key]}</strong>`;
                },
            },
        },
        on_select: self.on_select,
    };

    self.remove_entity = function(entity) {
        self.entities.remove(entity);
    };

    self.clear = function() {
        self.entities([]);
    };

    self.get_state = function() {
        return ko.toJS(self.entities);
    };

    self.state = ko.pureComputed(() => {
        return self.get_state();
    });

    self.set_state = function(state) {
        self.entities(state || []);
    };

    self.get_value = ko.computed(() => {
        return self.entities();
    });

    self.modified = ko.computed(() => {
        return self.entities() && self.entities().length > 0;
    });

    _dfd.resolve();

    return self;
}
