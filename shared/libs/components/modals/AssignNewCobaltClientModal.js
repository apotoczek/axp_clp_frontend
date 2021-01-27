/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import bison from 'bison';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import DataThing from 'src/libs/DataThing';
import TypeaheadInput from 'src/libs/components/TypeaheadInput';
import NewDropdown from 'src/libs/components/basic/NewDropdown';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    self.define_template(`
            <div class="modal fade" tabindex="-1" role="dialog" aria-hidden="true">
                <div class="modal-dialog modal-md">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h2 class="modal-title" data-bind="html: title"></h2>
                        </div>
                        <div class="modal-body">
                        <p style="font-style: italic;" data-bind="visible: current">Current Client Assignment</p>
                        <div style="margin-bottom: 8px">
                            <button style="vertical-align: baseline;" class="glyphicon glyphicon-remove btn btn-xs btn-danger" data-bind="click: clear, visible: current"></button>
                            <h4 style="display:inline-block" data-bind="text: current"></h4>
                        </div>
                            <div class="row">
                                <div class="col-md-6">
                                <!-- ko renderComponent: search_field --><!-- /ko -->
                                </div>
                                <div class="col-md-4">
                                <!-- ko renderComponent: permission_dropdown --><!-- /ko -->
                                </div>
                                <button type="button" class="btn btn-md btn-cpanel-success" data-bind="click:assign_new">Assign New</button>
                            </div>
                            <hr class="transparent hr-small" />
                            <button type="button" class="btn btn-default" data-dismiss="modal">Cancel</button>
                        </div>
                    </div>
                </div>
            </div>
        `);

    self.title = ko.observable('Cobalt Client');

    self.current = ko.pureComputed(() => {
        let remote_client = self.data();

        if (remote_client) {
            return self.format_current(remote_client);
        }
    });

    self.format_current = function(remote_client) {
        let current = remote_client.cobalt_client_name;

        const permissions = [];
        if (remote_client.read) {
            permissions.push('Read');
        }
        if (remote_client.write) {
            permissions.push('Write');
        }
        if (remote_client.share) {
            permissions.push('Share');
        }

        if (permissions.length) {
            current += ' - ';
            current += permissions.join('/');
        }

        return current;
    };

    self._assign_client = DataThing.backends.commander({
        url: 'assign_client_to_remote_client',
    });

    /********************************************************************
     * Components
     ********************************************************************/
    self.search_field = self.new_instance(TypeaheadInput, {
        id: 'search_field',
        placeholder: 'Search for existing client...',
        endpoint: {
            target: 'commander:clients',
            return_key: 'client_uid',
            display_key: 'name',
            query_key: 'string_filter',
            order_by: [{name: 'name_startswith'}, {name: 'name', sort: 'asc'}],
        },
    });

    self.permission_dropdown = self.new_instance(NewDropdown, {
        label: 'Active',
        btn_css: {
            'btn-md': true,
            //'btn-primary': true,
        },
        default_selected_index: 0,
        data: [
            {label: 'Read', value: 'read'},
            {label: 'Write', value: 'write'},
            {label: 'Share', value: 'share'},
        ],
    });

    /********************************************************************
     * Modal functionality
     *******************************************************************/

    self.assign_new = function() {
        let remote_client = self.data();
        let remote_client_uid = remote_client.uid;
        let uid = self.search_field.value();
        let permission = self.permission_dropdown.value();

        self._assign_client({
            data: {
                remote_client_uid: remote_client_uid,
                client_uid: uid,
                permission: permission,
            },
            success: DataThing.api.XHRSuccess(() => {
                DataThing.status_check();
            }),
            error: DataThing.api.XHRError(() => {}),
        });
    };

    self.clear = () => {
        let remote_client = self.data();
        let remote_client_uid = remote_client.uid;

        self._assign_client({
            data: {
                remote_client_uid: remote_client_uid,
                client_uid: undefined,
            },
            success: DataThing.api.XHRSuccess(() => {
                DataThing.status_check();
            }),
            error: DataThing.api.XHRError(() => {}),
        });
    };
    self.show = function() {
        bison.helpers.modal(self.template, self, self.get_id());
    };

    self.reset = function() {
        self.search_field.clear();
        bison.helpers.close_modal(self.get_id());
    };

    return self;
}
