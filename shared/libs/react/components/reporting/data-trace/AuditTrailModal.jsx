import React, {useCallback, useState, useMemo} from 'react';
import {Box, Flex} from '@rebass/grid';

import {LightTheme} from 'themes';
import {useBackendData} from 'utils/backendConnect';
import * as api from 'api';

import {gen_formatter} from 'src/libs/Formatters';
import * as Constants from 'src/libs/Constants';

import Button from 'components/basic/forms/Button';
import Loader from 'components/basic/Loader';
import {is_set} from 'src/libs/Utils';
import Modal, {ModalContent} from 'components/basic/Modal';
import {formatAction, splitLocaleDatetime} from 'components/reporting/data-trace/utils';
import DataTable from 'components/basic/DataTable';
import {Link} from 'components/basic/text';
import {
    AsOfDate,
    BigBlueValue,
    BigGreyValue,
    DateBox,
    GreyLabel,
    Header,
    Footer,
    MetricDescription,
    ModeToggle,
    NoHistory,
    ReadOnlyText,
    TimeBox,
    BlueText,
    NoteIcon,
} from 'components/reporting/data-trace/elements';

const SplitDateTime = ({date, children}) => {
    const [sdate, stime] = splitLocaleDatetime(new Date(date * 1000));

    return children ? (
        children({date: sdate, time: stime})
    ) : (
        <div>
            <DateBox>{sdate}</DateBox>
            <TimeBox>{stime}</TimeBox>
        </div>
    );
};

export default function AuditTrailModal({
    companyUid,
    dealUid,
    date,
    enableEditModeToggle = true,
    isOpen,
    metricSetUid,
    metricUid,
    metricVersionUid,
    onClose = () => {},
    toggleEditModal,
    toggleModal,
}) {
    const [activeEntry, setActiveEntry] = useState(null);

    const {data: metricSet, isLoading, hasTriggered} = useBackendData(
        'dataprovider/metric_set',
        {
            metric_set_uid: metricSetUid,
            company_uid: companyUid,
            deal_uid: dealUid,
            metric_uid: metricUid,
            metric_version_uid: metricVersionUid,
        },
        {
            triggerConditional: params =>
                isOpen &&
                (params.metric_set_uid ||
                    ((params.company_uid || params.deal_uid) &&
                        params.metric_uid &&
                        params.metric_version_uid)),
        },
    );

    const handleExitAnimationComplete = useCallback(() => {
        setActiveEntry(null);
        onClose();
    }, [onClose]);

    const showNote = useCallback(entry => setActiveEntry(entry), []);

    return (
        <LightTheme>
            <Modal
                isOpen={isOpen}
                onExitAnimationComplete={handleExitAnimationComplete}
                openStateChanged={toggleModal}
            >
                {isLoading || !hasTriggered ? (
                    <Loader />
                ) : (
                    <ModalContent flexDirection='column'>
                        <Header py={3}>
                            <Flex px={1} alignItems='center' justifyContent='space-between'>
                                <MetricDescription
                                    metricName={metricSet.metric.name}
                                    versionName={metricSet.version.name}
                                />
                                {!activeEntry && enableEditModeToggle && (
                                    <ModeToggle onClick={toggleEditModal}>Edit Value</ModeToggle>
                                )}
                            </Flex>
                        </Header>
                        {activeEntry && activeEntry.note ? (
                            <ViewNote
                                entry={activeEntry}
                                metricFormat={metricSet.metric.format}
                                renderCurrency={metricSet.base_currency_symbol}
                            />
                        ) : (
                            <ViewList
                                companyUid={companyUid}
                                dealUid={dealUid}
                                metricFormat={metricSet.metric.format}
                                asOfDate={date}
                                metricSet={metricSet}
                                renderCurrency={metricSet.base_currency_symbol}
                                showNote={showNote}
                            />
                        )}
                        <Footer>
                            {activeEntry ? (
                                <Button flex='0 1 auto' px={3} onClick={() => setActiveEntry(null)}>
                                    Back
                                </Button>
                            ) : (
                                <Button flex='0 1 auto' px={3} onClick={toggleModal}>
                                    Close
                                </Button>
                            )}
                        </Footer>
                    </ModalContent>
                )}
            </Modal>
        </LightTheme>
    );
}

