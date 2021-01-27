/* Automatically transformed from AMD to ES6. Beware of code smell. */
import $ from 'jquery';
import Observer from 'src/libs/Observer';
import DataThing from 'src/libs/DataThing';
import DeleteModalBase from 'src/libs/components/modals/DeleteModalBase';

export default function(opts, components) {
    opts.to_delete_table_columns = [
        {
            label: 'Company',
            key: 'company_name',
        },
        {
            label: 'Valuation Type',
            key: 'valuation_type',
        },
        {
            label: 'Date',
            key: 'date',
            format: 'backend_date',
        },
    ];

    let self = new DeleteModalBase(opts, components);

    self.warning_text =
        'Are you sure you want to delete these valuations? This action can not be undone.';

    self.dfd = $.Deferred();

    self.dfds.push(self.dfd);

    self._delete_company_valuations = DataThing.backends.useractionhandler({
        url: 'delete_company_valuations',
    });

    self.delete_entities = function() {
        let data = self.data_to_delete();

        if (data && data.length > 0) {
            self.loading(true);

            self._delete_company_valuations({
                data: {
                    uids: data.map(valuation => {
                        return valuation.uid;
                    }),
                },
                success: DataThing.api.XHRSuccess(() => {
                    DataThing.status_check();
                    self.reset();
                    Observer.broadcast_for_id(self.get_id(), 'DeleteValuationModal.success');
                }),
            });
        }
    };

    self.dfd.resolve();

    return self;
}
