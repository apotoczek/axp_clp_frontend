/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import bison from 'bison';
import DeleteModalBase from 'src/libs/components/modals/DeleteModalBase';
import DataThing from 'src/libs/DataThing';

export default function(opts, components) {
    let self = new DeleteModalBase(
        {
            ...opts,
            to_delete_table_columns: [
                {
                    label: 'Client Name',
                    key: 'name',
                },
                {
                    label: 'Number of Users',
                    key: 'num_users',
                },
                {
                    label: 'Disabled',
                    key: 'disabled',
                    format: 'boolean',
                },
                {
                    label: 'Disabled Date',
                    key: 'disabled_date',
                    format: 'backend_datetime',
                },
                {
                    label: 'Created',
                    key: 'created',
                    format: 'backend_datetime',
                },
                {
                    label: 'Last Sign in Date',
                    key: 'last_sign_in_date',
                    format: 'backend_datetime',
                },
            ],
        },
        components,
    );

    let _dfd = self.new_deferred();

    self.template = opts.template || 'tpl_delete_modal';
    self.warning_text = ko.computed(() => {
        const data = self.data();

        if (data && data.is_client_permission) {
            return "<span class='text-danger'><strong>Note: </strong>This is a client. This action will affect all funds for this client and cannot be undone.</span>";
        }
        return "Are you sure you want to delete this client's data? This action can not be undone.";
    });

    self.btn_text = 'Delete Data';

    self._delete_client_data = DataThing.backends.commander({
        url: 'delete_client_data',
    });

    self.delete_entities = () => {
        const clients_to_delete = self.data_to_delete();
        if (clients_to_delete) {
            self._delete_client_data({
                data: {
                    uids: clients_to_delete.map('uid'),
                },
                success: DataThing.api.XHRSuccess(response => {
                    DataThing.status_check();

                    bison.utils.Notify('Success!', response, 'alert-success', 6000);
                    self.reset();
                }),
                error: DataThing.api.XHRSuccess(response => {
                    bison.utils.Notify('Delete failed!', response, 'alert-danger');
                }),
            });
        }
    };

    _dfd.resolve();

    return self;
}
