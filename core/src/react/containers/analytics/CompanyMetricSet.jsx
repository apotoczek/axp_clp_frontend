import React, {useCallback, useState, useEffect} from 'react';

import {useBackendData} from 'utils/backendConnect';
import * as Formatters from 'src/libs/Formatters';
import {callActionEndpoint, dataThing} from 'api';
import {Content, Page} from 'components/layout';
import CPanel from 'components/basic/cpanel/base';
import CompanyModeToggle from 'components/datamanager/company/CompanyModeToggle';
import Toolbar, {ToolbarItem} from 'components/basic/Toolbar';
import Modal, {ModalHeader, ModalContent} from 'components/basic/Modal';
import {H3} from 'components/basic/text';
import {Flex} from '@rebass/grid';
import Button from 'components/basic/forms/Button';
import TextInput from 'components/basic/forms/input/TextInput';

import AuditTrailModal from 'components/reporting/data-trace/AuditTrailModal';
import EditMetricValueModal from 'components/metrics/EditMetricValueModal';
import AddMetricModal from 'components/metrics/AddMetricModal';
import DataTable from 'components/basic/DataTable';
import {
    contextMenuCellRenderer,
    defaultCellRenderer,
} from 'components/basic/DataTable/cellRenderers';

function metricValueCellRenderer(
    onOpenAuditTrailModal,
    onOpenEditModal,
    {cellData, columnData, rowData},
) {
    if (cellData === null || cellData === undefined) {
        return defaultCellRenderer({cellData, columnData, rowData});
    }

    return contextMenuCellRenderer(({rowData}) => {
        return [
            {
                key: 1,
                label: 'Edit Value',
                onClick: onOpenEditModal.bind(null, rowData),
            },
            {
                key: 2,
                label: 'View Audit Trail',
                onClick: onOpenAuditTrailModal.bind(null, rowData.date),
            },
        ];
    })({cellData, columnData, rowData});
}

function metricValueCellFormatter(renderCurrency, {cellData, columnData}) {
    return Formatters.gen_formatter({
        format: columnData.metricFormat,
        format_args: {
            render_currency: renderCurrency,
        },
    })(cellData);
}

function ConfirmDeleteMetricPairsModal({isOpen, toggleModal, onConfirm}) {
    return (
        <Modal isOpen={isOpen} openStateChanged={toggleModal}>
            <ModalContent flexDirection='column' maxWidth={600}>
                <ModalHeader>
                    <H3>Are you sure you want to delete the selected metric values?</H3>
                </ModalHeader>
                <Flex justifyContent='flex-end' mt={2}>
                    <Button mr={2} onClick={toggleModal}>
                        Cancel
                    </Button>
                    <Button primary onClick={() => onConfirm().then(toggleModal)}>
                        Confirm
                    </Button>
                </Flex>
            </ModalContent>
        </Modal>
    );
}

function EditNoteModal({isOpen, toggleModal, onConfirm}) {
    const [newNote, setNewNote] = useState('');
    useEffect(() => setNewNote(''), [isOpen]);

    return (
        <Modal isOpen={isOpen} openStateChanged={toggleModal}>
            <ModalContent flexDirection='column' maxWidth={600}>
                <ModalHeader>
                    <H3>Update notes for the selected pairs</H3>
                </ModalHeader>
                <TextInput value={newNote} onValueChanged={setNewNote} topLabel='Note' />
                <Flex justifyContent='flex-end' mt={2}>
                    <Button mr={2} onClick={toggleModal}>
                        Cancel
                    </Button>
                    <Button primary onClick={() => onConfirm(newNote)}>
                        Save
                    </Button>
                </Flex>
            </ModalContent>
        </Modal>
    );
}

