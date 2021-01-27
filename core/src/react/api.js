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

dataThing.addExpiryCallback(keys => LegacyDataThing.expire_query_keys(keys));
dataThing.addAdditionalKeysCallback(() => LegacyDataThing.query_keys());

export function createDashboard(
    name,
    description,
    template_settings,
    dashboard_settings,
    parent_uid,
) {
    return backend.post('directory/create_report', {
        name,
        description,
        template_settings,
        dashboard_settings,
        parent_uid,
    });
}

export function copyDashboard(dashboard_uid) {
    return backend.post('useractionhandler/copy_dashboard', {
        dashboard_uid,
    });
}

export function deleteDashboard(dashboard_uid) {
    return backend.post('useractionhandler/delete_dashboard', {
        dashboard_uid,
    });
}

export function prepareCsv(rows) {
    return backend.post('useractionhandler/prepare_csv', {
        rows,
    });
}

export function shareDashboard(dashboard_uid, params) {
    const share = params.permission === 'share';
    const write = share || params.permission === 'write';
    const read = write || params.permission === 'read';

    return backend.post('useractionhandler/share_dashboard', {
        dashboard_uid,
        read: read,
        write: write,
        share: share,
        share_with_email: params.shareWithEmail,
        share_with_team: params.shareWithTeam,
    });
}

export function deleteDashboardShare(shareUid, dashboardUid) {
    return backend.post('useractionhandler/remove_share', {
        uid: shareUid,
        dashboard_uid: dashboardUid,
    });
}

export function formPost(action, body = '') {
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
}

export function saveDashboard(dashboardData) {
    return backend
        .post('useractionhandler/save_dashboard', {
            dashboard_uid: dashboardData.uid,
            dashboard_updates: {
                name: dashboardData.name,
                spec_fillers: dashboardData.dataSpecFillers,
                description: dashboardData.description,
                meta_data: dashboardData.meta_data,
                settings: dashboardData.settings.dashboard,
            },
            template_updates: {
                layout_data: dashboardData.layoutData,
                component_data: dashboardData.componentData,
                data_spec: dashboardData.dataSpec,
                settings: dashboardData.settings.template,
            },
        })
        .then(() => {
            dataThing.statusCheck();
        });
}

export function callActionEndpoint(endpoint, params) {
    return backend.post(endpoint, params);
}

export function callEndpoint(endpoint, params) {
    return dataThing.request(endpoint, params);
}

export function downloadDataTraceFile(document_index_uid) {
    return callEndpoint('dataprovider/prepare-data-trace-file', {document_index_uid}).then(key =>
        formPost(`${config.api_base_url}download/prepared_file/${key}`),
    );
}

export const createDirectory = ({name, parentUid}) => {
    return backend
        .post('directory/create_client_directory', {
            name: name,
            parent_uid: parentUid,
        })
        .then(() => {
            dataThing.statusCheck();
        });
};

export const moveDirectory = ({entryUid, parentUid}) => {
    return backend
        .post('directory/move_client_directory', {
            entry_uid: entryUid,
            parent_uid: parentUid,
        })
        .then(() => {
            dataThing.statusCheck();
        });
};

export const moveReport = ({entryUid, parentUid}) => {
    return backend
        .post('directory/move_report_to_directory', {
            leaf_entry_uid: entryUid,
            parent_uid: parentUid,
        })
        .then(() => {
            dataThing.statusCheck();
        });
};

export const addReportToDirectory = ({parentUid, dashboardUid}) => {
    return backend
        .post('directory/add_report_to_directory', {
            parent_uid: parentUid,
            dashboard_uid: dashboardUid,
        })
        .then(() => {
            dataThing.statusCheck();
        });
};

export const removeReportFromDirectory = ({entryUid}) => {
    return backend
        .post('directory/remove_report_from_directory', {
            leaf_entry_uid: entryUid,
        })
        .then(() => {
            dataThing.statusCheck();
        });
};

export const duplicateReport = ({entryUid, dashboardUid}) => {
    return backend
        .post('directory/duplicate_report', {
            dashboard_uid: dashboardUid,
            leaf_entry_uid: entryUid,
        })
        .then(() => {
            dataThing.statusCheck();
        });
};

export const deleteDirectory = ({uid}) => {
    return backend
        .post('directory/delete_client_directory', {
            entry_uid: uid,
        })
        .then(() => {
            dataThing.statusCheck();
        });
};

export const deleteReport = ({dashboardUid}) => {
    return backend
        .post('directory/delete_dashboard', {
            dashboard_uid: dashboardUid,
        })
        .then(() => {
            dataThing.statusCheck();
        });
};

export const renameDirectory = ({uid, name}) => {
    return backend
        .post('directory/rename_client_directory', {
            entry_uid: uid,
            name,
        })
        .then(() => {
            dataThing.statusCheck();
        });
};

export const exportReport = ({dashboardUid}) => {
    return backend
        .post('directory/export_report', {
            dashboard_uid: dashboardUid,
        })
        .then(({key}) => {
            formPost(config.download_pdf_base + key, '');
        });
};

export const exportDirectory = ({entryUid}) => {
    return backend
        .post('directory/export_directory', {
            entry_uid: entryUid,
        })
        .then(({key}) => {
            formPost(config.download_pdf_base + key, '');
        });
};

export async function createCalculatedMetric({formula, name, format}) {
    const result = await backend.post('calculated-metric/create', {
        formula,
        name,
        format,
    });
    dataThing.statusCheck();
    return result;
}

export async function deleteCalculatedMetrics({uids}) {
    const result = await backend.post('calculated-metric/delete', {
        calculated_metric_uids: uids,
    });
    dataThing.statusCheck();
    return result;
}

export async function updateCalculatedMetric({uid, formula, name, format}) {
    const result = await backend.post('calculated-metric/update', {
        calculated_metric_uid: uid,
        formula,
        name,
        format,
    });
    dataThing.statusCheck();
    return result;
}

export async function getAppOTPs() {
    const result = await backend.get('sso/apps/get-app-otps', {});
    dataThing.statusCheck();
    return result;
}

export async function approveAppOTP(otp) {
    const result = await backend.post('sso/apps/approve-app-otp', otp);
    dataThing.statusCheck();
    return result;
}

export async function denyAppOTP(otp) {
    const result = await backend.post('sso/apps/deny-app-otp', otp);
    dataThing.statusCheck();
    return result;
}

export async function processSpreadsheet(body) {
    const result = await backend.post('/upload/process-spreadsheet', body);
    dataThing.statusCheck();
    return result;
}
