/* Automatically transformed from AMD to ES6. Beware of code smell. */
import FundDetails from 'src/libs/components/market_insights/FundDetails';
import ActionButton from 'src/libs/components/basic/ActionButton';
import MaybeAsterisk from 'src/libs/components/basic/MaybeAsterisk';
import BaseHelper from 'src/libs/helpers/BaseHelper';
import * as Constants from 'src/libs/Constants';
import auth from 'auth';

let self = new BaseHelper();

self.fund_has_dataset = dataset => fund =>
    fund && fund.dataset && fund.dataset === Constants.datasets[dataset];

self.investment_table_columns = function(args) {
    let include_investor = args.include_investor || false;
    let include_fund = args.include_fund === undefined ? true : args.include_fund;
    let investor_view = args.investor_view || false;

    let columns = [
        {
            label: 'Vintage Year',
            sort_key: 'vintage_year',
            component: {
                component: MaybeAsterisk,
                asterisk_key: 'vintage_year_fallback',
                value_key: 'vintage_year',
            },
            component_callback: 'data',
            visible: false,
        },
        {
            label: 'Commitment',
            sort_key: 'commitment_value_usd',
            format: 'money',
            format_args: {
                currency_key: 'commitment_currency',
                value_key: 'commitment_value',
            },
        },
        {
            label: 'Fund Size',
            sort_key: 'fund_size_usd',
            first_sort: 'desc',
            format: 'money',
            format_args: {
                currency_key: 'fund_size_currency',
                value_key: 'fund_size_value',
            },
            visible: !investor_view,
        },
        {
            label: 'IRR',
            sort_key: 'irr',
            first_sort: 'desc',
            type: 'numeric',
            component: {
                component: MaybeAsterisk,
                format: 'irr',
                asterisk_key: 'irr_fallback',
                value_key: 'irr',
            },
            component_callback: 'data',
        },
        {
            label: 'TVPI',
            sort_key: 'multiple',
            first_sort: 'desc',
            type: 'numeric',
            component: {
                component: MaybeAsterisk,
                format: 'multiple',
                asterisk_key: 'multiple_fallback',
                value_key: 'multiple',
            },
            component_callback: 'data',
        },
        {
            label: 'DPI',
            sort_key: 'dpi',
            first_sort: 'desc',
            type: 'numeric',
            component: {
                component: MaybeAsterisk,
                format: 'multiple',
                asterisk_key: 'dpi_fallback',
                value_key: 'dpi',
            },
            component_callback: 'data',
        },
        {
            label: 'RVPI',
            sort_key: 'rvpi',
            first_sort: 'desc',
            type: 'numeric',
            component: {
                component: MaybeAsterisk,
                format: 'multiple',
                asterisk_key: 'rvpi_fallback',
                value_key: 'rvpi',
            },
            component_callback: 'data',
            visible: false,
        },
        {
            label: 'Paid In %',
            sort_key: 'picc',
            first_sort: 'desc',
            type: 'numeric',
            component: {
                component: MaybeAsterisk,
                format: 'percent',
                asterisk_key: 'picc_fallback',
                value_key: 'picc',
            },
            component_callback: 'data',
            visible: false,
        },
        {
            label: 'As of Date',
            key: 'as_of_date',
            format: 'backend_date',
            first_sort: 'desc',
            sort_key: 'as_of_date',
        },
    ];

    if (include_investor) {
        columns.insert(
            {
                label: 'Investor',
                sort_key: 'investor_name',
                format: 'entity_link',
                format_args: {
                    url: 'investors.investor_uid',
                    name_key: 'investor_name',
                },
            },
            0,
        );
    }

    if (include_fund) {
        columns.insert(
            {
                label: 'Fund',
                sort_key: 'fund_name',
                format: 'entity_link',
                format_args: {
                    url: 'funds.fund_uid',
                    name_key: 'fund_name',
                },
            },
            0,
        );
    }

    return columns;
};

