/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import Context from 'src/libs/Context';
import Observer from 'src/libs/Observer';
import * as Utils from 'src/libs/Utils';
import RegExps from 'src/libs/RegExps';
import VehicleHelper from 'src/libs/helpers/VehicleHelper';
import EventRegistry from 'src/libs/components/basic/EventRegistry';
import SearchAnalytics from 'src/libs/components/analytics/SearchAnalytics';
import NetAnalytics from 'src/libs/components/analytics/NetAnalytics';
import GrossAnalytics from 'src/libs/components/analytics/GrossAnalytics';

export default function() {
    let self = new Context({
        id: 'portfolio-analytics',
    });

    self.dfd = self.new_deferred();

    let reset_event = Utils.gen_event('Analytics.reset', self.get_id());
    let mode_events = self.new_instance(EventRegistry, {});
    mode_events.new('net_portfolio');
    mode_events.new('gross_portfolio');

    let default_modes = {
        net_portfolio: 'overview',
        gross_portfolio: 'fund_performance',
    };

    self.loading = ko.observable(false);

    /********************************************************************
     * Generators for lazy loading of instances
     *******************************************************************/

    let gen = {
        /****************************************************************
         * Search mode. Active when url is just #!/analytics.
         ***************************************************************/
        search() {
            return self.new_instance(SearchAnalytics, {
                id: 'search',
                entity_type: 'portfolio',
                base_url: '#!/portfolio-analytics',
                breadcrumbs: [
                    {
                        label: 'Investments',
                    },
                    {
                        label: 'Portfolios',
                    },
                ],
            });
        },

        /****************************************************************
         * Net fund and portfolio modes
         ***************************************************************/
        net_portfolio() {
            return self.new_instance(NetAnalytics, {
                id: 'net_portfolio',
                entity_type: 'portfolio',
                reset_event: reset_event,
                get_user: true,
                set_mode_event: mode_events.get('net_portfolio'),
                default_mode: default_modes.net_portfolio,
                breadcrumb_base: [
                    {
                        label: 'Investments',
                    },
                    {
                        label: 'Portfolios',
                        link: '#!/portfolio-analytics',
                    },
                ],
            });
        },

        /****************************************************************
         * Gross fund and portfolio modes
         ***************************************************************/
        gross_portfolio() {
            return self.new_instance(GrossAnalytics, {
                id: 'gross_portfolio',
                entity_type: 'portfolio',
                reset_event: reset_event,
                get_user: true,
                set_mode_event: mode_events.get('gross_portfolio'),
                default_mode: default_modes.gross_portfolio,
                deal_url: 'company-analytics/<company_uid>',
                breadcrumb_base: [
                    {
                        label: 'Investments',
                    },
                    {
                        label: 'Portfolios',
                        link: '#!/portfolio-analytics',
                    },
                ],
            });
        },
    };

    /********************************************************************
     * Used to load up an instance
     *******************************************************************/

    self.instances = {};

    self.instance = name => {
        if (!self.instances[name]) {
            self.instances[name] = gen[name]();
        }

        return self.instances[name];
    };

    /********************************************************************
     * Active observable. Contains one of the modes defined above.
     *******************************************************************/

    self.active = ko.observable();

    /********************************************************************
         * Each of the modes has an 'asides' property which is essentially
           what columns to render.
         *******************************************************************/

    self.asides = ko.computed(() => {
        let active = self.active();
        if (active && active.asides) {
            return ko.unwrap(active.asides);
        }
    });

    /********************************************************************
         * Url matching function. Takes an array of url components and
           figures out the entity_type, cashflow_type, uids and
           what mode to activate.
         *******************************************************************/

    self.match_url = function(url) {
        return Utils.match_array(url, [
            'portfolio-analytics',
            'portfolio',
            /^(net|gross)$/,
            RegExps.uuid,
            (cashflow_type, uid, mode) => ({
                entity_type: 'portfolio',
                cashflow_type,
                uid,
                mode: VehicleHelper.url_to_mode(mode),
            }),
        ]);
    };

    /********************************************************************
         * URL listener. Subscribes to the hash that starts with
           #!/analytics. Uses the url matching funciton to determine what
           mode to activate.
         *******************************************************************/

    self.get_uid_event = entity_type => {
        return `Active.${entity_type}_uid`;
    };

    let prev_uid = undefined;
    let prev_instance_name = undefined;

    self.default_state = () => {
        let active = self.active();

        if (active) {
            Observer.broadcast_for_id(active.get_id(), 'Active.portfolio_uid', undefined);
        }

        let search = self.instance('search');

        self.loading(true);

        self.when(search).done(() => {
            prev_uid = undefined;
            prev_instance_name = undefined;

            self.active(search);
            self.loading(false);
        });
    };

    Observer.register('DeleteModal.delete_entities', payload => {
        if (payload.portfolio_uids.length) {
            Observer.broadcast_for_id(
                self.instance('net_portfolio').get_id(),
                'Active.portfolio_uid',
                undefined,
            );
            Observer.broadcast_for_id(
                self.instance('gross_portfolio').get_id(),
                'Active.portfolio_uid',
                undefined,
            );
        }
    });

    Observer.register_hash_listener('portfolio-analytics', url => {
        let match = self.match_url(url);

        if (match) {
            let instance_name = `${match.cashflow_type}_${match.entity_type}`;
            let instance = self.instance(instance_name);
            let uid = match.uid;
            let mode = match.mode || default_modes[instance_name];

            self.loading(true);

            self.when(instance).done(() => {
                Observer.broadcast(mode_events.get(instance_name), mode);

                if (prev_instance_name != instance_name || prev_uid != uid) {
                    Observer.broadcast_for_id(
                        instance.get_id(),
                        self.get_uid_event(match.entity_type),
                        match.uid,
                        true,
                    );
                    Observer.broadcast_for_id(instance.get_id(), reset_event);
                }

                prev_uid = uid;
                prev_instance_name = instance_name;

                self.active(instance);
                self.loading(false);
            });

            Observer.broadcast_for_id('UserAction', 'record_action', {
                action_type: 'view_analytics_entity',
                entity_type: 'portfolio',
                identifier: match.uid,
            });
        } else {
            self.default_state();
        }
    });

    self.dfd.resolve();

    return self;
}
