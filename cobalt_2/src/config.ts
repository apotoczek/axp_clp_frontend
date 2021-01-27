import {merge} from 'lodash';

const HOST = window.location.host;
const PROTOCOL = window.location.protocol || 'https:';

let backendUrl;
if (__ENV__ === 'production' || __ENV__ === 'staging') {
    backendUrl = 'cobaltgp.com';
} else {
    backendUrl = 'bison.null';
}

const base = {
    csrf: {
        cookieName: '_b_token',
        headerName: 'Authorization',
    },
    heapAnalyticsId: '329238141',
    enableHeapTracking: true,
    dataRoot: `${PROTOCOL}//${HOST}`,
    baseUrl: `${PROTOCOL}//${HOST}/app/`,
    reportingBaseUrl: `${PROTOCOL}//${HOST}/reporting/`,
    apiBaseUrl: `${PROTOCOL}//api.${backendUrl}/`,
    downloadBase: `${PROTOCOL}//api.${backendUrl}/download/`,
    downloadCsvBase: `${PROTOCOL}//api.${backendUrl}/download/prepared_csv/`,
    downloadPdfBase: `${PROTOCOL}//api.${backendUrl}/download/pdf/`,
    downloadFileBase: `${PROTOCOL}//api.${backendUrl}/download/prepared_file/`,
    coreUrl: `${PROTOCOL}//${HOST}/`,
    cookieDomain: `.${backendUrl}`,
    siteRoot: `${PROTOCOL}//${HOST}/`,
    heartbeatInterval: 30000,
    heartbeatIdleTimeout: 300000,
    statusCheckInterval: 15000,
    statusCheckIdleTimeout: 60000,
    termsOfServiceUrl: 'https://cobalt.pe/terms-of-service/',
    privacyPolicyUrl: 'https://cobalt.pe/privacy-policy/',
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
    supportEmail: 'support@cobaltlp.com',
    supportPhone: '1-617-982-6096',
};

const environments = {
    production: {},
    development: {
        baseUrl: `${PROTOCOL}//${HOST}/app/`,
        siteRoot: `${PROTOCOL}//${HOST}/`,
        googleAnalyticsId: null,
        heartbeatInterval: 1000000, // 1000 seconds
        heartbeatIdleTimeout: null,
        heapAnalyticsId: '4075091577',
        enableHeapTracking: true,
    },
    staging: {
        heapAnalyticsId: '1200914789',
    },
    testing: {
        testing: true,
        enableHeapTracking: false,
    },
};

export default merge(base, environments[__ENV__] || {});
