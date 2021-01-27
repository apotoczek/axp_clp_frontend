/* Automatically transformed from AMD to ES6. Beware of code smell. */
import $ from 'jquery';
import pager from 'pager';
import Observer from 'src/libs/Observer';
import DataThing from 'src/libs/DataThing';
import ArchiveModalBase from 'src/libs/components/modals/ArchiveModalBase';

export default function(opts, components) {
    let self = new ArchiveModalBase(opts, components);

    self.dfd = $.Deferred();
    self.dfds.push(self.dfd);

    self._archive_entities = DataThing.backends.useractionhandler({
        url: 'archive_entities',
    });

    self.archive_entities = function() {
        let data = self.data_to_archive();

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

            self._archive_entities({
                data: {
                    user_fund_uids: user_fund_uids,
                    portfolio_uids: portfolio_uids,
                    user_market_uids: user_market_uids,
                },
                success: DataThing.api.XHRSuccess(() => {
                    self.reset();

                    Observer.broadcast_for_id(self.get_id(), 'ArchiveModal.archive_entities', {
                        user_fund_uids: user_fund_uids,
                        portfolio_uids: portfolio_uids,
                        user_market_uids: user_market_uids,
                    });

                    Observer.broadcast('ArchiveModal.archive_entities', {
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
