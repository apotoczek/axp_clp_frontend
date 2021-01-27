/* Automatically transformed from AMD to ES6. Beware of code smell. */
import * as Utils from 'src/libs/Utils';
import lang from 'lang';

let self = {};

self.url_to_mode = function(url_mode) {
    if (Utils.is_str(url_mode)) {
        return url_mode.replace(/-/g, '_');
    }

    return url_mode;
};

self.navigate_to_mode = function(mode, default_mode) {
    window.location.hash = self.generate_hash(mode, default_mode);
};

self.generate_hash = function(mode, default_mode = 'overview') {
    let url = window.location.hash.split('/');

    // Shift out #!
    url.shift();

    // Don't append mode if it's the defalt
    let suffix = mode === default_mode ? '' : `/${mode}`;

    // Translate from underscores to dash for url
    suffix = suffix.replace(/_/g, '-');

    return Utils.match_array(
        url,
        ['analytics', 'bison', uid => `#!/analytics/bison/${uid}${suffix}`],
        ['fund-analytics', 'bison', uid => `#!/fund-analytics/bison/${uid}${suffix}`],
        ['analytics', 'deal', uid => `#!/analytics/deal/${uid}${suffix}`],
        ['fund-analytics', 'deal', uid => `#!/fund-analytics/deal/${uid}${suffix}`],
        ['analytics', (et, ct, uid) => `#!/analytics/${et}/${ct}/${uid}${suffix}`],
        ['fund-analytics', (et, ct, uid) => `#!/fund-analytics/${et}/${ct}/${uid}${suffix}`],
        [
            'portfolio-analytics',
            (et, ct, uid) => `#!/portfolio-analytics/${et}/${ct}/${uid}${suffix}`,
        ],
        [
            'company-analytics',
            (uid, ...rest) => [`#!/company-analytics/${uid}${suffix}`, ...rest.slice(1)].join('/'),
        ],
        ['reporting-analytics', 'company', uid => `#!/reporting-analytics/company/${uid}${suffix}`],
        ['reporting-analytics', () => `#!/reporting-analytics${suffix}`],
        [/.+/, /.+/, 'analytics', (page, uid) => `#!/${page}/${uid}/analytics${suffix}`],
        [
            /.+/,
            /.+/,
            /.+/,
            'analytics',
            (page, uid, ct) => `#!/${page}/${uid}/${ct}/analytics${suffix}`,
        ],
        [
            /.+/,
            /.+/,
            /.+/,
            /.+/,
            'analytics',
            (page, project_uid, uid, ct) =>
                `#!/${page}/${project_uid}/${uid}/${ct}/analytics${suffix}`,
        ],
    );
};

self.search_columns = [
    {
        label: 'Type',
        key: 'entity_type',
        format: 'entity_type',
        definition: lang['Entity Type'].definition,
    },
    {
        label: 'Cash Flow Type',
        key: 'cashflow_type',
        format: 'titleize',
    },
    {
        label: 'Shared By',
        key: 'shared_by',
        format: 'strings',
        visible: false,
    },
    {
        label: 'Permissions',
        key: 'permissions',
        format: 'strings',
        visible: false,
    },
    {
        label: 'Base Currency',
        key: 'base_currency_symbol',
        visible: false,
    },
    {
        label: 'Commitment',
        sort_key: 'commitment',
        type: 'numeric',
        format: 'money',
        format_args: {
            currency_key: 'base_currency_symbol',
            value_key: 'commitment',
        },
        visible: false,
    },
    {
        label: 'Unfunded',
        sort_key: 'unfunded',
        type: 'numeric',
        format: 'money',
        format_args: {
            currency_key: 'base_currency_symbol',
            value_key: 'unfunded',
        },
        visible: false,
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
        key: 'tvpi',
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
        label: 'DPI',
        key: 'dpi',
        first_sort: 'desc',
        type: 'numeric',
        format: 'multiple',
    },
    {
        label: 'Paid In',
        sort_key: 'paid_in',
        type: 'numeric',
        format: 'money',
        format_args: {
            currency_key: 'base_currency_symbol',
            value_key: 'paid_in',
        },
        visible: false,
    },
    {
        label: 'Distributed',
        sort_key: 'distributed',
        type: 'numeric',
        format: 'money',
        format_args: {
            currency_key: 'base_currency_symbol',
            value_key: 'distributed',
        },
        visible: false,
    },
    {
        label: 'Total Value',
        sort_key: 'total_value',
        type: 'numeric',
        format: 'money',
        format_args: {
            currency_key: 'base_currency_symbol',
            value_key: 'total_value',
        },
        visible: false,
    },
    {
        label: 'NAV',
        sort_key: 'residual_value',
        type: 'numeric',
        format: 'money',
        format_args: {
            currency_key: 'base_currency_symbol',
            value_key: 'residual_value',
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
    },
    {
        label: 'As of Date',
        key: 'last_date',
        first_sort: 'desc',
        format: 'backend_date',
    },
    {
        label: 'Age',
        key: 'age_years',
        first_sort: 'desc',
        format: 'years',
        visible: false,
    },
    {
        label: 'Source',
        key: 'source',
    },
    {
        label: 'Source Investor',
        key: 'investor_name',
        visible: false,
    },
    {
        label: '# Vehicles',
        key: 'vehicle_count',
        type: 'numeric',
        first_sort: 'desc',
        visible: false,
    },
    {
        label: 'Max IRR',
        key: 'max_irr',
        type: 'numeric',
        first_sort: 'desc',
        format: 'irr',
        visible: false,
    },
    {
        label: 'Min IRR',
        key: 'min_irr',
        type: 'numeric',
        first_sort: 'desc',
        format: 'irr',
        visible: false,
    },
    {
        label: 'Loss Ratio',
        key: 'loss_ratio',
        type: 'numeric',
        first_sort: 'desc',
        format: 'irr',
        visible: false,
    },
    {
        label: 'Last Update',
        key: 'created',
        first_sort: 'desc',
        format: 'backend_local_datetime',
    },
];

export default self;
