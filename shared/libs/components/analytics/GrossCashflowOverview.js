/* Automatically transformed from AMD to ES6. Beware of code smell. */
import CashflowOverview from 'src/libs/components/analytics/CashflowOverview';

export default function(opts, components) {
    let callouts = [
        {
            label: 'Gross IRR',
            value_key: 'irr',
            format: 'irr_highlight',
            subtext: opts.irr_subtext,
        },
        {
            label: 'TVPI',
            value_key: 'tvpi',
            format: 'multiple_highlight',
        },
        {
            label: 'DPI',
            value_key: 'dpi',
            format: 'multiple_neutral',
        },
        {
            label: 'RVPI',
            value_key: 'rvpi',
            format: 'multiple_neutral',
        },
        {
            label: 'Time Zero IRR',
            value_key: 'time_zero_irr',
            format: 'irr_highlight',
        },
    ];

    const commitment_label = opts.entity_type == 'market_data_fund' ? 'Target Size' : 'Commitment';
    let metrics = [
        {
            label: commitment_label,
            format: 'money',
            format_args: {
                value_key: 'commitment',
                currency_key: 'render_currency',
            },
        },
        {
            label: 'Invested',
            format: 'money',
            format_args: {
                value_key: 'paid_in',
                currency_key: 'render_currency',
            },
        },
        {
            label: 'Unfunded',
            format: 'money',
            format_args: {
                value_key: 'unfunded',
                currency_key: 'render_currency',
            },
        },
        {
            label: 'Realized Value',
            format: 'money',
            format_args: {
                value_key: 'distributed',
                currency_key: 'render_currency',
            },
        },
        {
            label: 'Unrealized Value (NAV)',
            format: 'money',
            format_args: {
                value_key: 'nav',
                currency_key: 'render_currency',
            },
        },
        {
            label: 'Total Value',
            format: 'money',
            format_args: {
                value_key: 'total_value',
                currency_key: 'render_currency',
            },
        },
        {
            label: 'Vintage Year',
            value_key: 'vintage_year',
        },
        {
            label: 'First Close',
            value_key: 'first_close',
            format: 'backend_date',
        },
        {
            label: 'Loss Ratio',
            value_key: 'loss_ratio',
            format: 'percent',
        },
        {
            label: 'As of Date',
            value_key: 'as_of_date',
            format: 'backend_date',
        },
        {
            label: 'Holding Period',
            value_key: 'age_years',
            format: 'years',
        },
    ];

    opts = Object.assign({}, opts, {
        callouts: callouts,
        metrics: metrics,
        active_template: 'gross',
    });

    let self = new CashflowOverview(opts, components);

    return self;
}
