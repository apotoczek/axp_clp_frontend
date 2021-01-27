import React, {useState, useCallback, useMemo} from 'react';
import styled from 'styled-components';
import {useParams, useHistory} from 'react-router-dom';
import {Flex, Box} from '@rebass/grid';

import * as Formatters from 'utils/formatters';
import {object_from_array} from 'src/libs/Utils';
import {AccessLevel} from 'src/libs/Enums';

import dashboardComponents from 'libs/dashboard-components';

import {useBackendData, useBackendEndpoint} from 'utils/backendConnect';
import {usePartiallyAppliedCallback} from 'utils/hooks';

import Dropdown from 'components/basic/forms/dropdowns/Dropdown';
import Modal, {ModalHeader, ModalContent} from 'components/basic/Modal';
import Button from 'components/basic/forms/Button';
import {TextBase, H1, H2, H5, Bold, Italic, Description} from 'components/basic/text';
import {Content} from 'components/layout';
import Toolbar, {ToolbarItem} from 'components/basic/Toolbar';
import Loader from 'components/basic/Loader';
import Icon from 'components/basic/Icon';
import DataTable from 'components/basic/DataTable';
import SlideInSidePanel from 'components/SlideInSidePanel';
import TabbedView, {Tab} from 'components/TabbedView';

import {NavigationHelper} from './helpers';

const TypeSelectorBox = styled(Flex)`
    border-radius: 3px;
    box-shadow: 2px 2px 3px rgba(0, 0, 0, 0.2);
    padding: 8px;
    background: #ffffff;
`;

const Item = styled(Flex)`
    border-radius: 3px;
    flex-direction: column;
    filter: grayscale(100%);

    cursor: pointer;

    &:hover {
        background: #f5f5f5;
    }
`;

const ExpandedAreaImage = styled.img`
    display: block;
`;

const ComponentName = styled(H5)`
    text-align: center;
`;

function ReportingComponentTypeSelector({onClickComponent}) {
    return (
        <TypeSelectorBox flex={1}>
            <Flex justifyContent='space-evenly' flex={1}>
                <Item onClick={onClickComponent}>
                    <ExpandedAreaImage src={dashboardComponents['reportingComponent'].icon} />
                    <ComponentName>Text Block</ComponentName>
                </Item>
            </Flex>
        </TypeSelectorBox>
    );
}

function PageToolbar({companyId, onDelete, enableDelete}) {
    const history = useHistory();
    const navigateToCreate = useCallback(
        () => history.push(NavigationHelper.newReportingComponentLink(companyId)),
        [companyId, history],
    );

    return (
        <Toolbar>
            <Dropdown
                render={({togglePopover}) => (
                    <ReportingComponentTypeSelector
                        togglePopover={togglePopover}
                        onClickComponent={navigateToCreate}
                    />
                )}
                right
            >
                <ToolbarItem icon='plus' glyphicon>
                    Create New Reporting Component
                </ToolbarItem>
            </Dropdown>
            <ToolbarItem icon='trash' glyphicon right onClick={onDelete} disabled={!enableDelete}>
                Delete Reporting Components
            </ToolbarItem>
        </Toolbar>
    );
}

