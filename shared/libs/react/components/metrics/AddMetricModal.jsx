import React, {useState, useCallback, useEffect} from 'react';

import {useBackendData, useBackendEndpoint} from 'utils/backendConnect';
import {is_set} from 'src/libs/Utils';

import {H1} from 'components/basic/text';
import {Flex, Box} from '@rebass/grid';
import Button from 'components/basic/forms/Button';

import {ModalHeader} from 'components/reporting/shared';
import Modal, {ModalContent} from 'components/basic/Modal';
import FilterableDropdownList from 'components/basic/forms/dropdowns/FilterableDropdownList';
import MetricTable from 'src/libs/react/components/basic/MetricTable';
import {TimeFrame} from 'src/libs/Enums';
import TextInput from 'components/basic/forms/input/TextInput';
import DatePickerDropdown from 'components/basic/forms/dropdowns/DatePickerDropdown';

function AddMetricModal({isOpen, toggleModal, companyUid, initialVersionUid, initialMetricUid}) {
    const [selectedMetricUid, setSelectedMetricUid] = useState(initialVersionUid);
    const [selectedVersionUid, setSelectedVersionUid] = useState(initialMetricUid);
    const [value, setValue] = useState('');
    const [date, setDate] = useState(new Date());
    const [note, setNote] = useState('');

    // Reset state when we close/open the modal or change companies
    useEffect(() => {
        setSelectedMetricUid(initialMetricUid);
        setSelectedVersionUid(initialVersionUid);
        setDate(new Date());
        setValue('');
        setNote('');
    }, [isOpen, companyUid, initialVersionUid, initialMetricUid]);

    const {data: metricsData} = useBackendData('dataprovider/metrics_for_user', {
        include_all: true,
    });
    const {data: metricVersionData} = useBackendData('dataprovider/metric_versions_for_client');

    const selectedMetric = metricsData.results?.find(v => v.uid === selectedMetricUid);
    const selectedVersion = metricVersionData.results?.find(v => v.uid === selectedVersionUid);

    const validSaveState = [
        selectedMetric,
        selectedVersion,
        value.trim(),
        date,
        selectedVersion,
    ].every(v => is_set(v));

    const {triggerEndpoint: saveMetricPair} = useBackendEndpoint('metric/pairs/create_on_company');

    const save = useCallback(
        () =>
            saveMetricPair({
                company_uid: companyUid,
                metric_uid: selectedMetric.uid,
                metric_version_uid: selectedVersion.uid,
                value,
                date: new Date(date).getTime() / 1000,
                note,
            }).then(() => toggleModal()),
        [
            saveMetricPair,
            companyUid,
            selectedMetric,
            selectedVersion,
            value,
            date,
            note,
            toggleModal,
        ],
    );

    return (
        <Modal openStateChanged={toggleModal} isOpen={isOpen}>
            <ModalContent flexDirection='column'>
                <ModalHeader width={1} pt={2} pl={2}>
                    <H1>Select Metrics</H1>
                </ModalHeader>
                <Flex mt={3}>
                    <Box flex={1} mx={2}>
                        <FilterableDropdownList
                            label='Metric'
                            onValueChanged={setSelectedMetricUid}
                            options={metricsData.results?.map(({name, uid}) => ({
                                label: name,
                                value: uid,
                            }))}
                            value={selectedMetric?.uid}
                        />
                    </Box>
                    <Box flex={1} mx={2}>
                        <FilterableDropdownList
                            label='Version'
                            onValueChanged={setSelectedVersionUid}
                            options={metricVersionData.results?.map(({name, uid}) => ({
                                label: name,
                                value: uid,
                            }))}
                            value={selectedVersion?.uid}
                        />
                    </Box>
                    <Box flex={2} mx={15} pt='4px'>
                        <MetricTable
                            rows={[
                                {
                                    label: 'Format',
                                    value: selectedMetric?.format_label ?? 'N/A',
                                    key: 'format',
                                },
                                {
                                    label: 'Value Type',
                                    value:
                                        selectedMetric?.time_frame !== undefined
                                            ? selectedMetric.time_frame === TimeFrame.PointInTime
                                                ? 'Point In Time'
                                                : 'Period'
                                            : 'N/A',
                                    key: 'type',
                                },
                            ]}
                            numColumns={2}
                        />
                    </Box>
                </Flex>
                <Flex mt={3}>
                    <TextInput
                        flex={1}
                        my={2}
                        mx={2}
                        leftLabel='New Value'
                        value={value}
                        onValueChanged={setValue}
                    />
                    <Box flex={1} my={2} mx={2}>
                        <DatePickerDropdown label='As Of Date' value={date} onChange={setDate} />
                    </Box>
                    <TextInput
                        flex={2}
                        my={2}
                        mx={2}
                        leftLabel='Note'
                        value={note}
                        onValueChanged={setNote}
                    />
                </Flex>
                <Flex mt={3} justifyContent='flex-end'>
                    <Button flex='0 1 auto' mr={1} onClick={toggleModal}>
                        Cancel
                    </Button>
                    <Button flex='0 1 auto' disabled={!validSaveState} primary onClick={save}>
                        Save
                    </Button>
                </Flex>
            </ModalContent>
        </Modal>
    );
}

export default AddMetricModal;