self.fund_table_columns = [
    {
        label: 'Name',
        sort_key: 'name',
        format: 'entity_link',
        format_args: {
            url: 'funds.uid',
        },
    },
    {
        label: 'Location',
        key: 'location',
        visible: false,
    },
    {
        label: 'Firm',
        sort_key: 'firm_name',
        format: 'entity_link',
        format_args: {
            url: 'firms.firm_uid',
            name_key: 'firm_name',
        },
        visible: false,
    },
    {
        label: 'Vintage',
        key: 'vintage_year',
        type: 'numeric',
        first_sort: 'desc',
    },
    {
        label: 'First Close',
        key: 'first_close',
        first_sort: 'desc',
        format: 'backend_date',
        visible: false,
    },
    {
        label: 'Amt Closed',
        first_sort: 'desc',
        sort_key: 'total_sold_usd',
        format: 'money',
        format_args: {
            currency_key: 'total_sold_currency',
            value_key: 'total_sold_value',
        },
        visible: false,
    },
    {
        label: 'USD Amt Closed',
        first_sort: 'desc',
        sort_key: 'total_sold_usd',
        unique_key: 'usd_total_sold',
        format: 'money',
        format_args: {
            render_currency: 'USD',
            value_key: 'total_sold_usd',
        },
        visible: false,
    },
    {
        label: 'Fund Size',
        first_sort: 'desc',
        sort_key: 'target_size_usd',
        format: 'money',
        format_args: {
            currency_key: 'target_size_currency',
            value_key: 'target_size_value',
        },
    },
    {
        label: 'USD Fund Size',
        first_sort: 'desc',
        sort_key: 'target_size_usd',
        unique_key: 'usd_fund_size',
        format: 'money',
        format_args: {
            render_currency: 'USD',
            value_key: 'target_size_usd',
        },
        visible: false,
    },
    {
        label: 'Paid In %',
        first_sort: 'desc',
        key: 'picc',
        format: 'percent',
        type: 'numeric',
        visible: false,
    },
    {
        label: 'Quartile',
        key: 'irr_quartile',
        first_sort: 'desc',
        type: 'numeric',
        format: 'number',
    },
    {
        label: 'IRR',
        key: 'irr',
        first_sort: 'desc',
        type: 'numeric',
        format: 'irr',
    },
    {
        label: 'TVPI',
        key: 'multiple',
        first_sort: 'desc',
        type: 'numeric',
        format: 'multiple',
    },
    {
        label: 'DPI',
        key: 'dpi',
        first_sort: 'desc',
        type: 'numeric',
        format: 'multiple',
    },
    {
        label: 'RVPI',
        key: 'rvpi',
        first_sort: 'desc',
        type: 'numeric',
        format: 'multiple',
        visible: false,
    },
    {
        label: 'Gross IRR',
        key: 'gross_irr',
        first_sort: 'desc',
        type: 'numeric',
        format: 'irr',
        visible: false,
    },
    {
        label: 'Gross Multiple',
        key: 'gross_multiple',
        first_sort: 'desc',
        type: 'numeric',
        format: 'multiple',
        visible: false,
    },
    {
        label: 'Gross Invested',
        sort_key: 'gross_invested',
        format: 'highlight_if_update',
        format_args: {
            value_key: 'gross_invested',
            format: 'money',
        },
        visible: false,
    },
    {
        label: 'Gross Realized',
        sort_key: 'gross_realized',
        format: 'highlight_if_update',
        format_args: {
            value_key: 'gross_realized',
            format: 'money',
        },
        visible: false,
    },
    {
        label: 'Gross Unrealized',
        sort_key: 'gross_unrealized',
        format: 'highlight_if_update',
        format_args: {
            value_key: 'gross_unrealized',
            format: 'money',
        },
        visible: false,
    },
    {
        label: 'PME Alpha',
        key: 'bison_pme_alpha',
        first_sort: 'desc',
        format: 'percent',
    },
    {
        label: 'TWRR Since Inception',
        key: 'twrr_since_inception',
        first_sort: 'desc',
        format: 'percent',
        visible: false,
    },
    {
        label: 'TWRR 1 Year',
        key: 'twrr_1_year',
        first_sort: 'desc',
        format: 'percent',
        visible: false,
    },
    {
        label: 'TWRR 3 Year',
        key: 'twrr_3_year',
        first_sort: 'desc',
        format: 'percent',
        visible: false,
    },
    {
        label: 'Momentum 3 year',
        key: 'momentum_3_year',
        first_sort: 'desc',
        format: 'percent',
        visible: false,
    },
    {
        label: 'Momentum 1 Year',
        key: 'momentum_1_year',
        first_sort: 'desc',
        format: 'percent',
        visible: false,
    },
    {
        label: 'As of Date',
        key: 'as_of_date',
        format: 'backend_date',
        first_sort: 'desc',
    },
    {
        label: 'Family',
        first_sort: 'asc',
        key: 'family_name',
        visible: false,
    },
    {
        label: 'Ordinal',
        first_sort: 'desc',
        key: 'ordinal_value',
        type: 'numeric',
        visible: false,
    },
    {
        component_callback: 'data',
        label: 'Details',
        always_visible: true,
        type: 'component',
        component: {
            component: ActionButton,
            label: 'Details',
            css: {
                'btn-ghost-default': true,
                'btn-xs': true,
            },
            trigger_modal: {
                id: 'details_modal',
                close_on_url_change: true,
                component: FundDetails,
                columns: self.investment_table_columns({
                    include_investor: true,
                    investor_view: true,
                    include_fund: false,
                }),
            },
        },
    },
];

