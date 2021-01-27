/* Automatically transformed from AMD to ES6. Beware of code smell. */
import $ from 'jquery';
import DataThing from 'src/libs/DataThing';
import DeleteModalBase from 'src/libs/components/modals/DeleteModalBase';

export default function(opts, components) {
    opts.to_delete_table_columns = [
        {
            label: 'Name',
            key: 'company_name',
        },
    ];

    let self = new DeleteModalBase(opts, components);

    self.warning_text =
        'Are you sure you want to delete these deals? This action can not be undone.';

    self.dfd = $.Deferred();

    self.dfds.push(self.dfd);

    self._delete_deals = DataThing.backends.useractionhandler({
        url: 'delete_deals',
    });

    self.delete_entities = function() {
        let deals = self.data_to_delete();
        if (deals && deals.length > 0) {
            self.loading(true);

            self._delete_deals({
                data: {
                    deal_uids: deals.map(({uid}) => uid),
                },
                success: DataThing.api.XHRSuccess(() => {
                    DataThing.status_check();
                    self.reset();
                }),
            });
        }
    };

    self.dfd.resolve();

    return self;
}