function ViewList({
    companyUid,
    dealUid,
    metricFormat,
    asOfDate,
    metricSet,
    renderCurrency,
    showNote,
}) {
    const {data: metricTrace, isLoading} = useBackendData(
        'dataprovider/metric-value-trace',
        {
            company_uid: companyUid,
            deal_uid: dealUid,
            value_date: asOfDate,
            set_uid: metricSet.uid,
        },
        {
            triggerConditional: params =>
                (params.company_uid || params.deal_uid) && params.value_date && params.set_uid,
            initialData: [],
        },
    );

    const getDataTraceFile = document_index_uid => {
        api.downloadDataTraceFile(document_index_uid);
    };

    const activePair = useMemo(
        () => (metricSet?.pairs ?? []).find(pair => pair.date == asOfDate), // Intentional '==' instead of '===', sorry.
        [metricSet, asOfDate],
    );

    if (isLoading) {
        return <Loader />;
    }

    const formatter = genMetricFormatter(metricFormat, renderCurrency);

    return (
        <>
            <Header px={1} py={3} justifyContent='space-between' alignItems='center'>
                <GreyLabel>Current Value</GreyLabel>
                <BigBlueValue mb={2}>{formatter(activePair?.value)}</BigBlueValue>
                <AsOfDate timestamp={asOfDate} />
            </Header>
            <Box mt={2} py={3} px={3}>
                {is_set(metricTrace, true) ? (
                    <DataTable
                        columns={[
                            {
                                label: 'Value',
                                key: 'new_value',
                                cellRenderer: ({cellData}) => formatter(cellData),
                            },
                            {label: 'Date', key: 'action_date', format: 'backend_datetime'},
                            {label: 'User', key: 'user_name'},
                            {
                                label: 'Update Type',
                                key: 'action_type',
                                formatter: ({cellData}) => formatAction(cellData),
                            },
                            {
                                label: 'Filename',
                                key: 'filename',
                                cellRenderer: function RenderFileName({cellData, rowData}) {
                                    return (
                                        cellData && (
                                            <Link
                                                onClick={
                                                    rowData?.document_index_uid &&
                                                    (() =>
                                                        getDataTraceFile(
                                                            rowData.document_index_uid,
                                                        ))
                                                }
                                            >
                                                {cellData}
                                            </Link>
                                        )
                                    );
                                },
                            },
                            {
                                label: 'Note',
                                key: 'note',
                                width: 40,
                                cellRenderer: function RenderNoteButton({cellData, rowData}) {
                                    return (
                                        <NoteIcon
                                            bisonicon
                                            name='form'
                                            onClick={cellData ? () => showNote(rowData) : undefined}
                                        />
                                    );
                                },
                            },
                        ]}
                        enableContextHeader
                        label='Audit Trail'
                        rowKey='action_date'
                        rows={metricTrace}
                        sortInline
                        pushHeight
                    />
                ) : (
                    <NoHistory />
                )}
            </Box>
        </>
    );
}

function ViewNote({metricFormat, renderCurrency, entry}) {
    const valueFormatter = genMetricFormatter(metricFormat, renderCurrency);

    return (
        <>
            <Header px={1} py={3}>
                <Flex justifyContent='space-between' alignItems='center'>
                    <Box>
                        <SplitDateTime date={entry.action_date}>
                            {({date, time}) => (
                                <Flex alignItems='flex-start' flexDirection='column'>
                                    <DateBox mb={2} fontSize='1.6em'>
                                        {date}
                                    </DateBox>
                                    <TimeBox mb={2}>{time}</TimeBox>
                                </Flex>
                            )}
                        </SplitDateTime>
                        <Box>Performed By: {entry.user_name}</Box>
                        {entry.filename && <Box>File: {entry.filename}</Box>}
                    </Box>
                    <Flex>
                        <Box mr={3}>
                            <GreyLabel>Previous value</GreyLabel>
                            <BigGreyValue>
                                {is_set(entry.previous_value)
                                    ? valueFormatter(entry.previous_value)
                                    : 'N/A'}
                            </BigGreyValue>
                        </Box>
                        <Box ml={3}>
                            <GreyLabel>Changed to</GreyLabel>
                            <BigBlueValue>{valueFormatter(entry.new_value)}</BigBlueValue>
                        </Box>
                    </Flex>
                </Flex>
            </Header>
            <Box mt={3}>
                <Flex alignItems='center' justifyContent='space-between'>
                    <Box my={2}>
                        <Box mb={1}>
                            <BlueText>Written By: {entry.user_name}</BlueText>
                        </Box>
                        <SplitDateTime date={entry.action_date}>
                            {({date, time}) => (
                                <GreyLabel titleize>
                                    {date} - {time}
                                </GreyLabel>
                            )}
                        </SplitDateTime>
                    </Box>
                </Flex>
                <ReadOnlyText>{entry.note}</ReadOnlyText>
            </Box>
        </>
    );
}

function genMetricFormatter(metricFormat, renderCurrency) {
    return value => {
        if (!is_set(value)) {
            return 'N/A';
        }

        const valueFormat =
            Constants.format_options.find(format => format.value === metricFormat).format ??
            'money';

        return gen_formatter({
            format: valueFormat,
            format_args: {
                render_currency: renderCurrency,
                abbreviate: false,
            },
        })(value);
    };
}