if (auth.user_has_feature('bison_internal')) {
    self.fund_table_columns.push({
        label: 'UID',
        key: 'uid',
        visible: false,
    });
}

// TODO: refactor this and fund_table_columns to share partial configuration
self.fund_family_table_columns = [
    {
        label: 'Name',
        sort_key: 'name',
        format: 'entity_link',
        format_args: {
            url: 'fund-in-family.uid',
        },
    },
    {
        label: 'Location',
        key: 'location',
        visible: false,
    },
    {
        label: 'Firm',
        sort_key: 'firm_name',
        format: 'entity_link',
        format_args: {
            url: 'firms.firm_uid',
            name_key: 'firm_name',
        },
        visible: false,
    },
    {
        label: 'Vintage',
        key: 'vintage_year',
        type: 'numeric',
        first_sort: 'desc',
    },
    {
        label: 'Status',
        key: 'status',
        first_sort: 'desc',
        visible: false,
    },
    {
        label: 'First Close',
        key: 'first_close',
        first_sort: 'desc',
        format: 'backend_date',
        visible: false,
    },
    {
        label: 'Amt Closed',
        first_sort: 'desc',
        sort_key: 'total_sold_usd',
        format: 'money',
        format_args: {
            currency_key: 'total_sold_currency',
            value_key: 'total_sold_value',
        },
    },
    {
        label: 'USD Amt Closed',
        first_sort: 'desc',
        sort_key: 'total_sold_usd',
        unique_key: 'usd_total_sold',
        format: 'money',
        format_args: {
            render_currency: 'USD',
            value_key: 'total_sold_usd',
        },
        visible: false,
    },
    {
        label: 'Fund Size',
        first_sort: 'desc',
        sort_key: 'target_size_usd',
        format: 'money',
        format_args: {
            currency_key: 'target_size_currency',
            value_key: 'target_size_value',
        },
    },
    {
        label: 'USD Fund Size',
        first_sort: 'desc',
        sort_key: 'target_size_usd',
        unique_key: 'usd_fund_size',
        format: 'money',
        format_args: {
            render_currency: 'USD',
            value_key: 'target_size_usd',
        },
        visible: false,
    },
    {
        label: 'Paid In %',
        first_sort: 'desc',
        key: 'picc',
        format: 'percent',
        type: 'numeric',
        visible: false,
    },
    {
        label: 'Quartile',
        key: 'irr_quartile',
        first_sort: 'desc',
        type: 'numeric',
        format: 'number',
    },
    {
        label: 'IRR',
        key: 'irr',
        first_sort: 'desc',
        type: 'numeric',
        format: 'irr',
    },
    {
        label: 'TVPI',
        key: 'multiple',
        first_sort: 'desc',
        type: 'numeric',
        format: 'multiple',
    },
    {
        label: 'DPI',
        key: 'dpi',
        first_sort: 'desc',
        type: 'numeric',
        format: 'multiple',
    },
    {
        label: 'RVPI',
        key: 'rvpi',
        first_sort: 'desc',
        type: 'numeric',
        format: 'multiple',
        visible: false,
    },
    {
        label: 'PME Alpha',
        key: 'bison_pme_alpha',
        first_sort: 'desc',
        format: 'percent',
    },
    {
        label: 'TWRR Since Inception',
        key: 'twrr_since_inception',
        first_sort: 'desc',
        format: 'percent',
        visible: false,
    },
    {
        label: 'TWRR 1 Year',
        key: 'twrr_1_year',
        first_sort: 'desc',
        format: 'percent',
        visible: false,
    },
    {
        label: 'TWRR 3 Year',
        key: 'twrr_3_year',
        first_sort: 'desc',
        format: 'percent',
        visible: false,
    },
    {
        label: 'Gross IRR',
        key: 'gross_irr',
        first_sort: 'desc',
        type: 'numeric',
        format: 'irr',
        visible: false,
    },
    {
        label: 'Gross Multiple',
        key: 'gross_multiple',
        first_sort: 'desc',
        type: 'numeric',
        format: 'multiple',
        visible: false,
    },
    {
        label: 'Gross Invested',
        sort_key: 'gross_invested',
        format: 'highlight_if_update',
        format_args: {
            value_key: 'gross_invested',
            format: 'money',
        },
        visible: false,
    },
    {
        label: 'Gross Realized',
        sort_key: 'gross_realized',
        format: 'highlight_if_update',
        format_args: {
            value_key: 'gross_realized',
            format: 'money',
        },
        visible: false,
    },
    {
        label: 'Gross Unrealized',
        sort_key: 'gross_unrealized',
        format: 'highlight_if_update',
        format_args: {
            value_key: 'gross_unrealized',
            format: 'money',
        },
        visible: false,
    },
    {
        label: 'Momentum 3 year',
        key: 'momentum_3_year',
        first_sort: 'desc',
        format: 'percent',
        visible: false,
    },
    {
        label: 'Momentum 1 Year',
        key: 'momentum_1_year',
        first_sort: 'desc',
        format: 'percent',
        visible: false,
    },
    {
        label: 'As of Date',
        key: 'as_of_date',
        format: 'backend_date',
        first_sort: 'desc',
    },
    {
        label: 'Family',
        first_sort: 'asc',
        key: 'family_name',
        visible: false,
    },
    {
        label: 'Ordinal',
        first_sort: 'desc',
        key: 'ordinal_value',
        type: 'numeric',
        visible: false,
    },
    {
        component_callback: 'data',
        label: 'Details',
        always_visible: true,
        type: 'component',
        component: {
            component: ActionButton,
            label: 'Details',
            css: {
                'btn-ghost-default': true,
                'btn-xs': true,
            },
            trigger_modal: {
                id: 'details_modal',
                close_on_url_change: true,
                component: FundDetails,
                columns: self.investment_table_columns({
                    include_investor: true,
                    investor_view: true,
                    include_fund: false,
                }),
            },
        },
    },
];

