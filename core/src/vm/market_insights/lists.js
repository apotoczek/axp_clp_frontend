/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ListViewer from 'src/libs/components/market_insights/lists/ListViewer';
import ListSearch from 'src/libs/components/market_insights/lists/ListSearch';
import pager from 'pager';
import Context from 'src/libs/Context';
import DynamicWrapper from 'src/libs/components/basic/DynamicWrapper';
import Observer from 'src/libs/Observer';
import * as Utils from 'src/libs/Utils';

export default function() {
    let self = new Context({
        id: 'lists',
    });

    self.dfd = self.new_deferred();

    self.clear_event = Utils.gen_event(
        'EventButton',
        self.get_id(),
        'cpanel',
        'tools',
        'clear_button',
    );

    self.hash_event = Utils.gen_event('HashListener', self.get_id());
    self.list_uid_event = Utils.gen_event('List.uid', self.get_id());

    self.page_wrapper = self.new_instance(DynamicWrapper, {
        id: 'page_wrapper',
        template: 'tpl_dynamic_wrapper',
        active_component: 'search',
        set_active_event: self.hash_event,
        components: [
            {
                component: ListSearch,
                id: 'search',
            },
            {
                component: ListViewer,
                list_uid_event: self.list_uid_event,
                id: 'list',
            },
        ],
    });

    self.handle_url = function(url) {
        if (url.length === 1) {
            Observer.broadcast(self.hash_event, 'search');
            Observer.broadcast_for_id('UserAction', 'record_action', {
                action_type: 'view_market_data_lists',
            });
            return true;
        } else if (url.length === 2) {
            if (Utils.valid_uid(url[1])) {
                Observer.broadcast(self.hash_event, 'list');
                Observer.broadcast(self.list_uid_event, url[1], true);
                return true;
            }
        }

        return false;
    };

    self.when(self.page_wrapper).done(() => {
        Observer.register_hash_listener('lists', url => {
            let match = self.handle_url(url);

            if (!match) {
                pager.navigate('#!/lists');
            }
        });

        self.dfd.resolve();
    });

    return self;
}
