import ActionHeader from 'src/libs/components/basic/ActionHeader';
import ActionButton from 'src/libs/components/basic/ActionButton';
import EventButton from 'src/libs/components/basic/EventButton';
import ConfirmDeleteModal from 'src/libs/components/modals/ConfirmDeleteModal';
import DataThing from 'src/libs/DataThing';
import DataTable from 'src/libs/components/basic/DataTable';

import BaseComponent from 'src/libs/components/basic/BaseComponent';

import Observer from 'src/libs/Observer';
import EventRegistry from 'src/libs/components/basic/EventRegistry';

class CalculationMapping extends BaseComponent {
    constructor(opts = {}, components = {}) {
        super(opts, components);
        const dfd = this.new_deferred();

        this.define_template(
            'default',
            `
            <!-- ko renderComponent: action_toolbar --><!-- /ko -->
            <!-- ko renderComponent: calculations --><!-- /ko -->
        `,
        );
        this.events = this.new_instance(EventRegistry, {});

        this.events.resolve_and_add('clear', 'EventButton');
        this.events.resolve_and_add('calculations', 'DataTable.counts', 'results_count');
        this.events.resolve_and_add('calculations', 'DataTable.selected', 'selected');
        this.events.resolve_and_add('calculations', 'DataTable.click_row', 'click_row');
        this.events.resolve_and_add('name', 'StringFilter.value');
        this.events.resolve_and_add('new_mapping', 'EventButton');
        this.events.new('confirm_delete_mapping');
        this.events.new('mode_change');

        this.selected = Observer.observable(this.events.get('selected'));

        this.calculations = this.new_instance(DataTable, {
            id: 'calculations',
            enable_selection: true,
            id_callback: this.events.register_alias('calculations'),
            css: {'table-light': true, 'table-sm': true, clickable: true},
            inline_data: true,
            columns: [
                {
                    label: 'Mapping Name',

                    key: 'name',
                },
            ],
            datasource: {
                type: 'dynamic',
                query: {
                    target: 'user:calculation_mappings',
                    results_per_page: 50,
                },
            },
        });

        this.action_toolbar = this.new_instance(ActionHeader, {
            id: 'action_toolbar',
            component: ActionHeader,
            template: 'tpl_action_toolbar',
            disable_export: true,
            buttons: [
                {
                    id: 'save_mapping',
                    label: 'New Mapping <span class="glyphicon glyphicon-plus"></span>',
                    id_callback: this.events.register_alias('new_mapping'),
                    component: EventButton,
                },
                {
                    id: 'delete_mapping',
                    id_callback: this.events.register_alias('delete_mapping'),
                    component: ActionButton,
                    label:
                        'Delete Selected Mapping <span class="glyphicon glyphicon-ban-circle"></span>',
                    action: 'delete_mapping',
                    disabled_callback: data => {
                        // Disable button if no user is selected
                        if (data.selected_count) {
                            return !data.selected_count > 0;
                        }
                        return true;
                    },
                    datasource: {
                        type: 'observer',
                        event_type: this.events.get('results_count'),
                        default: [],
                    },
                    trigger_modal: {
                        id: 'confirm_delete',
                        id_callback: this.events.register_alias('confirm_delete_mapping'),
                        button_text: 'Delete Mapping',
                        component: ConfirmDeleteModal,
                        confirm_delete_event: this.events.get('confirm_delete_mapping'),
                    },
                },
            ],
        });

        this.delete_calculation_mappings_endpoint = DataThing.backends.useractionhandler({
            url: 'delete_calculation_mappings',
        });

        this.when(this.calculations, this.action_toolbar).done(() => {
            dfd.resolve();
            Observer.register(this.events.get('click_row'), payload => {
                window.location.hash = '#!/account/calculations:editor';
                Observer.broadcast(opts.mapping_payload_event, payload);
            });

            Observer.register(this.events.get('new_mapping'), () => {
                window.location.hash = '#!/account/calculations:editor';
                Observer.broadcast(opts.mapping_payload_event, undefined);
            });

            Observer.register(this.events.get('confirm_delete_mapping'), () => {
                let uids = this.selected().map(n => {
                    return n.uid;
                });
                this.delete_calculation_mappings_endpoint({
                    data: {
                        uids: uids,
                    },
                    success: () => {
                        DataThing.status_check();
                    },
                });
            });
        });
    }
}
export default CalculationMapping;
