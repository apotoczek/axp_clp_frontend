/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import $ from 'jquery';
import Observer from 'src/libs/Observer';
import DataThing from 'src/libs/DataThing';
import DeleteModalBase from 'src/libs/components/modals/DeleteModalBase';

export default function(opts, components) {
    opts.to_delete_table_columns = [
        {
            label: 'Name',
            key: 'name',
        },
    ];

    let self = new DeleteModalBase(opts, components);

    self.warning_text =
        'Are you sure you want to remove these funds from the portfolio? The funds will not be deleted.';
    self.btn_text = 'Remove';

    self.dfd = $.Deferred();
    self.dfds.push(self.dfd);

    self.vehicle_uid_event = opts.vehicle_uid_event;
    self.vehicle_uid = ko.observable();

    if (self.vehicle_uid_event) {
        Observer.register(self.vehicle_uid_event, uid => {
            self.vehicle_uid(uid);
        });
    }

    self._remove_funds_from_portfolio = DataThing.backends.useractionhandler({
        url: 'remove_funds_from_portfolio',
    });

    self.delete_entities = function() {
        let data = self.data_to_delete();
        if (data && data.length > 0) {
            self.loading(true);

            let funds = data.map(fund => {
                return {
                    user_fund_uid: fund.uid,
                };
            });

            self._remove_funds_from_portfolio({
                data: {
                    portfolio_uid: self.vehicle_uid(),
                    funds: funds,
                },
                success: DataThing.api.XHRSuccess(() => {
                    self.reset();
                    Observer.broadcast_for_id(self.get_id(), 'DeleteFundInPortfolioModal.success');
                    DataThing.status_check();
                }),
            });
        }
    };

    self.dfd.resolve();

    return self;
}
