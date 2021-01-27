import React, {useMemo, useState, useCallback} from 'react';
import styled from 'styled-components';
import {Box, Flex} from '@rebass/grid';

import Button from 'components/basic/forms/Button';
import {ModalHeader} from 'components/reporting/shared';
import Modal, {ModalContent} from 'components/basic/Modal';
import {H1} from 'components/basic/text';
import InfoBox from 'components/InfoBox';
import TextInput from 'components/basic/forms/input/TextInput';
import * as Formatters from 'src/libs/Formatters';
import {useBackendData, useBackendEndpoint} from 'utils/backendConnect';

const Label = styled.div`
    color: ${({theme}) => theme.input.labelFg};
    font-size: 15px;
    text-transform: uppercase;
    font-weight: 500;
`;

const RequiredLabel = styled.div`
    font-style: italic;
    opacity: 0.7;
    font-size: 12px;
`;

const LabeledValueValue = styled.div`
    color: ${({theme}) => theme.calloutValueFg};
    font-size: 16px;
    font-weight: 500;
`;

const RightLink = styled.a`
    float: right;
`;

function LabeledValue({label, value, formatter, ...rest}) {
    return (
        <Box {...rest}>
            <Label>{label}</Label>
            <LabeledValueValue>
                {!value ? '-' : formatter ? formatter(value) : value}
            </LabeledValueValue>
        </Box>
    );
}

function LabeledInput({topLabel, value, onValueChanged, required = false, ...rest}) {
    return (
        <Box {...rest}>
            <Label>{topLabel + (required ? '*' : '')}</Label>
            <TextInput value={value} onValueChanged={onValueChanged} />
            {required && <RequiredLabel>*Required</RequiredLabel>}
        </Box>
    );
}

export default function EditMetricValueModal({
    date,
    isOpen,
    metricSetUid,
    dealUid,
    metricUid,
    companyUid,
    metricVersionUid,
    toggleModal,
}) {
    const [newValue, setNewValue] = useState('');
    const [note, setNote] = useState('');

    const metricSetRequest = useBackendData(
        'dataprovider/metric_set',
        {
            metric_set_uid: metricSetUid,
            deal_uid: dealUid,
            metric_uid: metricUid,
            company_uid: companyUid,
            metric_version_uid: metricVersionUid,
        },
        {
            triggerConditional: params =>
                isOpen &&
                (params.metric_set_uid ||
                    ((params.deal_uid || params.company_uid) &&
                        params.metric_uid &&
                        params.metric_version_uid)),
        },
    );

    const metricSet = metricSetRequest.data;
    const activePair = useMemo(
        () => (metricSet?.pairs ?? []).find(pair => pair.date == date), // Intentional '==' instead of '===', sorry.
        [metricSet, date],
    );

    const {triggerEndpoint: saveEndpoint} = useBackendEndpoint('metric/pairs/update');

    const save = useCallback(
        () =>
            saveEndpoint({
                metric_version_uid: metricVersionUid,
                company_uid: companyUid,
                deal_uid: dealUid,
                metric_uid: metricUid,
                metric_set_uid: metricSetUid,
                value: parseFloat(newValue),
                note: note,
                date,
            }).then(v => {
                toggleModal();
                setNewValue('');
                setNote('');
                return v;
            }),
        [
            saveEndpoint,
            metricSetUid,
            metricVersionUid,
            companyUid,
            dealUid,
            metricUid,
            newValue,
            note,
            date,
            toggleModal,
        ],
    );

    const hasValidSaveState = !isNaN(parseFloat(newValue));

    return (
        <Modal isOpen={isOpen} openStateChanged={toggleModal}>
            <ModalContent flexDirection='column'>
                <ModalHeader>
                    <Flex px={1} mb={2} alignItems='center' justifyContent='space-between'>
                        <H1>Audit Trail - Edit Metric Value</H1>
                    </Flex>
                </ModalHeader>

                <Flex mt={4}>
                    <LabeledValue
                        my={2}
                        mx={2}
                        px={1}
                        label='Current Value'
                        value={activePair?.value}
                        formatter={
                            metricSet?.metric?.format &&
                            Formatters.gen_formatter(
                                {format: metricSet.metric.format, format_args: {abbreviate: false}},
                                false,
                            )
                        }
                    />
                    <LabeledValue
                        my={2}
                        mx={2}
                        px={1}
                        label='As Of Date'
                        value={date}
                        formatter={Formatters.backend_date}
                    />

                    <LabeledInput
                        topLabel='New Value'
                        required
                        my={2}
                        mx={2}
                        flex={1}
                        value={newValue}
                        onValueChanged={setNewValue}
                    />
                    <LabeledInput
                        topLabel='Note'
                        my={2}
                        mx={2}
                        flex={2}
                        flexShrink={1}
                        value={note}
                        onValueChanged={setNote}
                    />
                </Flex>

                <Flex>
                    <Box width={2 / 3}>
                        <InfoBox>
                            <p>- If you would like to change the As Of Date for this value</p>
                            <p>
                                - If you would like to view or update the Version for this value
                                <RightLink
                                    // Hide modal in macrotask to make sure link remains until routed
                                    onClick={() => setTimeout(toggleModal, 1)}
                                    href={`#!/data-manager/metric-sets/${metricSetUid}`}
                                >
                                    View in Data Manager
                                </RightLink>
                            </p>
                            <p>- If you would like to more historical Notes for this value</p>
                        </InfoBox>
                    </Box>
                </Flex>

                <Flex justifyContent='flex-end' mt={2}>
                    <Button flex={0} mx={1} onClick={toggleModal}>
                        Cancel
                    </Button>
                    <Button flex={0} mx={1} primary onClick={save} disabled={!hasValidSaveState}>
                        Save
                    </Button>
                </Flex>
            </ModalContent>
        </Modal>
    );
}
