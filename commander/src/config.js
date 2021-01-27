/* Automatically transformed from AMD to ES6. Beware of code smell. */
import * as Utils from 'src/libs/Utils';

let hostname = window.location.hostname;
let host = window.location.host;
let protocol = window.location.protocol || 'https:';
let common_url;

if (hostname.startsWith('www.')) {
    common_url = hostname.from(4);
} else if (hostname.startsWith('partner.')) {
    common_url = hostname.from(8);
} else if (hostname.startsWith('commander.')) {
    common_url = hostname.from(10);
} else {
    common_url = hostname;
}

let base = {
    logo_urls: {
        vertical: 'src/img/bison.png',
        horizontal: 'src/img/bisonh.png',
    },
    csrf: {
        cookie_name: '_b_token',
        header_name: 'Authorization',
    },
    base_url: `${protocol}//${host}/app/`,
    api_base_url: `${protocol}//api.${common_url}/`,
    download_csv_base: `${protocol}//api.${common_url}/download/prepared_csv/`,
    download_file_base: `${protocol}//api.${common_url}/download/prepared_file/`,
    core_url: `${protocol}//${host}/`,
    password_reset_url: `${protocol}//${host}/#!/request-password-reset`,
    sign_in_url: `${protocol}//${host}/#!/sign-in`,
    max_free_views_url: `${protocol}//${host}/#!/max-free-views`,
    cookie_domain: `.${common_url}`,
    site_root: `${protocol}//${host}/`,
    heartbeat_interval: 60000,
    status_check_interval: 15000,
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
    commander: {
        base_url: `${protocol}//commander.${common_url}/`,
        users_url: `${protocol}//commander.${common_url}/#!/users/`,
        clients_url: `${protocol}//commander.${common_url}/#!/clients/`,
        firms_url: `${protocol}//commander.${common_url}/#!/firms/`,
        funds_url: `${protocol}//commander.${common_url}/#!/funds/`,
        investors_url: `${protocol}//commander.${common_url}/#!/investors/`,
        investments_url: `${protocol}//commander.${common_url}/#!/investments/`,
        investor_contacts_url: `${protocol}//commander.${common_url}/#!/investor_contacts/`,
        families_url: `${protocol}//commander.${common_url}/#!/families/`,
        anticipated_funds_url: `${protocol}//commander.${common_url}/#!/anticipated-funds/`,
    },
    required_features: ['internal'],
};

let environments = {
    development: {
        dev: true,
        base_url: `${protocol}//${common_url}/app/`,
        site_root: `${protocol}//${common_url}/`,
        heartbeat_interval: 1000000, // 1000 seconds
        status_check_interval: 10000,
    },
    testing: {
        testing: true,
    },
};

let customizations = {
    hl: {
        logo_urls: {
            vertical: 'src/img/hlbison.png',
            horizontal: 'src/img/bisonh.png',
        },
        body_css: {
            hl: true,
        },
        required_features: ['internal'],
    },
};

export default Utils.deep_merge(
    base,
    environments[__ENV__] || {},
    customizations[__DEPLOYMENT__] || {},
);
