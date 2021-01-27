import React from 'react';
import styled from 'styled-components';

import {ModalHeader} from 'components/reporting/shared';

import Modal, {ModalContent} from 'components/basic/Modal';
import Button from 'components/basic/forms/Button';
import Input from 'components/basic/forms/input/Input';
import TextField from 'components/basic/forms/input/TextField';
import {Box, Flex} from '@rebass/grid';
import {H1} from 'components/basic/text';
import {backend_date} from 'src/libs/Formatters';
import ConfirmDropdown from 'components/basic/forms/dropdowns/ConfirmDropdown';
import {useBackendData, useBackendEndpoint} from 'utils/backendConnect';
import {usePartiallyAppliedCallback} from 'utils/hooks';
import Loader from 'components/basic/Loader';

const Email = styled(Box)`
    position: relative;
    padding: 0 15px 20px;
    color: #000000;
    border-left: 2px solid #ccd0de;

    &::after {
        width: 12px;
        height: 12px;
        display: block;
        top: 10px;
        position: absolute;
        left: -7px;
        border-radius: 10px;
        content: '';
        border: 2px solid #ccd0de;

        background: ${props => props.dotColor || '#FFFFFF'};
    }

    &:last-child {
        border-image: linear-gradient(to bottom, #ccd0de 60%, rgba(#ccd0de, 0)) 1 100%;
    }
`;

const Header = styled(Flex)`
    height: 32px;
    align-items: center;
`;
const Wrapper = styled(Box)`
    background-color: #f6f8ff;
    padding: 10px;
    border-radius: 3px;
`;

const InlineDate = styled(Box)`
    display: block;
    font-weight: 700;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 1px;
    line-height: 12px;
`;

const StyledTextField = styled(TextField)`
    color: #000000;
    resize: none;
    white-space: pre-wrap;
`;

const Container = styled(Flex)`
    overflow-y: auto;
    flex-direction: column;
    max-height: 100%;
`;

const SmallButton = styled(Button)`
    margin: 0 4px;
    font-size: 10px;
    padding: 0 5px;
    border-radius: 3px;
`;

const dotColor = email =>
    email.processed ? (email.sent_timestamp ? '#3AC376' : '#C33A3A') : '#FFFFFF';

const emailStatus = email => {
    if (email.processed) {
        return email.sent_timestamp ? 'Sent' : 'Condition Not Met On';
    }

    return 'Scheduled for';
};

function Content({requestUid, toggleModal}) {
    const {data, isLoading} = useBackendData(
        'reporting/get-email-schedule',
        {data_request_uid: requestUid},
        {requiredParams: ['data_request_uid']},
    );

    const {triggerEndpoint: sendEmail} = useBackendEndpoint(
        'reporting/actions/send-scheduled-email',
    );

    const handleSendEmail = usePartiallyAppliedCallback(uid => sendEmail({uid}).then(() => {}), [
        sendEmail,
    ]);

    if (!data || isLoading) {
        return (
            <ModalContent>
                <Loader />
            </ModalContent>
        );
    }

    const schedule = data.schedule || [];

    return (
        <>
            <ModalHeader width={1} pb={2} mb={3}>
                <Box width={2 / 3}>
                    <H1>Email Schedule</H1>
                </Box>
                <Flex width={1 / 3} flexWrap='nowrap' justifyContent='flex-end'>
                    <Box width={1 / 3} m={1}>
                        <Button onClick={toggleModal}>Close</Button>
                    </Box>
                </Flex>
            </ModalHeader>
            <Container>
                <Box mx={3}>
                    {schedule.map(email => (
                        <Email key={email.uid} dotColor={dotColor(email)}>
                            <Header>
                                <InlineDate>
                                    {emailStatus(email)}{' '}
                                    {backend_date(email.sent_timestamp || email.send_date)}
                                </InlineDate>
                                <Box>
                                    {!email.processed && (
                                        <ConfirmDropdown
                                            onConfirm={handleSendEmail(email.uid)}
                                            text='Are you sure you want to send this email now?'
                                            subText='This will reschedule this email only.'
                                        >
                                            <SmallButton>Send Now</SmallButton>
                                        </ConfirmDropdown>
                                    )}
                                </Box>
                            </Header>
                            <Wrapper>
                                <Input small mb={3} leftLabel='Subject' value={email.subject} />
                                <Flex mb={3}>
                                    <Input
                                        small
                                        mr={2}
                                        flex={1}
                                        leftLabel='To'
                                        value={email.recipient_email}
                                    />
                                    <Input
                                        small
                                        flex={1}
                                        leftLabel='Reply To'
                                        value={email.reply_to_email}
                                    />
                                </Flex>
                                <StyledTextField
                                    autoGrow
                                    readOnly
                                    topLabel='Body'
                                    value={email.body}
                                />
                            </Wrapper>
                        </Email>
                    ))}
                </Box>
            </Container>
        </>
    );
}

function ViewEmailScheduleModal({isOpen, toggleModal, requestUid}) {
    return (
        <Modal openStateChanged={toggleModal} isOpen={isOpen}>
            <ModalContent flexDirection='column'>
                <Content toggleModal={toggleModal} requestUid={requestUid} />
            </ModalContent>
        </Modal>
    );
}

export default ViewEmailScheduleModal;
