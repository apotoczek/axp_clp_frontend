/* Automatically transformed from AMD to ES6. Beware of code smell. */
import NewDropdown from 'src/libs/components/basic/NewDropdown';
import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import AttributeMemberForm from 'src/libs/components/datamanager/AttributeMemberForm';
import TextInput from 'src/libs/components/basic/TextInput';
import DataTable from 'src/libs/components/basic/DataTable';
import Observer from 'src/libs/Observer';
import DataThing from 'src/libs/DataThing';
import DataManagerHelper from 'src/libs/helpers/DataManagerHelper';
import * as Utils from 'src/libs/Utils';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    let _dfd = self.new_deferred();

    self.template = opts.template || 'tpl_data_manager_form_table';

    self.attribute_uid_event = opts.attribute_uid_event;
    self.refresh_event = opts.refresh_event || Utils.gen_event(self.get_id(), 'refresh');
    self.attribute_uid = ko.observable();

    self.header_id = opts.header_id;

    self.form = self.new_instance(AttributeMemberForm, {
        id: 'member_form',
        attribute_uid_event: self.attribute_uid_event,
        refresh_event: self.refresh_event,
    });

    self.table = self.new_instance(DataTable, {
        label: 'Values',
        id: 'table',
        enable_clear_order: true,
        enable_selection: true,
        css: {
            'table-light': true,
            'table-sm': true,
            'table-bordered': true,
            'table-bison': false,
            'table-condensed': true,
            'table-form': true,
        },
        inline_data: true,
        results_per_page: 15,
        overflow: 'visible',
        columns: [
            {
                label: 'Name',
                sort_key: 'name',
                width: '40%',
                type: 'component',
                component_callback: 'data',
                component: {
                    id: 'name_input',
                    component: TextInput,
                    css: {'input-xs': true},
                    initial_value_property: 'name',
                    allow_empty: false,
                },
            },
            {
                label: 'Parent Value',
                type: 'component',
                sort_key: 'parent_uid',
                component_callbacks: [
                    {
                        callback: 'set_selected_by_value',
                        mapping: {
                            mapping: 'get',
                            mapping_args: {key: 'parent_uid'},
                        },
                    },
                    {
                        callback: 'broadcast_data',
                    },
                ],
                component: {
                    id: 'parent_input',
                    component: NewDropdown,
                    btn_css: {
                        'btn-xs': true,
                        'btn-ghost-info': true,
                    },
                    value_key: 'uid',
                    label_key: 'name',
                    strings: {
                        no_selection: 'No Parent',
                    },
                    datasource: {
                        type: 'dynamic',
                        key: 'members',
                        query: {
                            target: 'attribute:data',
                            attribute_uid: {
                                type: 'observer',
                                event_type: self.attribute_uid_event,
                                required: true,
                            },
                            tree_mode: false,
                            include_members: true,
                        },
                    },
                },
            },
        ],
        empty_template: 'tpl_data_table_empty_with_top_form',
        disable_cache: true,
        datasource: {
            type: 'dynamic',
            key: 'members',
            query: {
                include_members: true,
                tree_mode: false,
                target: 'attribute:editable_data',
                attribute_uid: {
                    type: 'observer',
                    event_type: self.attribute_uid_event,
                    required: true,
                },
            },
        },
    });

    self._add_new_member = DataThing.backends.useractionhandler({
        url: 'add_attribute_member',
    });

    self.broadcast_refresh = function() {
        if (self.refresh_event) {
            Observer.broadcast(self.refresh_event);
        }
    };

    self.when(self.form, self.table).done(() => {
        _dfd.resolve();

        Observer.register(self.attribute_uid_event, uid => {
            self.attribute_uid(uid);
        });

        if (self.header_id) {
            Observer.register_for_id(
                DataManagerHelper.button_id.delete_entities(self.header_id),
                'DeleteAttributeMemberModal.success',
                () => {
                    self.table.refresh_data(true);
                    self.broadcast_refresh();
                },
            );
        }

        Observer.register_for_id(self.form.get_id(), 'AttributeMemberForm.add_member', data => {
            data.attribute_uid = self.attribute_uid();
            self._add_new_member({
                data: {
                    attribute_uid: self.attribute_uid(),
                    name: data.name,
                    parent_uid: data.parent_uid,
                },
                success: DataThing.api.XHRSuccess(() => {
                    self.form.clear();
                    self.table.refresh_data(true);
                    self.broadcast_refresh();
                }),
                error: DataThing.api.XHRError(() => {}),
            });
        });
    });

    return self;
}
