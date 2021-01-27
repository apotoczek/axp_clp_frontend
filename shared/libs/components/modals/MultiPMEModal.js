/* Automatically transformed from AMD to ES6. Beware of code smell. */
import Radiolist from 'src/libs/components/basic/Radiolist';
import NewPopoverButton from 'src/libs/components/popovers/NewPopoverButton';
import ko from 'knockout';
import $ from 'jquery';
import bison from 'bison';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import DataSource from 'src/libs/DataSource';
import DataTable from 'src/libs/components/basic/DataTable';
import * as Mapping from 'src/libs/Mapping';
import Observer from 'src/libs/Observer';
import * as Formatters from 'src/libs/Formatters';
import * as Utils from 'src/libs/Utils';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    self.define_template(`
            <div class="modal fade" tabindex="-1" role="dialog" aria-hidden="true">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                            <h4 class="modal-title">Multi Index PME</h4>
                        </div>
                        <div class="modal-body">
                            <!-- ko renderComponent: vehicles --><!-- /ko -->
                            <button type="button" class="btn btn-cpanel-success" data-bind="click: done" data-dismiss="modal">Done</button>
                            <button type="button" class="btn btn-ghost-default" data-dismiss="modal">Cancel</button>
                        </div>
                    </div>
                </div>
            </div>
        `);

    self.config = {};

    self.get_value = Mapping.gen_mapping('get_value');

    self.as_of_date_event = opts.as_of_date_event;
    self.horizon_event = opts.horizon_event;

    let index_query = {
        target: 'vehicle:index_options',
    };

    if (self.as_of_date_event) {
        index_query.max_date = {
            type: 'observer',
            event_type: self.as_of_date_event,
            mapping: 'get_value',
        };
        self.as_of_date = Observer.observable(self.as_of_date_event);
    } else {
        self.as_of_date = ko.observable();
    }

    if (self.horizon_event) {
        index_query.min_date = {
            type: 'observer',
            event_type: self.horizon_event,
            mapping: 'get_value',
        };
        self.start_date = Observer.observable(self.horizon_event);
    } else {
        self.start_date = ko.observable();
    }

    self.in_current_span = function(fund) {
        let as_of_date = Utils.get(self.as_of_date());
        let start_date = Utils.get(self.start_date());

        if (as_of_date && fund.first_date >= as_of_date) {
            return false;
        }

        if (start_date && fund.last_date <= start_date) {
            return false;
        }

        return true;
    };

    self.index_source = self.new_instance(DataSource, {
        datasource: {
            type: 'dynamic',
            query: index_query,
        },
    });

    self.indexes = ko.pureComputed(() => {
        let indexes = self.index_source.data();
        if (indexes) {
            return [
                {
                    value: 'default',
                    label: opts.in_user_fund ? 'Use Fund Value' : 'Use Portfolio Value',
                },
                ...indexes,
            ];
        }
        return [];
    });

    /********************************************************************
     * Table of vehicles
     *******************************************************************/

    // replaced user_fund_uid with entity_uid due to company-level multi-pme

    self.vehicles = self.new_instance(DataTable, {
        id: 'vehicles',
        results_per_page: 10,
        inline_data: true,
        row_key: 'uid',
        css: 'table-light table-sm',
        data: self.data,
        columns: [
            {
                label: 'Name',
                key: 'name',
            },
            {
                label: 'In Current Span',
                sort_key: 'in_current_span',
                formatter: fund => Formatters.boolean_highlight(self.in_current_span(fund)),
            },
            {
                width: '350px',
                label: 'Index',
                component_callback: 'set_data_and_inner_state',
                component_mapping: 'market_to_data_and_inner_state',
                initial_callback_only: true,
                component: {
                    id: 'index',
                    component: NewPopoverButton,
                    label_track_selection: true,
                    broadcast_data: true,
                    css: {
                        'btn-block': true,
                        'btn-ghost-default': true,
                        'btn-xs': true,
                    },
                    icon_css: 'glyphicon glyphicon-chevron-down glyphicon-small',
                    popover_options: {
                        title: 'Select Index',
                        placement: 'bottom',
                        css_class: 'popover-ghost-default',
                    },
                    popover_config: {
                        component: Radiolist,
                        value_key: 'value',
                        label_key: 'label',
                        sub_label_key: 'sub_label',
                        option_disabled_key: 'invalid',
                        data: self.indexes,
                    },
                },
            },
        ],
    });

    let subscription = self.vehicles.data.subscribe(vehicles => {
        let indexes = self.indexes();

        if (vehicles && indexes.length) {
            let index_ids = indexes.map(idx => idx.value);

            for (let vehicle of vehicles) {
                let index_id = vehicle.market_id;
                if (index_id && index_ids.includes(index_id)) {
                    self.config[vehicle.uid] = index_id;
                }
            }

            subscription.dispose();
        }
    });

    $.when(...self.vehicles.dfds).done(() => {
        // Subscribe to index dropdown
        Observer.register_for_id(
            Utils.gen_id(self.get_id(), 'vehicles', 'index'),
            'PopoverButton.value_with_data',
            payload => {
                if (payload.data && payload.value) {
                    let uid = payload.data.value;

                    let value = self.get_value(payload.value);

                    if (value && value !== 'default') {
                        self.config[uid] = value;
                    } else {
                        self.config[uid] = undefined;
                    }
                }
            },
        );
    });

    self.done = function() {
        self.reset();
    };

    /********************************************************************
     * Modal functionality
     *******************************************************************/

    self.show = function() {
        bison.helpers.modal(self.template, self, self.get_id());
    };

    self.reset = function() {
        Observer.broadcast_for_id(self.get_id(), 'MultiPMEModal.config', self.config);
        bison.helpers.close_modal(self.get_id());
    };

    return self;
}
