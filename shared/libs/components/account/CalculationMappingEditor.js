import ActionHeader from 'src/libs/components/basic/ActionHeader';
import EventButton from 'src/libs/components/basic/EventButton';
import NewDropdown from 'src/libs/components/basic/NewDropdown';
import DataSource from 'src/libs/DataSource';
import DataThing from 'src/libs/DataThing';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import Observer from 'src/libs/Observer';
import EventRegistry from 'src/libs/components/basic/EventRegistry';
import ko from 'knockout';
import bison from 'bison';

class CheckBoxTable extends BaseComponent {
    constructor(opts = {}, components = {}) {
        super(opts, components);
        const dfd = this.new_deferred();
        this.name = ko.observable('');
        this.uid = ko.observable();

        let classification_datasource = this.new_instance(DataSource, {
            datasource: {
                type: 'dynamic',
                query: {
                    target: 'user:cashflow_classifications',
                },
            },
        });

        this.mapping_data = this.new_instance(DataSource, {
            datasource: {
                type: 'observer',
                event_type: opts.mapping_payload_event,
            },
        });

        this.mapping_data.data.subscribe(data => {
            if (data) {
                this.name(data.name);
                this.uid(data.uid);
            } else {
                this.name('');
                this.uid(undefined);
            }
        });

        this.classifications = ko.computed(() => {
            if (classification_datasource.data() && (!this.uid() || this.mapping_data.data())) {
                let _classifications = classification_datasource.data().distinct_cashflow_types;
                let _included = this.mapping_data.data()
                    ? this.mapping_data.data().members.map(obj => {
                          return obj.uid;
                      })
                    : [];

                let mapped = _classifications.map(obj => {
                    obj.included = ko.observable(_included.indexOf(obj.value) > -1);
                    return obj;
                });

                return mapped;
            }

            return [];
        });

        this.update_calculation_mapping_endpoint = DataThing.backends.useractionhandler({
            url: 'update_calculation_mapping',
        });

        this.create_calculation_mapping_endpoint = DataThing.backends.useractionhandler({
            url: 'create_calculation_mapping',
        });

        this.type_dropdown = this.new_instance(NewDropdown, {
            id: 'type_dropdown',
            label: 'Type',
            allow_empty: false,
            data: [
                {
                    label: 'Generic',
                    value: 'generic',
                },
                {
                    label: 'IRR',
                    value: 1,
                },
                {
                    label: 'Paid In',
                    value: 2,
                },
                {
                    label: 'Distributed',
                    value: 3,
                },
                {
                    label: 'Roll Up',
                    value: 4,
                },
            ],
            selected: {
                data: ko.computed(() => {
                    if (this.mapping_data.data()) {
                        let selected = this.mapping_data.data().calculation || 'generic';
                        return selected;
                    }
                    return 'generic';
                }),
            },
        });

        this.define_template(
            'default',
            `
            <div class="row">
                <div class="col-xs-12"><h2 style="margin-bottom:40px;">Edit Calculation Mapping</h2>
            </div>

            <div class="row">
                <div class="col-xs-6">
                    <div class="form-group">
                        <label for="mapping_name">Mapping Name:</label>
                        <input type="text" class="form-control" id="mapping_name" aria-describedby="Mapping Name" placeholder="Enter Mapping Name" data-bind="value:name">
                    </div>
                </div>
                <div class="col-xs-6">
                    <div>
                        <label for="mapping_name">For Calculation Type:</label>
                        <!-- ko renderComponent:type_dropdown --><!-- /ko -->
                    </div>
                </div>
            </div>

            <table class="table table-striped">
                <thead>
                    <tr>
                        <th>
                            Classification
                        </th>
                        <th>
                            Include in Calculation
                        </th>
                    </tr>
                </thead>
                <tbody data-bind="foreach:classifications">
                    <tr >

                        <td data-bind="text:label">
                        </td>

                        <td>
                            <input type="checkbox" data-bind="checked:included"/>
                        </td>

                    </tr>
                </tbody>
            </table>
        `,
        );

        this.when(classification_datasource, this.type_dropdown).done(() => {
            dfd.resolve();
            Observer.register(opts.save_event, () => {
                this.save();
            });
        });
    }

    get_state() {
        let _classifications = this.classifications();
        let _included = _classifications.reduce((members, obj) => {
            if (obj.included()) {
                members.push(obj.value);
            }
            return members;
        }, []);

        let req = {
            name: this.name(),
            calculation: this.type_dropdown.selected_value(),
            member_uids: _included,
        };

        return req;
    }

    save() {
        let data = this.get_state();

        if (data.calculation === 'generic') {
            data.calculation = null;
        }

        data.uid = ko.unwrap(this.uid);

        if (data.uid) {
            this.update_calculation_mapping_endpoint({
                data: data,
                success: () => {
                    bison.utils.Notify('Success!', 'Your mapping has been saved.', 'alert-success');
                    DataThing.status_check();
                },
            });
        } else {
            this.create_calculation_mapping_endpoint({
                data: data,
                success: payload => {
                    this.mapping_data.data(payload.body);
                    bison.utils.Notify('Success!', 'Your mapping has been saved.', 'alert-success');
                    DataThing.status_check();
                },
            });
        }
    }
}

class CalculationMappingEditor extends BaseComponent {
    constructor(opts = {}, components = {}) {
        super(opts, components);
        const dfd = this.new_deferred();

        this.events = this.new_instance(EventRegistry, {});
        this.events.resolve_and_add('save_mapping', 'EventButton');
        this.events.resolve_and_add('delete_mapping', 'EventButton');

        this.define_template(
            'default',
            `
            <!-- ko renderComponent: action_toolbar --><!-- /ko -->
            <!-- ko renderComponent: form --><!-- /ko -->
        `,
        );

        this.form = this.new_instance(CheckBoxTable, {
            id: 'form',
            save_event: this.events.get('save_mapping'),
            mapping_payload_event: opts.mapping_payload_event,
        });

        this.action_toolbar = this.new_instance(ActionHeader, {
            id: 'action_toolbar',
            template: 'tpl_action_toolbar',
            disable_export: true,
            buttons: [
                {
                    id: 'save_mapping',
                    label: 'Save <span class="glyphicon glyphicon-save"></span>',
                    id_callback: this.events.register_alias('save_mapping'),
                    component: EventButton,
                },
            ],
        });

        this.when(this.action_toolbar, this.form).done(() => {
            dfd.resolve();
        });
    }
}
export default CalculationMappingEditor;
