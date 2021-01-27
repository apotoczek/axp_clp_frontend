import CommitmentsModal from 'src/libs/components/modals/CommitmentsModal';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import DataTable from 'src/libs/components/basic/DataTable';
import EventRegistry from 'src/libs/components/basic/EventRegistry';
import EventButton from 'src/libs/components/basic/EventButton';
import Observer from 'src/libs/Observer';

class CommitmentPlans extends BaseComponent {
    constructor(opts, components) {
        super(opts, components);
        const dfd = this.new_deferred();

        this.vehicle_uid_event = opts.vehicle_uid_event;
        const events = this.new_instance(EventRegistry, {});

        events.resolve_and_add('commitment', 'EventButton');
        events.new('commitment_plan_uid_event');
        events.new('commitment_plan_name_event');
        events.add({
            id: null,
            name: 'portfolio_uid_event',
            event: this.vehicle_uid_event,
        });

        this.define_template(`
            <div>
                <!-- ko renderComponent: table --><!-- /ko -->
            </div>
        `);

        this.commitment_modal = this.new_instance(CommitmentsModal, {
            id: 'commitment_modal',
            events: events,
        });

        Observer.register(events.get('commitment'), data => {
            Observer.broadcast(events.get('commitment_plan_uid_event'), data.uid);
            Observer.broadcast(events.get('commitment_plan_name_event'), data.name);
            this.commitment_modal.show();
        });

        this.table = this.new_instance(DataTable, {
            id: 'commitment_plans_table',
            inline_data: true,
            css: {'table-light': true, 'table-sm': true},
            template: 'tpl_data_table_commitments',
            enable_selection: true,
            columns: [
                {
                    label: 'Name',
                    component_callback: 'data',
                    component: {
                        id: 'commitment',
                        id_callback: events.register_alias('commitment'),
                        component: EventButton,
                        template: 'tpl_text_button',
                        label_key: 'name',
                    },
                },
                {
                    label: '# of Commitments',
                    key: 'count',
                },
            ],
            datasource: {
                type: 'dynamic',
                query: {
                    target: 'commitment_plans_for_portfolio',
                    portfolio_uid: {
                        type: 'observer',
                        required: true,
                        event_type: this.vehicle_uid_event,
                    },
                },
            },
        });

        this.when(this.table).done(() => {
            dfd.resolve();
        });
    }
}
export default CommitmentPlans;
