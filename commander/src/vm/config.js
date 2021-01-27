import ko from 'knockout';
import Context from 'src/libs/Context';
import pager from 'pager';
import Aside from 'src/libs/components/basic/Aside';
import Observer from 'src/libs/Observer';
import TextInput from 'src/libs/components/basic/TextInput';
import JSONField from 'src/libs/components/basic/JSONField';
import DataTable from 'src/libs/components/basic/DataTable';
import DataThing from 'src/libs/DataThing';
import EventRegistry from 'src/libs/components/basic/EventRegistry';
import DynamicWrapper from 'src/libs/components/basic/DynamicWrapper';
import StringFilter from 'src/libs/components/basic/StringFilter';
import EventButton from 'src/libs/components/basic/EventButton';
import FileUploadButton from 'src/libs/components/upload/FileUploadButton';
import DataSource from 'src/libs/DataSource';
import Header from 'src/libs/components/commander/Header';
import DeleteMultiple from 'src/libs/components/modals/DeleteMultiple';
import bison from 'bison';

export default class Config extends Context {
    constructor() {
        super({id: 'config'});
        this.dfd = this.new_deferred();
        this.uid = ko.observable();
        const events = this.new_instance(EventRegistry, {});
        events.resolve_and_add('createConfig', 'ActionButton.action.create');
        events.resolve_and_add('dataTable', 'DataTable.counts', 'dataTableCounts');
        events.resolve_and_add('dataTable', 'DataTable.selected', 'dataTableSelected');
        events.resolve_and_add('stringFilter', 'StringFilter.value');
        events.resolve_and_add('clear', 'EventButton');
        events.resolve_and_add('edit_update_name', 'EventButton');
        events.resolve_and_add('create_config', 'EventButton');
        events.resolve_and_add('new_delete_config', 'EventButton');
        events.resolve_and_add('edit_delete_config', 'EventButton');
        events.resolve_and_add('edit_restore_json', 'EventButton');
        events.resolve_and_add('edit_restore_name', 'EventButton');
        events.resolve_and_add('edit_update_json', 'EventButton');
        events.resolve_and_add('upload_config', 'FileUploadButton.action.upload_config');
        events.resolve_and_add('delete_configs', 'ActionButton.action.delete_configs');

        events.new('state_change');
        events.new('config_uid');

        const state_change_event = events.get('state_change');
        const config_uid_event = events.get('config_uid');
        const max_config_size = 1024 * 1024 * 400; // 400 mb

        const config_datasource = this.new_instance(DataSource, {
            datasource: {
                type: 'dynamic',
                query: {
                    target: 'commander:config',
                    config_uid: {
                        type: 'observer',
                        event_type: config_uid_event,
                        required: true,
                    },
                },
            },
        });

        const restore_json_data = this.new_instance(DataSource, {
            datasource: {
                type: 'dynamic',
                mapping: data => ({
                    ...data,
                    config_data: JSON.stringify(data.config_data, null, 2),
                }),
                query: {
                    target: 'commander:config',
                    config_uid: {
                        type: 'observer',
                        event_type: config_uid_event,
                        required: true,
                    },
                },
            },
        });

        //////////////////////////// EDIT CONFIG ///////////////////////////////

        const rename_button = {
            id: 'rename_button',
            component: EventButton,
            id_callback: events.register_alias('edit_update_name'),
            css: {'btn-sm': true, 'btn-default': true, 'btn-success': true},
            label: 'Rename Config <span class="icon-ok"></span>',
        };

        const restore_config_name_button = {
            id: 'restore_config_name_button',
            component: EventButton,
            id_callback: events.register_alias('edit_restore_name'),
            css: {
                'btn-sm': true,
                'btn-info': true,
                'spacing-horizontal': true,
            },
            label: 'Restore Name <span class="glyphicon glyphicon-refresh"></span>',
        };

        const config_json_field = this.new_instance(JSONField, {
            id: 'config_json_field',
            auto_get_data: true,
            clear_event: config_uid_event,
            initial_value_property: 'config_data',
            css: {
                'json-field': true,
            },
            datasource: {
                type: 'dynamic',
                mapping: data => ({
                    ...data,
                    config_data: JSON.stringify(data.config_data, null, 2),
                }),
                query: {
                    target: 'commander:config',
                    config_uid: {
                        type: 'observer',
                        event_type: config_uid_event,
                        required: true,
                    },
                },
            },
        });

        const rename_text_field = this.new_instance(TextInput, {
            id: 'rename_text_field',
            allow_empty: false,
            template: 'tpl_text_input',
            auto_get_data: true,
            enable_data_updates: true,
            clear_event: config_uid_event,
            initial_value_property: 'name',
            css: {
                'input-xs': true,
                'margin-bottom-10px': true,
            },
            datasource: {
                type: 'dynamic',
                query: {
                    target: 'commander:config',
                    config_uid: {
                        type: 'observer',
                        event_type: config_uid_event,
                        required: true,
                    },
                },
            },
        });

        const edit_config_info = this.new_instance(Aside, {
            id: 'edit_config_info',
            template: 'tpl_aside_body',
            layout: {
                body: ['rename_text_field', 'rename_button', 'restore_config_name_button'],
            },
            components: [rename_button, restore_config_name_button, rename_text_field],
        });

        const config_json = this.new_instance(Aside, {
            id: 'config_json',
            template: 'tpl_aside_body',
            layout: {
                body: ['config_json_field'],
            },
            components: [config_json_field],
        });

        const edit_config_header = this.new_instance(Header, {
            id: 'edit_config_header',
            css: {
                'margin-bottom-10px': true,
            },
            buttons: [
                {
                    id: 'edit_save_button',
                    component: EventButton,
                    id_callback: events.register_alias('edit_update_json'),
                    label: 'Update JSON <span class="glyphicon glyphicon-ok"></span>',
                    css: {
                        btn: true,
                        'btn-sm': true,
                        'btn-success': true,
                        'pull-right': true,
                    },
                },
                {
                    id: 'edit_restore_button',
                    component: EventButton,
                    id_callback: events.register_alias('edit_restore_json'),
                    label: 'Restore JSON <span class="glyphicon glyphicon-refresh"></span>',
                    css: {
                        'btn-sm': true,
                        'btn-info': true,
                        'pull-right': true,
                    },
                },
                {
                    id: 'edit_delete_button',
                    component: EventButton,
                    label: 'Delete <span class="glyphicon glyphicon-trash"></span>',
                    id_callback: events.register_alias('edit_delete_config'),
                    css: {
                        btn: true,
                        'btn-sm': true,
                        'btn-danger': true,
                        'pull-right': true,
                    },
                },
            ],
        });

        const edit_config_body = this.new_instance(Aside, {
            id: 'edit_config_body',
            template: 'tpl_aside_split_full',
            layout: {
                col_1: 'edit_config_info',
                col_2: 'config_json',
            },
            components: [edit_config_info, config_json],
        });

        const edit_config = this.new_instance(Aside, {
            id: 'edit_config',
            template: 'tpl_aside_main_content',
            layout: {
                body: ['edit_config_header', 'edit_config_body'],
            },
            components: [edit_config_header, edit_config_body],
        });

        //////////////////////////// NEW CONFIG ////////////////////////////////
        this.new_text_field = this.new_instance(TextInput, {
            id: 'new_text_field',
            allow_empty: false,
            template: 'tpl_text_input',
            placeholder: 'Config Name',
            css: {
                'input-xs': true,
            },
        });

        const new_config_info = {
            id: 'new_config_info',
            component: Aside,
            template: 'tpl_aside_body',
            layout: {
                body: ['new_text_field'],
            },
            components: [this.new_text_field],
        };

        const new_config_header = {
            id: 'new_config_header',
            component: Header,
            css: {
                'margin-bottom-10px': true,
            },
            buttons: [
                {
                    id: 'new_create_button',
                    component: EventButton,
                    id_callback: events.register_alias('create_config'),
                    label: 'Create Config <span class="glyphicon glyphicon-ok"></span>',
                    css: {
                        btn: true,
                        'btn-sm': true,
                        'btn-success': true,
                        'pull-right': true,
                    },
                },
                {
                    id: 'new_delete_button',
                    component: EventButton,
                    label: 'Delete <span class="glyphicon glyphicon-trash"></span>',
                    id_callback: events.register_alias('new_delete_config'),
                    css: {
                        btn: true,
                        'btn-sm': true,
                        'btn-danger': true,
                        'pull-right': true,
                    },
                },
            ],
        };

        const new_config_body = {
            id: 'new_config_body',
            component: Aside,
            template: 'tpl_aside_split_full',
            layout: {
                col_1: 'new_config_info',
                col_2: 'config_json',
            },
            components: [new_config_info, config_json],
        };

        const new_config = {
            id: 'new_config',
            component: Aside,
            template: 'tpl_aside_main_content',
            layout: {
                body: ['new_config_header', 'new_config_body'],
            },
            components: [new_config_header, new_config_body],
        };
        ///////////////////////// CONFIG TABLE /////////////////////////////////

        const configs_table = this.new_instance(DataTable, {
            id: 'configs_table',
            enable_selection: true,
            id_callback: events.register_alias('dataTable'),
            css: {'table-light': true, 'table-sm': true},
            columns: [
                {
                    label: 'Name',
                    sort_key: 'name',
                    format: 'contextual_link',
                    format_args: {
                        url: 'config/edit/<uid>',
                        label_key: 'name',
                    },
                },
                {
                    label: 'Last Modified',
                    key: 'modified',
                    format: 'backend_date',
                },
            ],
            datasource: {
                type: 'dynamic',
                query: {
                    target: 'commander:configs',
                    filters: {
                        type: 'dynamic',
                        query: {
                            string_filter: {
                                type: 'observer',
                                event_type: events.get('stringFilter'),
                            },
                        },
                    },
                },
            },
        });

        const configs_header = this.new_instance(Header, {
            id: 'configs_header',
            title: 'Configs ',
            buttons: [
                {
                    id: 'create',
                    label: 'Create New Config <span class="icon-plus">',
                    id_callback: events.register_alias('createConfig'),
                    action: 'create',
                    css: {
                        btn: true,
                        'btn-sm': true,
                        'btn-cpanel-success': true,
                        'pull-right': true,
                    },
                    inline_data: true,
                },
                {
                    id: 'upload_config_file',
                    id_callback: events.register_alias('upload_config'),
                    component: FileUploadButton,
                    label: 'Upload Config<span class="icon-doc">',
                    upload_endpoint: 'commander/upload_config_file',
                    allow_include_names: true,
                    max_size: max_config_size,
                    display_module: false,
                    enableChunks: true,
                    css: {
                        'btn-sm': true,
                        'btn-success': true,
                        'spacing-horizontal': true,
                    },
                },
                {
                    id: 'delete_configs',
                    label: 'Delete Configs <span class="icon-trash">',
                    id_callback: events.register_alias('delete_configs'),
                    action: 'delete_configs',
                    disable_if_no_data: true,
                    disabled_callback: data => !(data && data.length > 0),
                    css: {
                        btn: true,
                        'btn-sm': true,
                        'btn-danger': true,
                    },
                    trigger_modal: {
                        id: 'delete_multiple_configs_modal',
                        component: DeleteMultiple,
                        endpoint: 'delete_configs',
                        to_delete_table_columns: [
                            {
                                label: 'Name',
                                key: 'name',
                            },
                            {
                                name: 'UID',
                                key: 'uid',
                            },
                        ],
                        datasource: {
                            type: 'observer',
                            default: [],
                            event_type: events.get('dataTableSelected'),
                        },
                    },
                },
            ],
        });

        const search_body = {
            id: 'search_body',
            component: Aside,
            template: 'tpl_aside_main_content',
            layout: {
                body: ['configs_header', 'configs_table'],
            },
            components: [configs_header, configs_table],
        };

        const search_cpanel = {
            id: 'search_cpanel',
            component: Aside,
            template: 'tpl_aside_control_panel',
            layout: {
                body: ['name_search', 'clear'],
            },
            components: [
                {
                    id: 'name_search',
                    id_callback: events.register_alias('stringFilter'),
                    component: StringFilter,
                    placeholder: 'Search...',
                    enable_localstorage: true,
                    clear_event: events.get('clear'),
                },
                {
                    id: 'clear',
                    id_callback: events.register_alias('clear'),
                    component: EventButton,
                    template: 'tpl_cpanel_button',
                    css: {'btn-sm': true, 'btn-default': true},
                    label: 'Restore Defaults',
                },
            ],
        };

        const search_configs = {
            id: 'search_configs',
            component: Aside,
            template: 'tpl_aside_body',
            layout: {
                body: ['search_cpanel', 'search_body'],
            },
            components: [search_cpanel, search_body],
        };

        ////////////////////////////////////////////////////////////////////////

        this.page_wrapper = this.new_instance(DynamicWrapper, {
            id: 'page_wrapper',
            template: 'tpl_dynamic_wrapper',
            active_component: 'search_configs',
            set_active_event: state_change_event,
            components: [search_configs, edit_config, new_config],
        });

        this.handle_url = url => {
            if (url.length == 1) {
                Observer.broadcast(state_change_event, 'search_configs');
                Observer.broadcast(config_uid_event, url[1]);
            }
            if (url.length == 2) {
                Observer.broadcast(state_change_event, 'new_config');
            }
            if (url.length == 3) {
                const parsedurl = window.location.hash.split('/');
                this.uid(parsedurl[3]);
                Observer.broadcast(state_change_event, 'edit_config');
                Observer.broadcast(config_uid_event, url[2]);
            }
        };

        /////////////////////////////ENDPOINTS//////////////////////////////////

        let _new_config = DataThing.backends.commander({
            url: 'add_config',
        });

        let _delete_config = DataThing.backends.commander({
            url: 'delete_configs',
        });

        let _update_name = DataThing.backends.commander({
            url: 'update_config_name',
        });

        let _update_data = DataThing.backends.commander({
            url: 'update_config_data',
        });

        ////////////////////////////////////////////////////////////////////////

        this.create = () => {
            if (this.new_text_field.can_submit()) {
                try {
                    let value;
                    if (config_json_field.value() === undefined) {
                        value = null;
                    } else {
                        value = config_json_field.value();
                    }
                    const data = {
                        name: this.new_text_field.value(),
                        data: JSON.parse(value),
                    };
                    _new_config({
                        data: data,
                        success: DataThing.api.XHRSuccess(() => {
                            DataThing.status_check();
                            this.new_text_field.clear();
                            config_json_field.clear();
                            pager.navigate('#!/config');
                        }),
                    });
                } catch (e) {
                    bison.utils.Notify(
                        'Invalid JSON Syntax!',
                        'Make sure to use proper JSON formatting.',
                        'alert-danger',
                        4000,
                        undefined,
                        '<div class="system_notification alert alert-dismissable" style="display:none; width: 1000px; text-align: center; position: absolute; top: 0; left: 20%; margin-left: auto; margin-right:auto;"><button type="button" class="close" data-dismiss="alert">&times;</button></div>',
                    );
                }
            } else {
                bison.utils.Notify(
                    'Config Name cannot be empty!',
                    '',
                    'alert-danger',
                    4000,
                    undefined,
                    '<div class="system_notification alert alert-dismissable" style="display:none; width: 1000px; text-align: center; position: absolute; top: 0; left: 20%; margin-left: auto; margin-right:auto;"><button type="button" class="close" data-dismiss="alert">&times;</button></div>',
                );
            }
        };

        this.delete = () => {
            try {
                const data = {
                    uids: [this.uid()],
                };
                _delete_config({
                    data: data,
                    success: DataThing.api.XHRSuccess(() => {
                        DataThing.status_check();
                    }),
                });
                this.new_text_field.clear();
                config_json_field.clear();

                pager.navigate('#!/config');
            } catch (e) {
                bison.utils.Notify(
                    'Something went wrong!',
                    'Please refresh the page and try again.',
                    'alert-danger',
                    4000,
                    undefined,
                    '<div class="system_notification alert alert-dismissable" style="display:none; width: 1000px; text-align: center; position: absolute; top: 0; left: 20%; margin-left: auto; margin-right:auto;"><button type="button" class="close" data-dismiss="alert">&times;</button></div>',
                );
            }
        };

        this.update_json = () => {
            try {
                const data = {
                    data: JSON.parse(config_json_field.value()),
                    uid: this.uid(),
                };
                _update_data({
                    data: data,
                    success: DataThing.api.XHRSuccess(() => {
                        DataThing.status_check();
                    }),
                });
                this.new_text_field.clear();
                bison.utils.Notify(
                    'JSON Updated Successfully!',
                    '',
                    'alert-success',
                    4000,
                    undefined,
                    '<div class="system_notification alert alert-dismissable" style="display:none; width: 1000px; text-align: center; position: absolute; top: 0; left: 20%; margin-left: auto; margin-right:auto;"><button type="button" class="close" data-dismiss="alert">&times;</button></div>',
                );
            } catch (e) {
                bison.utils.Notify(
                    'Invalid JSON Syntax!',
                    'Make sure to use proper JSON formatting.',
                    'alert-danger',
                    4000,
                    undefined,
                    '<div class="system_notification alert alert-dismissable" style="display:none; width: 1000px; text-align: center; position: absolute; top: 0; left: 20%; margin-left: auto; margin-right:auto;"><button type="button" class="close" data-dismiss="alert">&times;</button></div>',
                );
            }
        };

        this.restore_name = () => {
            rename_text_field.value(config_datasource.data._latestValue.name);
        };

        this.restore_json = () => {
            config_json_field.value(restore_json_data.data._latestValue.config_data);
        };

        this.update_name = () => {
            try {
                const data = {
                    name: rename_text_field.value(),
                    uid: this.uid(),
                };
                _update_name({
                    data: data,
                    success: DataThing.api.XHRSuccess(() => {
                        DataThing.status_check();
                    }),
                });
                rename_text_field.clear();
                bison.utils.Notify(
                    'Name Changed Successfully!',
                    'Please reload the page.',
                    'alert-success',
                    4000,
                    undefined,
                    '<div class="system_notification alert alert-dismissable" style="display:none; width: 1000px; text-align: center; position: absolute; top: 0; left: 20%; margin-left: auto; margin-right:auto;"><button type="button" class="close" data-dismiss="alert">&times;</button></div>',
                );
            } catch (e) {
                bison.utils.Notify(
                    'Something went wrong!',
                    'Please refresh the page and try again.',
                    'alert-danger',
                    4000,
                    undefined,
                    '<div class="system_notification alert alert-dismissable" style="display:none; width: 1000px; text-align: center; position: absolute; top: 0; left: 20%; margin-left: auto; margin-right:auto;"><button type="button" class="close" data-dismiss="alert">&times;</button></div>',
                );
            }
        };

        //////////////////////////// OBSERVERS /////////////////////////////////

        Observer.register(events.get('createConfig'), () => {
            pager.navigate(`${window.location.hash}/edit`);
        });

        Observer.register(events.get('create_config'), () => {
            this.create();
        });

        Observer.register(events.get('edit_delete_config'), () => {
            this.delete();
        });

        Observer.register(events.get('edit_update_json'), () => {
            this.update_json();
        });

        Observer.register(events.get('edit_restore_name'), () => {
            this.restore_name();
        });

        Observer.register(events.get('edit_restore_json'), () => {
            this.restore_json();
        });

        Observer.register(events.get('edit_update_name'), () => {
            this.update_name();
        });

        // Only redirects the user back to /config since we haven't written
        // anything to the database.
        Observer.register(events.get('new_delete_config'), () => {
            pager.navigate('#!/config');
        });

        this.when(this.page_wrapper).done(() => {
            Observer.register_hash_listener('config', this.handle_url);
            this.dfd.resolve();
        });
        ////////////////////////////////////////////////////////////////////////
    }
}