if (auth.user_has_feature('bison_internal')) {
    self.fund_family_table_columns.push({
        label: 'UID',
        key: 'uid',
        visible: false,
    });
}

self.funds_in_market_table_columns = [
    {
        label: 'Name',
        sort_key: 'name',
        format: 'entity_link',
        format_args: {
            url: 'funds-in-market.uid',
        },
    },
    {
        label: 'Location',
        key: 'location',
        visible: false,
    },
    {
        label: 'Firm',
        sort_key: 'firm_name',
        format: 'entity_link',
        format_args: {
            name_key: 'firm_name',
            url: 'firms.firm_uid',
        },
        visible: false,
    },
    {
        label: 'Vintage',
        key: 'vintage_year',
        type: 'numeric',
        first_sort: 'desc',
    },
    {
        label: 'Status',
        key: 'status',
        first_sort: 'desc',
    },
    {
        label: 'First Close',
        key: 'first_close',
        first_sort: 'desc',
        format: 'backend_date',
    },
    {
        label: 'Amt Closed',
        first_sort: 'desc',
        sort_key: 'total_sold_usd',
        format: 'money',
        format_args: {
            currency_key: 'total_sold_currency',
            value_key: 'total_sold_value',
        },
        visible: false,
    },
    {
        label: 'Fund Size',
        first_sort: 'desc',
        sort_key: 'target_size_usd',
        format: 'money',
        format_args: {
            currency_key: 'target_size_currency',
            value_key: 'target_size_value',
        },
        visible: false,
    },
    {
        label: 'Family',
        first_sort: 'asc',
        key: 'family_name',
        visible: false,
    },
    {
        label: 'Ordinal',
        first_sort: 'desc',
        key: 'ordinal_value',
        type: 'numeric',
        visible: false,
    },
];

