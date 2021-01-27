import Cookies from 'js-cookie';

import config from 'config';

import configureBackend from 'src/libs/react/configureBackend';
import DataThing from 'src/libs/react/libs/DataThing';
import LegacyDataThing from 'src/libs/DataThing';

const backend = configureBackend(
    config.api_base_url,
    config.csrf.cookie_name,
    config.csrf.header_name,
);

export const dataThing = new DataThing(backend);
LegacyDataThing.add_expiry_callback(keys => dataThing.expireRequests(keys));
LegacyDataThing.add_additional_keys_callback(() => dataThing.requests);

export const formPost = (action, body) => {
    let cookie = Cookies.get(config.csrf.cookie_name);
    let div = document.createElement('div');
    div.innerHTML = `
        <form action="${action}" method="post">
            ${body}
            <input
                type="hidden"
                name="${config.csrf.header_name}"
                value="${cookie}"
            />
        </form>
    `.trim();

    document.body.appendChild(div);
    div.firstChild.submit();
    document.body.removeChild(div);
};

export const callEndpoint = (endpoint, params) => dataThing.request(endpoint, params);

export const callActionEndpoint = (endpoint, params) => backend.post(endpoint, params);
