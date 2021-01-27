/* Automatically transformed from AMD to ES6. Beware of code smell. */
import * as Utils from 'src/libs/Utils';

let hostname = window.location.hostname;
let host = window.location.host;
let protocol = window.location.protocol || 'https:';
let common_url;

if (hostname.startsWith('www.') || hostname.startsWith('app.')) {
    common_url = hostname.from(4);
} else if (hostname.startsWith('partner.')) {
    common_url = hostname.from(8);
} else {
    common_url = hostname;
}

let base = {
    logo_urls: {
        vertical: require('src/img/logo/full.svg'),
        horizontal: require('src/img/logo/text_on_waves.svg'),
    },
    app_logo_style: {
        padding: '10px',
    },
    public_logo_style: {
        width: '150px',
    },
    google_analytics_id: 'UA-36862130-1',
    csrf: {
        cookie_name: '_b_token',
        header_name: 'Authorization',
    },
    lang: {
        platform_name: 'Cobalt',
        legal_text_platform_name: 'Cobalt for General Partners',
        empty_portfolio: {
            image_url: require('src/img/data-vault.png'),
            title_text: 'Cobalt is better with your portfolio data',
        },
    },
    heap_analytics_id: '329238141',
    enable_heap_tracking: true,
    data_root: `${protocol}//${host}`,
    base_url: `${protocol}//${host}/app/`,
    reporting_base_url: `${protocol}//${host}/reporting/`,
    api_base_url: `${protocol}//api.${common_url}/`,
    download_base: `${protocol}//api.${common_url}/download/`,
    download_csv_base: `${protocol}//api.${common_url}/download/prepared_csv/`,
    download_pdf_base: `${protocol}//api.${common_url}/download/pdf/`,
    download_file_base: `${protocol}//api.${common_url}/download/prepared_file/`,
    core_url: `${protocol}//${host}/`,
    password_reset_url: `${protocol}//${host}/#!/request-password-reset`,
    sign_in_url: `${protocol}//${host}/#!/sign-in`,
    benchmark_url: `${protocol}//${host}/#!/benchmark`,
    cookie_domain: `.${common_url}`,
    site_root: `${protocol}//${host}/`,
    heartbeat_interval: 30000,
    heartbeat_idle_timeout: 300000,
    status_check_interval: 15000,
    status_check_idle_timeout: 60000,
    terms_of_service_url: 'https://www.cobaltlp.com/master-services-agreement-2020/',
    privacy_policy_url: 'https://cobalt.pe/privacy-policy/',
    cookies: [
        'USER',
        'auto_log',
        'SIGN_IN_EMAIL',
        'SIGN_IN_REDIRECT',
        'SIGN_UP_EMAIL',
        'SIGN_UP_REDIRECT',
        'ACTIVATION_REDIRECT',
        'SIGN_OUT_REDIRECT',
        'DEFER_TRIAL',
    ],
    support_email: 'support@cobaltlp.com',
    support_phone: '1-617-982-6096',
    last_localstorage_expiry: 1473437438000,
    enable_roll_forward_ui: true,
};

let environments = {
    development: {
        dev: true,
        base_url: `${protocol}//${host}/app/`,
        site_root: `${protocol}//${host}/`,
        google_analytics_id: null,
        heartbeat_interval: 1000000, // 1000 seconds
        heartbeat_idle_timeout: null,
        heap_analytics_id: '4075091577',
        enable_heap_tracking: false,
    },
    staging: {
        heap_analytics_id: '1200914789',
    },
    testing: {
        testing: true,
        enable_heap_tracking: false,
    },
};

let customizations = {
    hl: {
        logo_urls: {
            vertical: require('src/img/cobalt_logo_white.svg'),
            horizontal: require('src/img/cobalt_logo_white.svg'),
        },
        app_logo_style: {
            padding: '0 16px 0 23px',
        },
        public_logo_style: {
            width: '200px',
        },
        body_css: {
            hl: true,
        },
        lang: {
            platform_name: 'Cobalt',
            legal_text_platform_name: 'Cobalt for Limited Partners',
            empty_portfolio: {
                image_url: require('src/img/data-vault-hl.png'),
                title_text: 'Cobalt is better with your portfolio data',
            },
            start_page: [
                {
                    icon_css: 'icon-dollar',
                    highlight_css: 'start-page-highlight',
                    icon_style: {
                        'font-size': '39px',
                        'margin-top': '22px',
                    },
                    title: 'Investments',
                    id: 'my-portfolio',
                    highlights: [
                        'Analyze your uploaded data',
                        'Plan for future commitments',
                        'Diligence a fund or manager',
                    ],
                    url: '#!/portfolio-analytics',
                    required_features: ['analytics'],
                },
                {
                    icon_css: 'glyphicon glyphicon-eye-open',
                    highlight_css: 'start-page-highlight',
                    icon_style: {
                        'margin-top': '30px',
                        'font-size': '42px',
                    },
                    title: 'Market Data',
                    id: 'market-insights',
                    highlights: [
                        'Comprehensive benchmarks',
                        'Analyze historic market trends',
                        'View funds coming to market',
                    ],
                    url: '#!/firms',
                },
            ],
        },
        hl: true,
        support_email: 'support@cobaltlp.com',
        support_phone: '1-866-7-COBALT',
        last_localstorage_expiry: 1473437438000,
        google_analytics_id: null,
        enable_roll_forward_ui: false,
        heap_analytics_id: null,
        enable_heap_tracking: false,
    },
};

export default Utils.deep_merge(
    base,
    environments[__ENV__] || {},
    customizations[__DEPLOYMENT__] || {},
);
