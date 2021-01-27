/* Automatically transformed from AMD to ES6. Beware of code smell. */
import EnumValuesForm from 'src/libs/components/datamanager/EnumValuesForm';
import Context from 'src/libs/Context';
import auth from 'auth';

export default function(opts) {
    let self = new Context({});

    self.events_fund_uid = opts.event_fund_uid;

    self.fund_fields = [
        {
            label: 'Name',
            key: 'name',
            input_type: 'text',
            input_options: {
                placeholder: 'Name',
                allow_empty: false,
            },
        },
        {
            label: 'Firm',
            input_type: 'typeahead',
            key: 'firm_uid',
            input_options: {
                placeholder: 'Firm',
                allow_empty: false,
                endpoint: {
                    target: 'commander:firms',
                    query_key: 'string_filter',
                    display_key: 'name',
                    return_key: 'uid',
                    order_by: [{name: 'name_startswith'}, {name: 'name', sort: 'asc'}],
                },
                selected_datasource: {
                    type: 'dynamic',
                    mapping: 'filter_object',
                    mapping_args: {
                        key_map: {
                            firm_uid: 'uid',
                            firm_name: 'name',
                        },
                    },
                    query: {
                        target: 'commander:fund',
                        uid: {
                            type: 'observer',
                            event_type: self.events_fund_uid,
                            required: true,
                        },
                    },
                },
            },
        },
        {
            label: 'Family',
            input_type: 'typeahead',
            key: 'family_uid',
            input_options: {
                placeholder: 'Family',
                allow_empty: false,
                endpoint: {
                    target: 'commander:families',
                    query_key: 'string_filter',
                    display_key: 'name',
                    return_key: 'uid',
                    order_by: [{name: 'name_startswith'}, {name: 'name', sort: 'asc'}],
                },
                selected_datasource: {
                    type: 'dynamic',
                    mapping: 'filter_object',
                    mapping_args: {
                        key_map: {
                            family_uid: 'uid',
                            family_name: 'name',
                        },
                    },
                    query: {
                        target: 'commander:fund',
                        uid: {
                            type: 'observer',
                            event_type: self.events_fund_uid,
                            required: true,
                        },
                    },
                },
            },
        },
        {
            label: 'Vintage Year',
            key: 'vintage_year',
            input_type: 'number',
            input_options: {
                format: 'no_format',
                placeholder: 'Vintage year',
                allow_empty: true,
                value_on_empty: null,
            },
        },
        {
            label: 'Currency',
            key: 'currency_symbol',
            input_type: 'filtered_dropdown',
            input_options: {
                limit: 10,
                min_filter_length: 1,
                label: 'Currency',
                btn_style: '',
                enable_add: true,
                strings: {},
                btn_css: {
                    'btn-ghost-info': true,
                },
                datasource: {
                    type: 'dynamic',
                    mapping: 'to_options',
                    mapping_args: {
                        value_key: 'symbol',
                        label_key: 'symbol',
                    },
                    query: {
                        target: 'currency:markets',
                    },
                },
            },
        },
        {
            label: 'Target Size',
            key: 'target_size_value',
            input_type: 'number',
            input_options: {
                placeholder: 'Target size',
                allow_empty: true,
                value_on_empty: null,
            },
        },
        {
            label: 'Total Sold',
            key: 'total_sold_value',
            input_type: 'number',
            input_options: {
                placeholder: 'Total sold',
                allow_empty: true,
                value_on_empty: null,
            },
        },
        {
            label: 'First Close',
            key: 'first_close',
            input_type: 'date',
            input_options: {
                placeholder: 'First close',
                allow_empty: true,
                value_on_empty: null,
            },
        },
        {
            label: 'Final Close',
            key: 'final_close',
            input_type: 'date',
            input_options: {
                placeholder: 'Final Close',
                allow_empty: true,
                value_on_empty: null,
            },
        },
        {
            label: 'Status',
            key: 'status_uid',
            input_type: 'dropdown',
            input_options: {
                allow_empty: false,
                value_key: 'uid',
                label_key: 'name',
                datasource: {
                    type: 'dynamic',
                    key: 'results',
                    query: {
                        target: 'commander:fund_statuses',
                    },
                },
            },
        },
        {
            key: 'style',
            label: 'Style',
            input_type: 'new_popover_button',
            input_options: {
                label: 'Style / Focus',
                track_selection_property: 'selected_summary',
                ellipsis: true,
                icon_css: 'caret',
                css: {
                    'btn-block': true,
                    'btn-ghost-info': true,
                },
                popover_options: {
                    placement: 'bottom',
                    title: 'Style / Focus',
                    css_class: 'popover-enums',
                },
                popover_config: {
                    component: EnumValuesForm,
                    attribute_identifier: 'style',
                    options_target: 'attribute:editable_data',
                    selected_datasource: {
                        type: 'dynamic',
                        disable_cache: true,
                        query: {
                            target: 'commander:enum_values_for_entity',
                            entity_uid: {
                                type: 'observer',
                                event_type: self.events_fund_uid,
                                required: true,
                            },
                            attribute_identifier: 'style',
                        },
                    },
                },
            },
        },
        {
            key: 'geography',
            label: 'Geography',
            input_type: 'new_popover_button',
            input_options: {
                track_selection_property: 'selected_summary',
                ellipsis: true,
                label: 'Geography',
                icon_css: 'caret',
                css: {
                    'btn-block': true,
                    'btn-ghost-info': true,
                },
                popover_options: {
                    placement: 'bottom',
                    title: 'Geography',
                    css_class: 'popover-enums',
                },
                popover_config: {
                    component: EnumValuesForm,
                    attribute_identifier: 'geography',
                    options_target: 'attribute:editable_data',
                    selected_datasource: {
                        type: 'dynamic',
                        disable_cache: true,
                        query: {
                            target: 'commander:enum_values_for_entity',
                            entity_uid: {
                                type: 'observer',
                                event_type: self.events_fund_uid,
                                required: true,
                            },
                            attribute_identifier: 'geography',
                        },
                    },
                },
            },
        },
        {
            key: 'sector',
            label: 'Sector',
            input_type: 'new_popover_button',
            input_options: {
                label: 'Sector',
                track_selection_property: 'selected_summary',
                ellipsis: true,
                icon_css: 'caret',
                css: {
                    'btn-block': true,
                    'btn-ghost-info': true,
                },
                popover_options: {
                    placement: 'bottom',
                    title: 'Sector',
                    css_class: 'popover-enums',
                },
                popover_config: {
                    component: EnumValuesForm,
                    attribute_identifier: 'sector',
                    options_target: 'attribute:editable_data',
                    selected_datasource: {
                        type: 'dynamic',
                        disable_cache: true,
                        query: {
                            target: 'commander:enum_values_for_entity',
                            entity_uid: {
                                type: 'observer',
                                event_type: self.events_fund_uid,
                                required: true,
                            },
                            attribute_identifier: 'sector',
                        },
                    },
                },
            },
        },
        {
            label: 'Ordinal',
            input_type: 'text',
            key: 'ordinal_value',
            input_options: {
                allow_empty: false,
                custom_validator: {
                    function: function(e) {
                        return e != undefined && e > 0;
                    },
                    message: 'Can not be empty or less than 1',
                },
            },
        },
        {
            label: 'Ordinal style',
            key: 'ordinal_style',
            input_type: 'dropdown',
            input_options: {
                datasource: {
                    type: 'static',
                    data: [
                        {
                            label: 'Integer year',
                            value: 'int_year',
                        },
                        {
                            label: 'Roman',
                            value: 'roman',
                        },
                        {
                            label: 'Integer',
                            value: 'int',
                        },
                        {
                            label: 'Numeric word',
                            value: 'num_words',
                        },
                        {
                            label: 'Alpha',
                            value: 'alpha',
                        },
                        {
                            label: 'Inherit',
                            value: 'inherit',
                        },
                    ],
                },
            },
        },
        {
            label: 'Included in BUSMI',
            key: 'busmi',
            input_type: 'dropdown',
            input_options: {
                default_selected_index: 0,
                datasource: {
                    type: 'static',
                    data: [
                        {
                            label: 'No',
                            value: false,
                        },
                        {
                            label: 'Yes',
                            value: true,
                        },
                    ],
                },
            },
        },
    ];

    if (auth.user_has_feature('static_fund_performance')) {
        self.fund_fields.push(
            {
                label: 'IRR',
                key: 'irr',
                input_type: 'number',
                input_options: {
                    placeholder: 'IRR',
                    allow_empty: true,
                    value_on_empty: null,
                },
            },
            {
                label: 'DPI',
                key: 'dpi',
                input_type: 'number',
                input_options: {
                    placeholder: 'DPI',
                    allow_empty: true,
                    value_on_empty: null,
                },
            },
            {
                label: 'TVPI',
                key: 'tvpi',
                input_type: 'number',
                input_options: {
                    placeholder: 'TVPI',
                    allow_empty: true,
                    value_on_empty: null,
                },
            },
            {
                label: 'RVPI',
                key: 'rvpi',
                input_type: 'number',
                input_options: {
                    placeholder: 'RVPI',
                    allow_empty: true,
                    value_on_empty: null,
                },
            },
            {
                label: 'Paid in %',
                key: 'picc',
                input_type: 'number',
                input_options: {
                    placeholder: 'Paid In %',
                    allow_empty: true,
                    value_on_empty: null,
                },
            },
            {
                label: 'As of Date',
                key: 'as_of_date',
                input_type: 'date',
                input_options: {
                    placeholder: 'As of Date',
                    allow_empty: true,
                    value_on_empty: null,
                },
            },
            {
                label: 'Gross Invested',
                key: 'gross_invested',
                input_type: 'number',
                input_options: {
                    placeholder: 'Gross Invested',
                    allow_empty: true,
                    value_on_empty: null,
                },
            },
            {
                label: 'Gross Realized',
                key: 'gross_realized',
                input_type: 'number',
                input_options: {
                    placeholder: 'Gross Realized',
                    allow_empty: true,
                    value_on_empty: null,
                },
            },
            {
                label: 'Gross Unrealized',
                key: 'gross_unrealized',
                input_type: 'number',
                input_options: {
                    placeholder: 'Gross Unrealized',
                    allow_empty: true,
                    value_on_empty: null,
                },
            },
            {
                label: 'Gross Multiple',
                key: 'gross_multiple',
                input_type: 'number',
                input_options: {
                    placeholder: 'Gross Multiple',
                    allow_empty: true,
                    value_on_empty: null,
                },
            },
            {
                label: 'Gross IRR',
                key: 'gross_irr',
                input_type: 'number',
                input_options: {
                    placeholder: 'Gross IRR',
                    allow_empty: true,
                    value_on_empty: null,
                },
            },
        );
    }

    self.firm_fields = [
        {
            label: 'Name',
            key: 'name',
            input_type: 'text',
            input_options: {
                placeholder: 'Name',
                allow_empty: false,
            },
        },
        {
            label: 'Location',
            key: 'location',
            input_type: 'text',
            input_options: {
                placeholder: 'Location',
            },
        },
        {
            label: 'Website',
            key: 'website',
            input_type: 'text',
            input_options: {
                placeholder: 'Website',
            },
        },
        {
            label: 'Overview',
            key: 'overview',
            input_type: 'text',
            input_options: {
                placeholder: 'Overview',
                template: 'tpl_text_box_input',
            },
        },
    ];

    return self;
}
