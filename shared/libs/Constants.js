import {MetricVersionType, TimeFrame, Frequency} from 'src/libs/Enums';

export const cashflow_cf_type_options = [
    {label: 'Cash Flow', value: 'cashflow'},
    {label: 'NAV', value: 'nav'},
    {label: 'Capital Call', value: 'contrib'},
    {label: 'Distribution', value: 'distrib'},
];

export const cashflow_cf_type_filter_options = [
    {label: 'NAV', value: 'nav'},
    {label: 'Capital Call', value: 'contrib'},
    {label: 'Distribution', value: 'distrib'},
];

export const not_applicable_html = '<span class="text-muted">N/A</span>';

export const horizon_model_style_options = [
    {value: 'buyout', label: 'Buyout'},
    {value: 'growth-equity', label: 'Growth Equity'},
    {value: 'distressed', label: 'Distressed'},
    {value: 'credit', label: 'Credit'},
    {value: 'fund-of-funds', label: 'Fund of Funds'},
    {value: 'venture-capital', label: 'Venture Capital'},
    {value: 'real-estate', label: 'Real Estate'},
    {value: 'mezzanine', label: 'Mezzanine'},
    {value: 'co-investment', label: 'Co-Investment'},
    {value: 'secondaries', label: 'Secondaries'},
    {value: 'natural-resources', label: 'Natural Resources'},
    {value: 'infrastructure', label: 'Infrastructure'},
];

export const pme_metrics = [
    'Kaplan Schoar',
    'PME+',
    'Cobalt PME',
    'Direct Alpha',
    'mPME',
    'GEM IPP',
    'Long Nickels',
];

export const max_backend_timestamp = 253402214400;

export const min_backend_timestamp = -62135596800;

export const day_in_milliseconds = 24 * 3600 * 1000;

export const chart_type_options = [
    {label: 'Line Chart', value: 'line'},
    {label: 'Bar Chart', value: 'column'},
    {label: 'Scatter Chart', value: 'scatter'},
];

export const time_frame_display_options = [
    {value: 3, label: 'TTM'},
    {value: 2, label: 'By Quarter'},
    {value: 1, label: 'By Month'},
];

export const time_frame_options = [
    {value: 0, label: 'Point in Time'},
    {value: 1, label: 'Monthly'},
    {value: 2, label: 'Quarterly'},
    {value: 3, label: 'TTM'},
];

export const days_per_year = 365.242;

export const format_options = [
    {value: 1, label: 'Money', format: 'money', title: 'Currency'},
    {value: 2, label: 'Percent', format: 'percent', title: 'Percentages'},
    {value: 3, label: 'Multiple', format: 'multiple', title: 'Multiples'},
    {value: 4, label: 'Integer', format: 'integer', title: 'Counts'},
    {value: 5, label: 'Float', format: 'float', title: 'Others'},
];

export const datasets = {
    cobalt: 1,
    hl: 2,
    pb: 3,
};

export const METRIC_VERSION_TYPES = [
    {value: MetricVersionType.Backward, label: 'Backward looking'},
    {value: MetricVersionType.Forward, label: 'Forward looking'},
];

export const EMAIL_TEMPLATE_STRINGS = [
    {
        label: 'Client Name',
        value: 'client_name',
    },
    {
        label: 'Client Contact',
        value: 'client_contact',
    },
    {
        label: 'Company Name',
        value: 'company_name',
    },
    {
        label: 'Company Contact',
        value: 'company_contact',
    },
    {
        label: 'Cobalt Url',
        value: 'cobalt_url',
    },
];

export const DASHBOARDS_DATE_FORMATS = [
    {
        value: '{M}/{d}/{yyyy}',
        label: '3/31/2019',
    },
    {
        value: '{M}/{d}/{yy}',
        label: '3/31/19',
    },
    {
        value: '{Month} {dd}, {yyyy}',
        label: 'March 31, 2019',
    },
    {
        value: '{Month} {yyyy}',
        label: 'March 2019',
    },
    {
        value: 'Q{Q} {yyyy}',
        label: 'Q1 2019',
    },
];

export const FORMAT_MAP = {
    irr: 'irr',
    tvpi: 'multiple',
    dpi: 'multiple',
    rvpi: 'multiple',
    loss_ratio: 'percent',
    total_loss_ratio: 'percent',
    paid_in: 'money',
    paid_in_pct: 'percent',
    picc: 'percent',
    distributed: 'money',
    distributed_pct: 'percent',
    commitment: 'money',
    commitment_pct: 'percent',
    nav: 'money',
    nav_pct: 'percent',
    unfunded: 'money',
    unfunded_pct: 'percent',
    total_value: 'money',
    total_value_pct: 'percent',
    age_years: 'years',
    min_irr: 'irr',
    max_irr: 'irr',
    vehicle_count: 'number',
    vehicles_above_avg: 'number',
};

export const REPORTING_PERIODS = {
    quarterly: {
        timeFrame: TimeFrame.Quarter,
        frequency: Frequency.Quarterly,
        label: 'Quarterly',
        convertTo: 'pit_quarterly',
    },
    monthly: {
        timeFrame: TimeFrame.Month,
        frequency: Frequency.Monthly,
        label: 'Monthly',
        convertTo: 'pit_monthly',
    },
    ttm_monthly: {
        timeFrame: TimeFrame.TTM,
        frequency: Frequency.Monthly,
        label: 'TTM (Monthly)',
        convertTo: 'pit_monthly',
    },
    ttm_quarterly: {
        timeFrame: TimeFrame.TTM,
        frequency: Frequency.Quarterly,
        label: 'TTM (Quarterly)',
        convertTo: 'pit_quarterly',
    },
    ttm_yearly: {
        timeFrame: TimeFrame.TTM,
        frequency: Frequency.Yearly,
        label: 'TTM (Yearly)',
        convertTo: 'pit_yearly',
    },
    pit_monthly: {
        timeFrame: TimeFrame.PointInTime,
        frequency: Frequency.Monthly,
        label: 'Monthly',
        convertTo: 'monthly',
    },
    pit_quarterly: {
        timeFrame: TimeFrame.PointInTime,
        frequency: Frequency.Quarterly,
        label: 'Quarterly',
        convertTo: 'quarterly',
    },
    pit_yearly: {
        timeFrame: TimeFrame.PointInTime,
        frequency: Frequency.Yearly,
        label: 'Yearly',
        convertTo: 'ttm_monthly',
    },
};

export const SYSTEM_DIRECTORY_UIDS = {
    Root: '00000000-0000-0000-0000-000000000000',
    Owned: '00000001-0000-0000-0000-000000000000',
    Shared: '00000002-0000-0000-0000-000000000000',
};

export const DIRECTORY_DISALLOWED_CHARS = /[\t\n\\/]/;
