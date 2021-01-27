/* Automatically transformed from AMD to ES6. Beware of code smell. */
import DataTable from 'src/libs/components/basic/DataTable';
import DeleteAttributeModal from 'src/libs/components/datamanager/DeleteAttributeModal';
import ActionHeader from 'src/libs/components/basic/ActionHeader';
import Breadcrumb from 'src/libs/components/basic/Breadcrumb';
import BreadcrumbHeader from 'src/libs/components/basic/BreadcrumbHeader';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import Aside from 'src/libs/components/basic/Aside';
import AttributesModal from 'src/libs/components/how_to_modals/AttributesModal';
import EventButton from 'src/libs/components/basic/EventButton';
import Observer from 'src/libs/Observer';
import * as Utils from 'src/libs/Utils';
import DataManagerHelper from 'src/libs/helpers/DataManagerHelper';
import CustomAttributeModal from 'src/libs/components/modals/CustomAttributeModal';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    let _dfd = self.new_deferred();

    self.results_per_page = opts.results_per_page || 50;

    self.cpanel_id = opts.cpanel_id;
    self.clear_event = opts.clear_event;

    self.template = opts.template || 'tpl_data_manager_form_table';
    self.edit_attribute_event = Utils.gen_event(
        'EventButton',
        self.get_id(),
        'body',
        'entities_table',
        'edit',
    );

    self.data_table_id = Utils.gen_id(self.get_id(), 'body', 'entities_table');

    DataManagerHelper.register_create_new_entity_action_button(
        Utils.gen_id(self.get_id(), 'body', 'action_toolbar', 'new'),
    );

    DataManagerHelper.register_upload_wizard_event(
        Utils.gen_event(
            'ActionButton.action.upload',
            self.get_id(),
            'body',
            'action_toolbar',
            'upload',
        ),
    );

    self.new_custom_attribute_modal = self.new_instance(CustomAttributeModal, {
        id: 'new_custom_attribute_modal',
        edit_mode: true,
    });

    Observer.register(self.edit_attribute_event, data => {
        self.new_custom_attribute_modal.show_and_populate(data);
    });

    self.body = self.new_instance(Aside, {
        id: 'body',
        template: 'tpl_list_body',
        layout: {
            header: 'header',
            toolbar: 'action_toolbar',
            body: ['entities_table'],
        },
        components: [
            {
                component: BreadcrumbHeader,
                id: 'header',
                template: 'tpl_breadcrumb_header',
                buttons: [
                    {
                        id: 'tips',
                        label:
                            'How to Use <span class="glyphicon glyphicon-info-sign" style="margin-right:5px;"></span>',
                        action: 'show_modal',
                    },
                ],
                layout: {
                    breadcrumb: 'breadcrumb',
                },
                components: [
                    {
                        id: 'breadcrumb',
                        component: Breadcrumb,
                        items: [
                            {
                                label: 'Data Manager',
                                link: '#!/data-manager',
                            },
                            {
                                label: 'Attributes',
                            },
                        ],
                    },
                ],
            },
            {
                id: 'action_toolbar',
                component: ActionHeader,
                template: 'tpl_action_toolbar',
                disable_export: true,
                buttons: [
                    DataManagerHelper.buttons.delete_entities({
                        data_table_id: self.data_table_id,
                        component: DeleteAttributeModal,
                        check_permissions: true,
                    }),
                    DataManagerHelper.buttons.upload(),
                    {
                        id: 'new_attribute',
                        action: 'new_attribute',
                        label:
                            'New Attribute <span class="glyphicon glyphicon-plus" style="margin-right:5px;"></span>',
                        trigger_modal: {
                            id: 'attribute_modal',
                            component: CustomAttributeModal,
                        },
                    },
                ],
            },
            {
                component: DataTable,
                id: 'entities_table',
                enable_selection: true,
                enable_clear_order: true,
                column_toggle_css: {'fixed-column-toggle': true},
                css: {'table-light': true, 'table-sm': true},
                results_per_page: self.results_per_page,
                clear_order_event: self.clear_event,
                empty_template: 'tpl_data_table_empty_attributes',
                columns: [
                    {
                        label: 'Name',
                        component_callback: 'data',
                        component: {
                            id: 'edit',
                            component: EventButton,
                            template: 'tpl_text_button',
                            label_key: 'name',
                        },
                    },
                    {
                        label: 'Scope',
                        key: 'scope',
                        format: 'entity_meta_scope',
                    },
                    {
                        label: 'Items',
                        key: 'items',
                    },
                ],
                datasource: {
                    type: 'dynamic',
                    mapping: function(response) {
                        response.results.map(attr => {
                            let items = [];

                            for (let member of attr.members) {
                                items.push(member.name);
                            }

                            attr.items = items.compact().join(', ');
                        });

                        return response;
                    },

                    query: {
                        target: 'attributes',
                        include_members: true,
                    },
                },
            },
        ],
    });

    self.tips_modal = self.new_instance(AttributesModal, {
        id: 'tips_modal',
    });

    self.when(self.body, self.tips_modal, self.new_custom_attribute_modal).done(() => {
        _dfd.resolve();

        Observer.register_for_id(
            DataManagerHelper.button_id.delete_entities(Utils.gen_id(self.body.get_id(), 'header')),
            'DeleteAttributeModal.success',
            () => {
                self.body.components.entities_table.refresh_data(true);
            },
        );

        Observer.register(
            Utils.gen_event('AttributeForm.add_attribute', self.body.get_id(), 'attribute_form'),
            () => {
                self.body.components.entities_table.refresh_data(true);
            },
        );

        Observer.register_for_id(
            Utils.gen_id(self.get_id(), 'body', 'header', 'tips'),
            'ActionButton.action.show_modal',
            () => {
                self.tips_modal.show();
            },
        );
    });

    return self;
}
