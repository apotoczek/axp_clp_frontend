/* Automatically transformed from AMD to ES6. Beware of code smell. */
import auth from 'auth';
import DataTable from 'src/libs/components/basic/DataTable';

export default function(opts, components) {
    const vintage_label = opts.vintage_label || 'Vintage Year';
    const enable_sector_attribute = opts.enable_sector_attribute || false;

    const url = opts.url || 'company-analytics/<company_uid>';

    const dynamic_columns = [
        {
            datasource: {
                type: 'dynamic',
                query: {
                    target: 'table_columns',
                    public_taxonomy: true,
                    include_enums: enable_sector_attribute
                        ? ['geography', 'sector']
                        : ['geography'],
                },
            },
            placement: {
                relative: 'Country',
                position: 'left',
            },
            visible: false,
        },
    ];

    if (opts.entity_uid_event && opts.entity_type) {
        dynamic_columns.push({
            datasource: {
                type: 'dynamic',
                query: {
                    target: 'table_columns',
                    entity_uid: {
                        type: 'observer',
                        event_type: opts.entity_uid_event,
                        required: true,
                    },
                    entity_type: opts.entity_type,
                },
            },
            visible: false,
        });
    }

    const columns = [];

    if (opts.entity_type === 'market_data_family' || opts.entity_type === 'market_data_fund') {
        columns.append({
            label: 'Name',
            key: 'name',
        });
    } else {
        columns.append({
            label: 'Name',
            sort_key: 'name',
            localstorage_key: 'name',
            format: 'contextual_link_with_exclude',
            format_args: {
                url: url,
                label_key: 'name',
                exclude: obj =>
                    obj.entity_type === 'user_fund' ||
                    !auth.user_has_feature('metric_analytics') ||
                    !obj.uid,
            },
            visible: true,
        });
    }

    columns.push(
        ...[
            {
                label: 'Fund',
                key: 'fund_name',
                format: 'strings',
                visible: false,
            },
            {
                label: 'Transaction Status',
                key: 'transaction_status',
                format: 'strings',
            },
            {
                label: 'Country',
                key: 'country',
                format: 'strings',
                visible: false,
            },
        ],
    );

    if (!enable_sector_attribute) {
        columns.push(
            ...[
                {
                    label: 'Sector',
                    key: 'sector',
                    format: 'strings',
                    visible: false,
                },
                {
                    label: 'Industry',
                    key: 'industry',
                    format: 'strings',
                    visible: false,
                },
            ],
        );
    }

    columns.push(
        ...[
            {
                label: 'Deal Source',
                key: 'deal_source',
                format: 'strings',
                visible: false,
            },
            {
                label: 'Seller Type',
                key: 'seller_type',
                format: 'strings',
                visible: false,
            },
            {
                label: 'Deal Role',
                key: 'deal_role',
                format: 'strings',
                visible: false,
            },
            {
                label: 'Deal Type',
                key: 'deal_type',
                format: 'strings',
                visible: false,
            },
            {
                label: 'Managers',
                key: 'managers',
                format: 'strings',
                visible: false,
            },
            {
                label: 'Deal Team Leader',
                key: 'deal_team_leader',
                format: 'strings',
                visible: false,
            },
            {
                label: 'Deal Team Second',
                key: 'deal_team_second',
                format: 'strings',
                visible: false,
            },
            {
                label: 'IRR',
                key: 'irr',
                format: 'irr',
            },
            {
                label: 'Sub-Year IRR',
                key: 'irr_sub_year',
                format: 'irr',
                visible: false,
            },
            {
                label: 'TVPI',
                key: 'tvpi',
                format: 'multiple',
            },
            {
                label: 'DPI',
                key: 'dpi',
                format: 'multiple',
            },
            {
                label: 'RVPI',
                key: 'rvpi',
                format: 'multiple',
                visible: false,
            },
            {
                label: 'Invested',
                format: 'money',
                sort_key: 'paid_in',
                format_args: {
                    value_key: 'paid_in',
                    currency_key: 'render_currency',
                },
            },
            {
                label: '% Invested',
                key: 'paid_in_pct',
                type: 'numeric',
                visible: false,
                format: 'percent',
            },
            {
                label: 'Realized Value',
                format: 'money',
                sort_key: 'distributed',
                format_args: {
                    value_key: 'distributed',
                    currency_key: 'render_currency',
                },
            },
            {
                label: '% Realized Value',
                key: 'distributed_pct',
                type: 'numeric',
                visible: false,
                format: 'percent',
            },
            {
                label: 'Unrealized Value',
                sort_key: 'nav',
                format: 'money',
                format_args: {
                    value_key: 'nav',
                    currency_key: 'render_currency',
                },
            },
            {
                label: '% Unrealized Value',
                key: 'nav_pct',
                type: 'numeric',
                visible: false,
                format: 'percent',
            },
            {
                label: 'Total Value',
                sort_key: 'total_value',
                format: 'money',
                format_args: {
                    value_key: 'total_value',
                    currency_key: 'render_currency',
                },
            },
            {
                label: '% Total Value',
                key: 'total_value_pct',
                type: 'numeric',
                visible: false,
                format: 'percent',
            },
            {
                label: vintage_label,
                key: 'vintage_year',
                format: 'strings',
                visible: false,
            },
            {
                label: 'First Close',
                key: 'first_close',
                format: 'backend_date',
            },
            {
                label: 'As of Date',
                key: 'as_of_date',
                format: 'backend_date',
            },
            {
                label: 'Holding Period',
                key: 'age_years',
                format: 'years',
                visible: false,
            },
        ],
    );

    if (opts.include_aggregate_columns) {
        columns.push(
            {
                label: 'Loss Ratio',
                key: 'loss_ratio',
                format: 'percent',
            },
            {
                label: 'Total Loss Ratio',
                key: 'total_loss_ratio',
                format: 'percent',
                visible: false,
            },

            {
                label: 'Min IRR',
                key: 'min_irr',
                format: 'irr',
                visible: false,
            },
            {
                label: 'Max IRR',
                key: 'max_irr',
                format: 'irr',
                visible: false,
            },
            {
                label: '# Deals',
                key: 'vehicle_count',
                visible: false,
            },
            {
                label: '# Deals Above Avg',
                key: 'vehicles_above_avg',
                visible: false,
            },
        );
    }

    const defaults = {
        results_per_page: 15,
        dynamic_columns: dynamic_columns,
        columns: columns,
    };

    return new DataTable({...defaults, ...opts}, components);
}