if (auth.user_has_feature('bison_internal')) {
    self.funds_in_market_table_columns.push({
        label: 'UID',
        key: 'uid',
        visible: false,
    });
}

self.firm_table_columns = [
    {
        label: 'Name',
        sort_key: 'name',
        format: 'entity_link',
        format_args: {
            url: 'firms.uid',
        },
    },
    {
        label: 'Primary Location',
        key: 'location',
    },
    {
        label: 'Fund Sizes',
        key: 'target_size_usd_display',
        sort_key: 'target_size_min_usd',
    },
    {
        label: '# Investors',
        key: 'investor_count',
    },
    {
        label: '# Funds',
        key: 'fund_count',
    },
    {
        label: 'Fundraising',
        key: 'is_fundraising',
        format: 'boolean_highlight',
    },
    {
        label: 'Performance',
        key: 'has_performance',
        format: 'boolean_highlight',
    },
];

if (auth.user_has_feature('bison_internal')) {
    self.firm_table_columns.push({
        label: 'UID',
        key: 'uid',
        visible: false,
    });
}

self.investor_table_columns = [
    {
        label: 'Name',
        sort_key: 'name',
        format: 'entity_link',
        format_args: {
            url: 'investors.uid',
        },
    },
    {
        label: 'Primary Location',
        key: 'location',
    },
    {
        label: 'Vintage Years',
        key: 'vintage_year_display',
        sort_key: 'vintage_year_min',
    },
    {
        label: 'Fund Sizes',
        key: 'target_size_usd_display',
        sort_key: 'target_size_min_usd',
    },
    {
        label: 'Commitments',
        key: 'commitment_usd_display',
        sort_key: 'commitment_min_usd',
    },
    {
        label: '# Investments',
        key: 'fund_count',
    },
    {
        label: 'Investor Type',
        key: 'investor_type',
    },
];

if (auth.user_has_feature('bison_internal')) {
    self.investor_table_columns.push({
        label: 'UID',
        key: 'uid',
        visible: false,
    });
}

self.investor_contact_table_columns = [
    {
        label: 'First Name',
        key: 'first_name',
    },
    {
        label: 'Last Name',
        key: 'last_name',
    },
    {
        label: 'Title',
        key: 'job_title',
    },
    {
        label: 'Firm',
        key: 'investor_name',
    },
    {
        label: 'Email',
        key: 'email',
    },
    {
        label: 'Phone',
        key: 'phone',
    },
    {
        label: 'City',
        key: 'city',
        visible: false,
    },
    {
        label: 'Country',
        key: 'country',
        visible: false,
    },
    {
        label: 'Investor Type',
        key: 'investor_type',
        visible: false,
    },
    {
        label: 'State',
        key: 'state',
        visible: false,
    },
    {
        label: 'Address Line 1',
        key: 'street_1',
        visible: false,
    },
    {
        label: 'Address Line 2',
        key: 'street_2',
        visible: false,
    },
    {
        label: 'Zip',
        key: 'zip_code',
        visible: false,
    },
];

export default self;