export default function CompanyMetricSet({modes, activeMode, setMode, metricSetUid}) {
    const {data, hasData} = useBackendData(
        'dataprovider/metric_set',
        {metric_set_uid: metricSetUid},
        {requiredParams: ['metric_set_uid']},
    );

    const [selection, setSelection] = useState([]);
    useEffect(() => setSelection([]), [metricSetUid]);

    const [auditDate, setAuditDate] = useState(null);
    const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);

    const metricName =
        data?.metric?.name && data?.version?.name && `${data.metric.name} (${data.version.name})`;
    const metricFormat = data?.metric?.format;
    const renderCurrency = data?.base_currency_symbol;

    const openAuditTrailModal = useCallback(date => {
        setAuditDate(date);
        setIsAuditModalOpen(true);
    }, []);
    const closeAuditTrailModal = useCallback(() => setIsAuditModalOpen(false), []);

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editDate, setEditDate] = useState(undefined);
    const openEditModal = useCallback(rowData => {
        setEditDate(rowData.date);
        setIsEditModalOpen(true);
    }, []);

    const [addMetricModalOpen, setAddMetricModalOpen] = useState(false);
    const toggleAddMetricModal = () => setAddMetricModalOpen(!addMetricModalOpen);

    const [confirmDeleteModalOpen, setConfirmDeleteModalOpen] = useState(false);
    const [editNoteModalOpen, setEditNoteModalOpen] = useState(false);

    const deleteSelection = useCallback(
        () =>
            callActionEndpoint('useractionhandler/delete_metric_pairs', {
                pair_uids: selection,
            }).then(() => {
                setConfirmDeleteModalOpen(false);
                setSelection([]);
                dataThing.statusCheck();
            }),
        [selection],
    );

    const setNotesForSelection = useCallback(
        note =>
            callActionEndpoint('useractionhandler/update_pair_notes', {uids: selection, note}).then(
                () => {
                    setEditNoteModalOpen(false);
                    setSelection([]);
                    dataThing.statusCheck();
                },
            ),
        [selection],
    );

    return (
        <>
            <Page height='100%'>
                {modes && (
                    <CPanel>
                        <CompanyModeToggle
                            activeMode={activeMode}
                            setMode={setMode}
                            modes={modes}
                        />
                    </CPanel>
                )}
                <Content>
                    <Toolbar>
                        <ToolbarItem
                            right
                            icon='plus'
                            onClick={() => setEditNoteModalOpen(true)}
                            disabled={!selection?.length}
                        >
                            Update Selected Notes
                        </ToolbarItem>
                        <ToolbarItem
                            right
                            icon='trash'
                            onClick={() => setConfirmDeleteModalOpen(true)}
                            disabled={!selection?.length}
                        >
                            Delete Selected
                        </ToolbarItem>
                        <ToolbarItem right icon='plus' onClick={() => setAddMetricModalOpen(true)}>
                            Add Metric Value
                        </ToolbarItem>
                    </Toolbar>
                    <DataTable
                        enableContextHeader
                        label={metricName ?? ''}
                        enablePagination
                        enableHorizontalScrolling
                        isLoading={!hasData}
                        rows={data?.pairs ?? []}
                        defaultSortBy={['date']}
                        enableSelection
                        selection={selection}
                        onSelectionChanged={setSelection}
                        rowKey='uid'
                        columns={[
                            {
                                key: 'date',
                                label: 'Date',
                                flexGrow: 1,
                                width: 75,
                                flexShrink: 0,
                                format: 'backend_date',
                            },
                            {
                                label: 'Value',
                                key: 'value',
                                metricFormat,
                                formatter: metricValueCellFormatter.bind(null, renderCurrency),
                                cellRenderer: metricValueCellRenderer.bind(
                                    null,
                                    openAuditTrailModal,
                                    openEditModal,
                                ),
                            },
                            {
                                label: 'Note',
                                key: 'note',
                            },
                        ]}
                    />
                    <AuditTrailModal
                        isOpen={isAuditModalOpen}
                        onClose={() => setAuditDate(null)}
                        toggleModal={closeAuditTrailModal}
                        enableEditModeToggle={false}
                        date={auditDate}
                        companyUid={data?.company?.uid}
                        metricSetUid={data?.uid}
                    />
                    <EditMetricValueModal
                        isOpen={isEditModalOpen}
                        toggleModal={() => setIsEditModalOpen(false)}
                        companyUid={data?.company?.uid}
                        date={editDate}
                        metricSetUid={data?.uid}
                    />
                    <ConfirmDeleteMetricPairsModal
                        isOpen={confirmDeleteModalOpen}
                        toggleModal={() => setConfirmDeleteModalOpen(false)}
                        onConfirm={deleteSelection}
                    />
                    <EditNoteModal
                        isOpen={editNoteModalOpen}
                        toggleModal={() => setEditNoteModalOpen(false)}
                        onConfirm={setNotesForSelection}
                    />
                    <AddMetricModal
                        companyUid={data?.company?.uid}
                        isOpen={addMetricModalOpen}
                        toggleModal={toggleAddMetricModal}
                        initialVersionUid={data?.version?.uid}
                        initialMetricUid={data?.metric?.uid}
                    />
                </Content>
            </Page>
        </>
    );
}
