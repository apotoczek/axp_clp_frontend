/* Automatically transformed from AMD to ES6. Beware of code smell. */
import $ from 'jquery';
import pager from 'pager';
import Observer from 'src/libs/Observer';
import DataThing from 'src/libs/DataThing';
import UnArchiveModalBase from 'src/libs/components/modals/UnArchiveModalBase';

export default function(opts, components) {
    let self = new UnArchiveModalBase(opts, components);

    self.dfd = $.Deferred();
    self.dfds.push(self.dfd);

    self._unarchive_entities = DataThing.backends.useractionhandler({
        url: 'unarchive_entities',
    });

    self.unarchive_entities = function() {
        let data = self.data_to_restore();

        let user_fund_uids = [];
        let portfolio_uids = [];
        let user_market_uids = [];

        if (data && data.length > 0) {
            self.loading(true);

            for (let i = 0, l = data.length; i < l; i++) {
                if (data[i].user_fund_uid) {
                    user_fund_uids.push(data[i].user_fund_uid);
                }
                if (data[i].portfolio_uid) {
                    portfolio_uids.push(data[i].portfolio_uid);
                }
                if (data[i].user_market_uid) {
                    user_market_uids.push(data[i].user_market_uid);
                }
            }

            self._unarchive_entities({
                data: {
                    user_fund_uids: user_fund_uids,
                    portfolio_uids: portfolio_uids,
                    user_market_uids: user_market_uids,
                },
                success: DataThing.api.XHRSuccess(() => {
                    self.reset();

                    Observer.broadcast_for_id(self.get_id(), 'UnArchiveModal.restore_entities', {
                        user_fund_uids: user_fund_uids,
                        portfolio_uids: portfolio_uids,
                        user_market_uids: user_market_uids,
                    });

                    Observer.broadcast('UnArchiveModal.restore_entities', {
                        user_fund_uids: user_fund_uids,
                        portfolio_uids: portfolio_uids,
                        user_market_uids: user_market_uids,
                    });

                    if (self.origin_url) {
                        pager.navigate(self.origin_url);
                    }

                    setTimeout(() => {
                        DataThing.status_check();
                    }, 200);
                }),
            });
        }
    };

    self.dfd.resolve();

    return self;
}
