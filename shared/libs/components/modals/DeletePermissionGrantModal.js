/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import DeleteModalBase from 'src/libs/components/modals/DeleteModalBase';
import DataThing from 'src/libs/DataThing';

export default function(opts, components) {
    let self = new DeleteModalBase(
        {
            ...opts,
            to_delete_table_columns: [
                {
                    label: 'Permission',
                    key: 'permission:name',
                },
                {
                    label: 'Type',
                    key: 'is_client_permission',
                    format: 'boolean',
                    format_args: {
                        yes: 'Inherited',
                        no: 'User',
                    },
                },
                {
                    label: 'Valid',
                    key: 'valid',
                    format: 'boolean_highlight',
                    format_args: {
                        css: {
                            yes: 'text-green',
                        },
                    },
                },
                {
                    label: 'Why Invalid',
                    key: 'why_invalid',
                    format: 'titleize',
                },
                {
                    label: 'Expiry',
                    key: 'expiry',
                    format: 'backend_datetime',
                },
                {
                    label: 'Disabled',
                    key: 'disabled',
                    format: 'boolean',
                },
                {
                    label: 'Created',
                    key: 'created',
                    format: 'backend_datetime',
                },
            ],
        },
        components,
    );

    let _dfd = self.new_deferred();

    self.template = opts.template || 'tpl_delete_modal';
    self.warning_text = ko.computed(() => {
        let data = self.data();
        if (data && data.is_client_permission) {
            return "<span class='text-danger'><strong>Note: </strong>This is a client permission. This action will affect all users for this client and cannot be undone.</span>";
        }
        return 'Are you sure you want to delete these permissions? This action can not be undone.';
    });

    self.btn_text = 'Delete';

    self._delete_permission_grants = DataThing.backends.commander({
        url: 'delete_permission_grants',
    });

    self.delete_entities = function() {
        let grants = self.data_to_delete();

        if (grants) {
            self._delete_permission_grants({
                data: {
                    uids: grants.map('uid'),
                },
                success: DataThing.api.XHRSuccess(() => {
                    DataThing.status_check();
                    self.reset();
                }),
                error: DataThing.api.XHRSuccess(response => {
                    alert(response);
                }),
            });
        }
    };

    _dfd.resolve();

    return self;
}
