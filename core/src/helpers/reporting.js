import {Frequency} from 'src/libs/Enums';
import DataThing from 'src/libs/DataThing';

import {convertReportingMeta} from 'src/libs/react/components/reporting/MetaDataTable';
import {backend_month_short, backend_date} from 'src/libs/Formatters';

export function frequencies() {
    const res = [];

    for (const [label, value] of Object.entries(Frequency)) {
        res.push({label, value});
    }

    return res;
}

export function mapped_request({latest_submission, relationship, ...rest}) {
    return {
        latest_submission:
            latest_submission &&
            mapped_submission({
                ...latest_submission,
                as_of: latest_submission.as_of_date,
                status_label: latest_submission.status_text,
                sender_client_name: relationship.company_name,
                recipient_client_name: relationship.recipient_name,
                company_name: relationship.company_name,
                sent_by_name: latest_submission.sent_by.name,
            }),
        relationship,
        ...rest,
    };
}

export function mapped_details({uid, file_name, user, created, status, status_label, result}) {
    const eligible = result && result.eligible;
    const sheets = result && result.sheets.map(s => mapped_sheet(s));

    return {
        uid,
        created,
        eligible,
        sheets,
        reason: result && result.reason,
        createdLabel: backend_date(created),
        status,
        statusLabel: status_label,
        uploadedBy: user ? user.name : 'N/A',
        fileName: file_name,
    };
}

export function mapped_submission({
    sheets,
    created,
    as_of,
    status_label,
    contact_name,
    sender_client_name,
    recipient_client_name,
    company_name,
    sent_by_name,
    ...rest
}) {
    return {
        ...rest,
        created,
        asOf: as_of,
        statusLabel: status_label,
        senderClientName: sender_client_name,
        recipientClientName: recipient_client_name,
        companyName: company_name,
        contactName: contact_name,
        sentByName: sent_by_name,
        createdLabel: backend_date(created),
        sheets: sheets && sheets.map(s => mapped_sheet(s)),
    };
}

export function mapped_sheet({metrics, dates, backfill_dates, name, type, meta_data}) {
    if (type === 'meta_data') {
        return {
            name,
            type: 'metaData',
            data: convertReportingMeta({meta_data}),
        };
    }

    return {
        name,
        type,
        backfillDates: backfill_dates.map(d => ({
            label: backend_month_short(d),
            key: d,
        })),
        dates: dates.map(d => ({
            label: backend_month_short(d),
            key: d,
        })),
        metrics: metrics.map(m => ({
            baseMetricName: m.base_metric_name,
            reportingPeriod: m.reporting_period,
            format: m.format,
            values: m.values,
            backfillValues: m.backfill_values,
        })),
    };
}

export function mapped_relationship({
    client_name,
    contact_name,
    contact_email,
    last_reported,
    company_uid,
    from_email,
    from_email_name,
    ...rest
}) {
    return {
        ...rest,
        clientName: client_name,
        contactName: contact_name,
        contactEmail: contact_email,
        lastReported: last_reported,
        companyUid: company_uid,
        fromEmail: from_email,
        fromEmailName: from_email_name,
    };
}

export function mapped_mandate({
    reporting_template_uid,
    notifications,
    request_date_offset_days,
    due_date_offset_days,
    reporting_email_sequence_uid,
    reply_to_user_uid,
    rel_uids,
    ...rest
}) {
    return {
        ...rest,
        emailSequenceUid: reporting_email_sequence_uid,
        replyToUserUid: reply_to_user_uid,
        templateUid: reporting_template_uid,
        notifications: notifications,
        relativeRequestDate: offset_to_relative(request_date_offset_days),
        relativeDueDate: offset_to_relative(due_date_offset_days),
        relUids: rel_uids || [],
    };
}

export function mandate_params(mandate) {
    return {
        name: mandate.name,
        frequency: parseInt(mandate.frequency),
        reporting_template_uid: mandate.templateUid,
        notifications: mandate.notifications,
        request_date_offset_days: relative_to_offset(mandate.relativeRequestDate),
        due_date_offset_days: relative_to_offset(mandate.relativeDueDate),
        mandate_uid: mandate.uid,
        reporting_email_sequence_uid: mandate.emailSequenceUid || null,
        reply_to_user_uid: mandate.replyToUserUid || null,
        // rel_uids: mandate.relUids || [],
    };
}

export function offset_to_relative(offset) {
    return {
        days: Math.abs(offset),
        base: offset < 0 ? 'before' : 'after',
    };
}

export function relative_to_offset({base, days}) {
    return base === 'before' ? -days : days;
}

export function gen_endpoint(url) {
    return DataThing.backends.reporting({
        url: url,
    });
}

export function key_value_map(items, key = 'uid', value = 'name') {
    const mapped = {};

    for (const item of items) {
        mapped[item[key]] = item[value];
    }

    return mapped;
}

export function sheet_of_supporting_documents(documents) {
    return {
        type: 'supportingDocuments',
        name: 'Documents',
        data: {
            label: 'File Name',
            values: documents,
        },
    };
}
