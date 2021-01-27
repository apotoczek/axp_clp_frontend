/* Automatically transformed from AMD to ES6. Beware of code smell. */
import $ from 'jquery';
import Observer from 'src/libs/Observer';
import DataThing from 'src/libs/DataThing';
import DeleteModalBase from 'src/libs/components/modals/DeleteModalBase';

export default function(opts, components) {
    opts.to_delete_table_columns = [
        {
            label: 'Date',
            key: 'date',
            format: 'backend_date',
        },
        {
            label: 'Amount',
            key: 'amount',
            format: 'number',
        },
        {
            label: 'Type',
            key: 'cf_type',
            format: 'cf_type',
        },
        {
            label: 'Note',
            key: 'note',
        },
    ];

    let self = new DeleteModalBase(opts, components);

    self.warning_text =
        'Are you sure you want to delete these cashflows? This action can not be undone.';

    self.dfd = $.Deferred();

    self.dfds.push(self.dfd);

    self._delete_cashflows = DataThing.backends.useractionhandler({
        url: 'delete_cashflows',
    });

    self.delete_entities = function() {
        let data = self.data_to_delete();

        if (data && data.length > 0) {
            self.loading(true);

            self._delete_cashflows({
                data: {
                    cashflow_uids: data.map(cashflow => {
                        return cashflow.uid;
                    }),
                },
                success: DataThing.api.XHRSuccess(() => {
                    self.reset();
                    Observer.broadcast_for_id(self.get_id(), 'DeleteCashflowModal.success');
                }),
            });
        }
    };

    self.dfd.resolve();

    return self;
}
