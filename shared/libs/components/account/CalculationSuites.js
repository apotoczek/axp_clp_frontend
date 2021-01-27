import ActionHeader from 'src/libs/components/basic/ActionHeader';
import ActionButton from 'src/libs/components/basic/ActionButton';
import Aside from 'src/libs/components/basic/Aside';
import EventButton from 'src/libs/components/basic/EventButton';
import ConfirmDeleteModal from 'src/libs/components/modals/ConfirmDeleteModal';
import DataTable from 'src/libs/components/basic/DataTable';

import BaseComponent from 'src/libs/components/basic/BaseComponent';

import Observer from 'src/libs/Observer';
import EventRegistry from 'src/libs/components/basic/EventRegistry';

class CalculationMapping extends BaseComponent {
    constructor(opts = {}, components = {}) {
        super(opts, components);
        const dfd = this.new_deferred();

        this.template = opts.template || 'tpl_account_content';

        this.events = this.new_instance(EventRegistry, {});

        this.events.resolve_and_add('clear', 'EventButton');
        this.events.resolve_and_add('calculations', 'DataTable.counts', 'results_count');
        this.events.resolve_and_add('calculations', 'DataTable.selected', 'selected');
        this.events.resolve_and_add('calculations', 'DataTable.click_row', 'click_row');
        this.events.resolve_and_add('name', 'StringFilter.value');
        this.events.resolve_and_add('new_suite', 'EventButton');
        this.events.new('confirm_delete_suite');
        this.events.new('mode_change');

        this.selected = Observer.observable(this.events.get('selected'));

        this.calculations = {
            id: 'calculations',
            component: DataTable,
            enable_selection: true,
            id_callback: this.events.register_alias('calculations'),
            css: {'table-light': true, 'table-sm': true},
            inline_data: true,
            columns: [
                {
                    label: 'Calculation Suite Name',

                    key: 'name',
                },
            ],
            datasource: {
                type: 'dynamic',
                query: {
                    target: 'user:calculation_suites',
                    results_per_page: 50,
                },
            },
        };

        this.action_toolbar = {
            id: 'action_toolbar',
            component: ActionHeader,
            template: 'tpl_action_toolbar',
            disable_export: true,
            buttons: [
                {
                    id: 'save_mapping',
                    label: 'New Suite <span class="glyphicon glyphicon-plus"></span>',
                    id_callback: this.events.register_alias('new_suite'),
                    component: EventButton,
                },
                {
                    id: 'delete_suite',
                    id_callback: this.events.register_alias('delete_suite'),
                    component: ActionButton,
                    label:
                        'Delete Selected Suite <span class="glyphicon glyphicon-ban-circle"></span>',
                    action: 'delete_suite',
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
                        id_callback: this.events.register_alias('confirm_delete_suite'),
                        button_text: 'Delete Suite',
                        component: ConfirmDeleteModal,
                        confirm_delete_event: this.events.get('confirm_delete_suite'),
                    },
                },
            ],
        };

        this.content = this.new_instance(Aside, {
            id: 'body',
            template: 'tpl_aside_body',
            layout: {
                body: ['action_toolbar', 'calculations'],
            },
            components: [this.calculations, this.action_toolbar],
        });

        this.when(this.content).done(() => {
            dfd.resolve();
            Observer.register(this.events.get('click_row'), payload => {
                window.location.hash = '#!/account/calculation_suites:editor';
                Observer.broadcast(opts.mapping_payload_event, payload);
            });

            Observer.register(this.events.get('new_suite'), () => {
                window.location.hash = '#!/account/calculation_suites:editor';
            });

            Observer.register(this.events.get('confirm_delete_suite'), () => {
                //console.log(this.selected());
            });
        });
    }
}
export default CalculationMapping;
