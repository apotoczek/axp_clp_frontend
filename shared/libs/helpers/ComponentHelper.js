/* Automatically transformed from AMD to ES6. Beware of code smell. */
import NewPopoverButton from 'src/libs/components/popovers/NewPopoverButton';
import Radiolist from 'src/libs/components/basic/Radiolist';

let self = {};

self.cpanel = {
    currency_radiolist: function({
        id,
        id_callback = null,
        user_fund_uid_event = null,
        label = 'Currency',
        track_selection = true,
        extra_options = [],
        visible_callback = null,
        css = {
            'btn-block': true,
            'btn-cpanel-primary': true,
            'btn-sm': true,
        },
        popover_css_class = 'popover-cpanel',
        placement = 'right',
    }) {
        let popover_config = {
            component: Radiolist,
            option_disabled_key: 'invalid',
            datasource: {
                mapping: 'to_options',
                mapping_args: {
                    value_key: 'id',
                    label_keys: ['symbol', 'name'],
                    additional_keys: ['symbol', 'invalid'],
                    extra_options: extra_options,
                },
                type: 'dynamic',
                query: {
                    target: 'currency:markets',
                },
            },
        };

        if (user_fund_uid_event) {
            popover_config.selected_datasource = {
                key: 'base_currency',
                type: 'dynamic',
                query: {
                    target: 'vehicle:currency_id',
                    user_fund_uid: {
                        type: 'observer',
                        event_type: user_fund_uid_event,
                        required: true,
                    },
                },
            };

            popover_config.datasource.query.user_fund_uid = {
                type: 'observer',
                event_type: user_fund_uid_event,
                required: true,
            };
        }

        return {
            id: id,
            id_callback: id_callback,
            component: NewPopoverButton,
            label: label,
            label_track_selection: track_selection,
            css: css,
            popover_options: {
                title: `Select ${label}`,
                placement: placement,
                css_class: popover_css_class,
            },
            popover_config: popover_config,
            visible_callback: visible_callback || undefined,
        };
    },
};

export default self;
