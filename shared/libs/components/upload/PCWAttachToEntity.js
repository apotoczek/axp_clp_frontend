/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import Observer from 'src/libs/Observer';
import DataThing from 'src/libs/DataThing';
import * as Formatters from 'src/libs/Formatters';

import 'src/libs/bindings/typeahead';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    self.define_default_template(`
            <div class="upload-status upload-status-success">
                <!--ko if: loading -->
                    <!-- ko template: {
                        name: 'tpl_pcw_crunching_numbers',
                        data: {
                            callout_css: 'callout-success'
                        },
                    } --><!-- /ko -->
                <!-- /ko -->
                <!-- ko ifnot:loading -->
                    <div class="row">
                        <table class="callout-table callout-success">
                            <tr>
                                <td class="callout-icon">
                                    <span class="glyphicon glyphicon-ok">
                                </td>
                                <td>
                                    <table class="new-world-form" style="table-layout: fixed; width: 50%;">
                                        <tr>
                                            <td class="fund-quick-search" style="position: relative">
                                                <input class='form-control' placeholder="Search to select entity" type="text" data-bind="
                                                typeahead: typeahead_options
                                                " style="position: relative"/>
                                                <span class="glyphicon glyphicon-search" style="font-size:18px; padding-left:10px;position: absolute;right: 25px;color: #AAA;top: 16px;"></span>
                                            </td>
                                            <td>
                                                <strong data-bind="text: name"></strong>
                                            </td>
                                        </tr>
                                        <tr>
                                            <table style="width: 100%;">
                                                <tr>
                                                    <td>
                                                        <p class="lead">
                                                            <!-- ko if: selected -->
                                                                <span data-bind="with: selected">Click continue to attach to &quot;<!-- ko text: name --><!-- /ko -->&quot;</span>
                                                            <!-- /ko -->
                                                            <!-- ko ifnot: selected -->
                                                                <span data-bind="text: prompt"></span>
                                                            <!-- /ko -->
                                                        </p>
                                                    </td>
                                                    <td>
                                                        <button class="btn btn-confirm btn-sm pull-right" data-bind="click: finish, disable: loading">
                                                            Continue
                                                            <span class="glyphicon glyphicon-ok pull-left"></span>
                                                        </button>
                                                    </td>
                                                </tr>
                                            </table>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                        </table>
                    </div>
                <!-- /ko -->
            </div>
        `);

    self.entity_type = opts.entity_type;
    self.cashflow_type = opts.cashflow_type;

    self.uid_property = opts.uid_property;
    self.prompt = opts.prompt;

    self.sheet = opts.sheet;
    self.options = self.sheet.data;

    self.selected = ko.observable();

    self.search_vehicles = function(query, callback) {
        DataThing.get({
            params: {
                target: 'vehicles',
                filters: {
                    name: query,
                    entity_type: self.entity_type,
                    cashflow_type: self.cashflow_type,
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
    };

    let entity_type_formatter = Formatters.gen_formatter('entity_type');

    self.typeahead_options = {
        minLength: 1,
        datasets: {
            source: self.search_vehicles,
            templates: {
                suggestion: function(data) {
                    return (
                        `<strong>${data.name}</strong> ` +
                        `<span>${entity_type_formatter(data.entity_type)}</span>`
                    );
                },
            },
        },
        on_select: function(event, vehicle) {
            self.selected(vehicle);
        },
    };

    self.loading = ko.observable(false);

    self.finish = function() {
        let selected = self.selected();
        if (selected) {
            self.loading(true);

            let data = {
                identifier: self.sheet.identifier,
                action: self.sheet.required_action,
                data: selected[self.uid_property],
            };

            Observer.broadcast_for_id(self.get_id(), 'resolve_spreadsheet_action', data);
        }
    };

    return self;
}
