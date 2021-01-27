/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ActionClient from 'src/libs/components/action_activity/ActionClient';
import ActionUser from 'src/libs/components/action_activity/ActionUser';
import ActionSearch from 'src/libs/components/action_activity/ActionSearch';
import Context from 'src/libs/Context';
import * as Utils from 'src/libs/Utils';
import Observer from 'src/libs/Observer';
import DynamicWrapper from 'src/libs/components/basic/DynamicWrapper';

export default function() {
    let self = new Context({
        id: 'actions',
    });

    self.dfd = self.new_deferred();

    self.uid_events = {
        client: Utils.gen_event(self.get_id(), 'client_uid'),
        user: Utils.gen_event(self.get_id(), 'user_uid'),
    };

    self.search_state = {
        component: ActionSearch,
        id: 'search',
    };

    self.user_state = {
        id: 'user',
        component: ActionUser,
        user_uid_event: self.uid_events.user,
    };

    self.client_state = {
        id: 'client',
        component: ActionClient,
        client_uid_event: self.uid_events.client,
    };

    self.state_change = Utils.gen_event(self.get_id(), 'state');

    self.page_wrapper = self.new_instance(DynamicWrapper, {
        id: 'page_wrapper',
        template: 'tpl_dynamic_wrapper',
        active_component: 'search',
        set_active_event: self.state_change,
        components: [self.search_state, self.user_state, self.client_state],
    });

    self.handle_url = url => {
        if (url.length === 1) {
            Observer.broadcast(self.state_change, 'search');
        } else if (url.length === 3) {
            Observer.broadcast(self.state_change, url[1]);
            Observer.broadcast(self.uid_events[url[1]], url[2]);
        }
    };

    self.when(self.page_wrapper).done(() => {
        self.dfd.resolve();

        Observer.register_hash_listener('action-activity', self.handle_url);
    });

    return self;
}
