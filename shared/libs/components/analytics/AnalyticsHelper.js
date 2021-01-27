import Context from 'src/libs/Context';
import AttributeFilters from 'src/libs/components/AttributeFilters';

class AnalyticsHelper extends Context {
    static cf_attr_filter_config({
        id,
        id_callback = null,
        user_fund_uid_event = null,
        portfolio_uid_event = null,
        clear_event = null,
    }) {
        return {
            id: id,
            id_callback: id_callback,
            component: AttributeFilters,
            clear_event: clear_event,
            datasource: {
                type: 'dynamic',
                one_required: ['user_fund_uid', 'portfolio_uid'],
                query: {
                    target: 'cash_flow_attribute_filter_configs',
                    user_fund_uid: {
                        type: 'observer',
                        event_type: user_fund_uid_event,
                    },
                    portfolio_uid: {
                        type: 'observer',
                        event_type: portfolio_uid_event,
                    },
                },
            },
            css: {
                'cpanel-btn-sm': true,
                'btn-block': true,
                'btn-cpanel-primary': true,
            },
        };
    }
}

export default AnalyticsHelper;