export default function ComponentsTable() {
    const {companyId} = useParams();
    const history = useHistory();

    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [selectedComponents, setSelectedComponents] = useState([]);
    const [showVersionsFor, setShowVersionsFor] = useState(null);
    const {
        data: {reporting_component_instances: reportingComponentInstances = []},
        isLoading: isTableLoading,
    } = useBackendData(
        'reporting-components/instance/list',
        {
            company_uids: [companyId],
            with_access: AccessLevel.Write,
            result_filters: {
                only: [
                    'reporting_components.uid',
                    'reporting_components.name',
                    'reporting_components.last_modified',
                    'reporting_components.last_modified_by',
                    'reporting_components.latest_as_of_date',
                    'reporting_components.reporting_component.uid',
                ],
            },
        },
        {requiredParams: ['company_uids']},
    );
    const reportingComponentInstancesByUid = useMemo(
        () => object_from_array(reportingComponentInstances, instance => [instance.uid, instance]),
        [reportingComponentInstances],
    );

    const {
        data: {reporting_component_instance: versionRCInstance} = {},
        isLoading: isLoadingVersions,
    } = useBackendData(
        'reporting-components/instance/get',
        {
            uid: showVersionsFor,
        },
        {requiredParams: ['uid']},
    );

    const toggleConfirmModal = useCallback(() => setIsConfirmModalOpen(prev => !prev), []);

    const {
        triggerEndpoint: deleteReportingComponentInstances,
        isLoading: isDeletingReportingComponentInstances,
    } = useBackendEndpoint('reporting-components/instance/delete');
    const handleDeleteReportingComponentInstances = useCallback(() => {
        deleteReportingComponentInstances({
            uids: selectedComponents,
            company_uids: [companyId],
        }).then(() => {
            setSelectedComponents([]);
            toggleConfirmModal();
        });
    }, [companyId, deleteReportingComponentInstances, selectedComponents, toggleConfirmModal]);

    const handleRowClick = useCallback(
        row => {
            const toUrl = NavigationHelper.editReportingComponentLink(companyId, row.uid);
            history.push(toUrl);
        },
        [companyId, history],
    );
    const handleCloseSlideIn = useCallback(() => setShowVersionsFor(null), []);
    const handleOptionsClicked = usePartiallyAppliedCallback(
        (row, e) => {
            e.stopPropagation();
            setShowVersionsFor(row.uid);
        },
        [setShowVersionsFor],
    );
    const actionCellRenderer = useCallback(
        ({rowData}) => (
            <Icon name='option-vertical' glyphicon button onClick={handleOptionsClicked(rowData)} />
        ),
        [handleOptionsClicked],
    );

    const columns = useMemo(() => {
        return [
            {key: 'reporting_component:name', label: 'Name'},
            {
                key: 'as_of_date',
                label: 'As of Date',
                format: 'backend_date',
            },
            {
                key: 'last_modified',
                label: 'Last Modified',
                format: 'backend_datetime',
            },
            {
                key: 'last_modified_by:name',
                label: 'Last Modified By',
            },
            {
                key: 'actions',
                cellRenderer: actionCellRenderer,
                disableSort: true,
                right: true,
            },
        ];
    }, [actionCellRenderer]);

    return (
        <>
            <Content>
                <PageToolbar
                    companyId={companyId}
                    onDelete={toggleConfirmModal}
                    enableDelete={selectedComponents.length > 0}
                />
                <Flex flex='1'>
                    <Box flex='2'>
                        <DataTable
                            rowKey='uid'
                            isLoading={isTableLoading}
                            rows={reportingComponentInstances}
                            columns={columns}
                            selectOnRowClick={false}
                            enableSorting
                            sortInline
                            enableRowClick
                            onRowClick={handleRowClick}
                            enableHeaderRow
                            enableSelection
                            selection={selectedComponents}
                            onSelectionChanged={setSelectedComponents}
                            defaultSortBy={['as_of_date', 'last_modified']}
                            defaultSortDirection={{as_of_date: 'DESC', last_modified: 'DESC'}}
                        />
                    </Box>
                    <SlideInSidePanel visible={!!showVersionsFor} onClose={handleCloseSlideIn}>
                        <TabbedView activeTab='versions'>
                            <Tab name='Versions' id='versions'>
                                <VersionTab
                                    rcInstance={versionRCInstance}
                                    isLoading={isLoadingVersions}
                                />
                            </Tab>
                        </TabbedView>
                    </SlideInSidePanel>
                </Flex>
            </Content>
            <ConfirmDeleteModal
                components={selectedComponents.map(uid => reportingComponentInstancesByUid[uid])}
                isOpen={isConfirmModalOpen}
                toggleModal={toggleConfirmModal}
                onConfirm={handleDeleteReportingComponentInstances}
                tableColumns={columns.slice(0, -1)}
                isDeleting={isDeletingReportingComponentInstances}
            />
        </>
    );
}

const VersionBox = styled(Flex)`
    align-items: center;
    justify-content: center;

    font-size: 16px;
    font-weight: 300;

    border-radius: 6px;
    border: 1px solid #666666;
    background: #e4e8ee;

    min-width: 50px;
    min-height: 50px;
    max-width: 50px;
    max-height: 50px;
    margin-right: 12px;
`;

const VersionTitle = styled(H2)`
    margin: 0 0 4px;
    font-weight: 700;
    font-size: 14px;
`;

const VersionDescription = styled.span`
    ${TextBase}
    font-size: 13px;
`;

function VersionTab({rcInstance, isLoading}) {
    if (!rcInstance || isLoading) {
        return <Loader />;
    }

    return (
        <Flex flexDirection='column' flex={1}>
            {rcInstance.versions.map((version, i) => (
                <Flex key={version.created} mb={2}>
                    <VersionBox>V{rcInstance.versions.length - i}</VersionBox>
                    <Flex flexDirection='column' justifyContent='center' flex={1}>
                        {i == 0 && <VersionTitle>Current Version</VersionTitle>}
                        <VersionDescription>
                            Modified by <Bold>{version.user.name}</Bold>
                            {i == 0 ? ' ' : <br />}
                            on <Italic>{Formatters.backend_datetime(version.created)}</Italic>
                        </VersionDescription>
                    </Flex>
                    <Flex alignItems='center' justifyContent='flex-end' flex={0}>
                        <Icon name='option-vertical' glyphicon button />
                    </Flex>
                </Flex>
            ))}
        </Flex>
    );
}

function ConfirmDeleteModal({
    isOpen,
    toggleModal,
    onConfirm,
    components,
    tableColumns,
    isDeleting,
}) {
    return (
        <Modal isOpen={isOpen} openStateChanged={toggleModal}>
            <ModalContent flexDirection='column'>
                <ModalHeader>
                    <H1>Please Confirm...</H1>
                </ModalHeader>
                <Box mb={2}>
                    <DataTable
                        rowKey='uid'
                        rows={components}
                        columns={tableColumns}
                        enableSorting
                        sortInline
                        enableHeaderRow
                        defaultSortBy={['as_of_date', 'last_modified']}
                        defaultSortDirection={{as_of_date: 'DESC', last_modified: 'DESC'}}
                        pushHeight
                        enablePagination
                        resultsPerPage={10}
                    />
                </Box>
                <Description>
                    Are you sure you want to delete these reporting components? This action cannot
                    be undone.
                </Description>
                <Flex justifyContent='flex-end' mt={2}>
                    {isDeleting ? (
                        <Description>Deleting reporting components, please wait...</Description>
                    ) : (
                        <>
                            <Button mr={2} onClick={toggleModal}>
                                Close
                            </Button>
                            <Button primary onClick={onConfirm}>
                                Confirm
                            </Button>
                        </>
                    )}
                </Flex>
            </ModalContent>
        </Modal>
    );
}
