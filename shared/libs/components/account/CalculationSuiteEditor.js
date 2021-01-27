import ActionHeader from 'src/libs/components/basic/ActionHeader';
import Aside from 'src/libs/components/basic/Aside';
import EventButton from 'src/libs/components/basic/EventButton';
import NewDropdown from 'src/libs/components/basic/NewDropdown';
import DataSource from 'src/libs/DataSource';
import DataThing from 'src/libs/DataThing';

import BaseComponent from 'src/libs/components/basic/BaseComponent';

import Observer from 'src/libs/Observer';
import EventRegistry from 'src/libs/components/basic/EventRegistry';
import ko from 'knockout';
import HTMLContent from 'src/libs/components/basic/HTMLContent';

class CalculationSuiteForm extends BaseComponent {
    constructor(opts = {}, components = {}) {
        super(opts, components);
        const dfd = this.new_deferred();
        this.name = ko.observable('');
        this.uid = ko.observable();

        let suite_datasource = this.new_instance(DataSource, {
            datasource: {
                type: 'observer',
                event_type: opts.suite_payload_event,
            },
        });

        let mappings = this.new_instance(DataSource, {
            datasource: {
                type: 'dynamic',
                query: {
                    target: 'user:calculation_mappings',
                    results_per_page: 50,
                },
            },
        });

        let get_calculation_type_key = mapping => {
            switch (`${mapping.calculation}`) {
                case 'null':
                    return 'generic';
                case '1':
                    return 'irr';
                case '2':
                    return 'paid_in';
                case '3':
                    return 'distributed';
                case '4':
                    return 'roll_up';
            }
        };

        let calculation_types = ko.computed(() => {
            let types = {
                generic: [],
                irr: [],
                paid_in: [],
                distributed: [],
                roll_up: [],
            };
            if (mappings.data && mappings.data()) {
                for (let mapping of mappings.data()) {
                    types[get_calculation_type_key(mapping)].push({
                        label: mapping.name,
                        value: mapping.uid,
                    });
                }
            }

            return types;
        });

        this.form = this.new_instance(Aside, {
            id: 'form_body',
            template: 'tpl_aside_body',
            layout: {
                body: [
                    'irr_lbl',
                    'irr',
                    'paid_in_lbl',
                    'paid_in',
                    'distributed_lbl',
                    'distributed',
                    'roll_up_lbl',
                    'roll_up',
                ],
            },
            components: [
                {
                    id: 'irr_lbl',
                    component: HTMLContent,
                    html: '<h4>IRR Mapping</h4>',
                },
                {
                    id: 'irr',
                    component: NewDropdown,
                    btn_css: {'btn-xs': true, 'btn-ghost-default': true},
                    menu_css: {'dropdown-menu-right': true},
                    allow_clear: false,
                    allow_empty: true,
                    strings: {
                        no_selection: 'Select One',
                    },
                    data: ko.computed(() => {
                        return calculation_types().irr;
                    }),
                },
                {
                    id: 'paid_in_lbl',
                    component: HTMLContent,
                    html: '<h4>Paid In Mapping</h4>',
                },
                {
                    id: 'paid_in',
                    component: NewDropdown,
                    btn_css: {'btn-xs': true, 'btn-ghost-default': true},
                    menu_css: {'dropdown-menu-right': true},
                    allow_clear: false,
                    allow_empty: true,
                    strings: {
                        no_selection: 'Select One',
                    },
                    data: ko.computed(() => {
                        return calculation_types().paid_in;
                    }),
                },
                {
                    id: 'distributed_lbl',
                    component: HTMLContent,
                    html: '<h4>Distributed Mapping</h4>',
                },
                {
                    id: 'distributed',
                    component: NewDropdown,
                    btn_css: {'btn-xs': true, 'btn-ghost-default': true},
                    menu_css: {'dropdown-menu-right': true},
                    allow_clear: false,
                    allow_empty: true,
                    strings: {
                        no_selection: 'Select One',
                    },
                    data: ko.computed(() => {
                        return calculation_types().distributed;
                    }),
                },
                {
                    id: 'roll_up_lbl',
                    component: HTMLContent,
                    html: '<h4>Roll Up Mapping</h4>',
                },
                {
                    id: 'roll_up',
                    component: NewDropdown,
                    btn_css: {'btn-xs': true, 'btn-ghost-default': true, 'btn-block': false},
                    menu_css: {'dropdown-menu-right': true},
                    allow_clear: false,
                    allow_empty: true,
                    strings: {
                        no_selection: 'Select One',
                    },
                    data: ko.computed(() => {
                        return calculation_types().roll_up;
                    }),
                },
            ],
        });

        suite_datasource.data.subscribe(data => {
            this.name(data.name);
            this.uid(data.uid);
        });

        this.update_calculation_suite_endpoint = DataThing.backends.useractionhandler({
            url: 'update_calculation_suite',
        });

        this.create_calculation_suite_endpoint = DataThing.backends.useractionhandler({
            url: 'create_calculation_suite',
        });

        this.define_template(
            'default',
            `
            <div class="row">
                <div class="col-xs-12"><h2 style="margin-bottom:40px;">Edit Calculation Suite</h2>
                <!-- ko renderComponent:form -->
                <!-- /ko -->
            </div>
        `,
        );

        this.when(suite_datasource).done(() => {
            dfd.resolve();
            Observer.register(opts.save_event, () => {
                this.save();
            });
        });
    }

    save() {
        let data = this.get_state();
        data.uid = ko.unwrap(this.uid);

        if (data.uid) {
            this.update_calculation_mapping_endpoint({
                data: data,
            });
        } else {
            this.create_calculation_mapping_endpoint({
                data: data,
            });
        }
    }
}

class CalculationSuiteEditor extends BaseComponent {
    constructor(opts = {}, components = {}) {
        super(opts, components);
        const dfd = this.new_deferred();

        this.template = opts.template || 'tpl_account_content';

        this.events = this.new_instance(EventRegistry, {});

        this.events.resolve_and_add('clear', 'EventButton');
        this.events.resolve_and_add('search_count', 'DataTable.counts');
        this.events.resolve_and_add('name', 'StringFilter.value');
        this.events.resolve_and_add('save_suite', 'EventButton');
        this.events.resolve_and_add('delete_mapping', 'EventButton');

        this.table_columns = [
            {
                label: 'Mapping Name',
                //sort_key: 'name',
                key: 'name',
            },
        ];

        this.form = this.new_instance(CalculationSuiteForm, {
            id: 'form',
            save_event: this.events.get('save_suite'),
            suite_payload_event: opts.suite_payload_event,
        });

        this.action_toolbar = {
            id: 'action_toolbar',
            component: ActionHeader,
            template: 'tpl_action_toolbar',
            disable_export: true,
            buttons: [
                {
                    id: 'save_suite',
                    label: 'Save <span class="glyphicon glyphicon-save"></span>',
                    id_callback: this.events.register_alias('save_mapping'),
                    component: EventButton,
                },
            ],
        };

        this.content = this.new_instance(Aside, {
            id: 'body',
            template: 'tpl_aside_body',
            layout: {
                body: ['action_toolbar', 'form'],
            },
            components: [this.form, this.action_toolbar],
        });

        this.when(this.content).done(() => {
            dfd.resolve();
        });
    }
}
export default CalculationSuiteEditor;
