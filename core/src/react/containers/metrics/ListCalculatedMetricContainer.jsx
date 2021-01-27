import React, {useState} from 'react';
import {useBackendData} from 'utils/backendConnect';
import DataTable from 'components/basic/DataTable';
import {deleteCalculatedMetrics} from 'api';
import {Container} from 'components/layout';
import Toolbar, {ToolbarItem, NonRouterLink} from 'components/basic/Toolbar';
import Button from 'components/basic/forms/Button';
import {Flex, Box} from '@rebass/grid';
import {H1} from 'components/basic/text';
import {ModalHeader} from 'components/reporting/shared';
import Modal, {ModalContent} from 'components/basic/Modal';

const ConfirmDeleteModal = ({open, close, entries, onConfirm}) => (
    <Modal openStateChanged={close} isOpen={open}>
        <ModalContent flexDirection='column'>
            <ModalHeader width={1} pb={2} mb={3}>
                <H1>Delete</H1>
            </ModalHeader>
            <Box mt={3}>
                This will permanently delete the following metrics:
                <Box p={10}>
                    {entries?.length > 0 && (
                        <DataTable
                            pushHeight
                            enableColumnToggle={false}
                            columns={[{label: 'Name', key: 'name'}]}
                            rowKey='uid'
                            rows={entries}
                        />
                    )}
                </Box>
                <Flex mt={3} justifyContent='flex-end'>
                    <Button mr={1} onClick={close}>
                        Cancel
                    </Button>
                    <Button
                        primary
                        onClick={() => {
                            onConfirm();
                            close();
                        }}
                    >
                        Delete
                    </Button>
                </Flex>
            </Box>
        </ModalContent>
    </Modal>
);

function ListToolbar({selection, onDelete}) {
    let items;
    if (selection?.length > 0) {
        items = (
            <ToolbarItem onClick={onDelete} icon='trash' glyphicon right>
                Delete selected metrics
            </ToolbarItem>
        );
    } else {
        items = (
            <ToolbarItem
                to='#!/data-manager/metrics:calculated/new'
                icon='plus'
                linkComponent={NonRouterLink}
                right
            >
                New Calculated Metric
            </ToolbarItem>
        );
    }

    return <Toolbar>{items}</Toolbar>;
}

export default function ListCalculatedMetricContainer() {
    const [deleting, setDeleting] = useState(false);
    const [selection, setSelection] = useState([]);

    const {
        data: {calculated_metrics: calculatedMetrics},
        isLoading: isLoadingCalculatedMetrics,
    } = useBackendData('calculated-metric/list', {}, {initialData: []});

    return (
        <Container>
            <ConfirmDeleteModal
                open={deleting}
                entries={calculatedMetrics?.filter(({uid}) => selection.indexOf(uid) !== -1)}
                onConfirm={() => {
                    deleteCalculatedMetrics({uids: selection});
                    setSelection([]);
                }}
                close={() => setDeleting(false)}
            />

            <Flex height='100%' flexDirection='column'>
                <ListToolbar selection={selection} onDelete={() => setDeleting(true)} />
                <Box flex={1}>
                    <DataTable
                        columns={[
                            {
                                label: 'Name',
                                key: 'name',
                                link: 'data-manager/metrics:calculated/<uid>',
                            },
                        ]}
                        enableSelection
                        enableColumnToggle={false}
                        isLoading={isLoadingCalculatedMetrics}
                        onSelectionChanged={values => setSelection(values)}
                        rowKey='uid'
                        rows={calculatedMetrics ?? []}
                        selection={selection}
                    />
                </Box>
            </Flex>
        </Container>
    );
}
