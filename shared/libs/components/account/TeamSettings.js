/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import DataSource from 'src/libs/DataSource';
import DataTable from 'src/libs/components/basic/DataTable';
import InviteUsersModal from 'src/libs/components/modals/InviteUsersModal';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    self.invite_users_modal = new InviteUsersModal();

    self.client = new DataSource({
        datasource: {
            type: 'dynamic',
            query: {
                target: 'client',
                exclude_disabled_users: true,
            },
        },
    });

    self.team = new DataTable({
        parent_id: self.get_id(),
        results_per_page: 50,
        // label: 'Members',
        enable_clear_order: true,
        id: 'team',
        inline_data: true,
        css: 'table-light table-sm',
        columns: [
            {
                label: 'Name',
                key: 'name',
            },
            {
                label: 'Email',
                key: 'email',
            },
        ],
        data: ko.computed(() => {
            let data = self.client.data();
            if (data && data.users) {
                return data.users;
            }
            return [];
        }),
    });

    return self;
}
