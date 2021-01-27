import React, {useState, useCallback} from 'react';
import {usePartiallyAppliedCallback} from 'utils/hooks';
import {useBackendData, useBackendEndpoint} from 'utils/backendConnect';
import styled from 'styled-components';
import bison from 'bison';

import {H1, H2, H3, Description} from 'components/basic/text';

import Icon from 'components/basic/Icon';
import {Box, Flex} from '@rebass/grid';

import Button from 'components/basic/forms/Button';

import {is_set} from 'src/libs/Utils';

import {ModalHeader} from 'components/reporting/shared';
import Modal, {ModalContent} from 'components/basic/Modal';

import FilterableDropdownList from 'components/basic/forms/dropdowns/FilterableDropdownList';
import TextInput from 'components/basic/forms/input/TextInput';
import Loader from 'components/basic/Loader';

import {useClientUsers} from 'containers/reporting/helpers';
import StatusIndicator from 'components/reporting/StatusIndicator';

const StyledButton = styled(Button)`
    display: inline-block;
    margin-left: 8px;
`;

export default function EditCompanyModal({relationshipUid, isOpen, toggleModal}) {
    return (
        <Modal openStateChanged={toggleModal} isOpen={isOpen}>
            <ModalContent flexDirection='column'>
                <Content relationshipUid={relationshipUid} toggleModal={toggleModal} />
            </ModalContent>
        </Modal>
    );
}

function Content({relationshipUid, toggleModal}) {
    const [formState, setFormState] = useState(null);
    const [formErrors, setFormErrors] = useState({});
    const [emailStatus, setEmailStatus] = useState(null);

    const {
        triggerEndpoint: updateCompany,
        isLoading: isUpdating,
    } = useBackendEndpoint('reporting/actions/update-internal', {action: true});

    const {
        triggerEndpoint: validateFromEmail,
        isLoading: isValidating,
    } = useBackendEndpoint('reporting/actions/validate-from-email', {action: true});

    const {
        data: companyData,
        isLoading: companiesLoading,
    } = useBackendData('dataprovider/companies', {results_per_page: 'all'});

    const isSaving = isUpdating || isValidating;

    const companies = companyData.results || [];

    const users = useClientUsers();

    const {data, isLoading: dataLoading} = useBackendData(
        'reporting/list-relationships',
        {internal: true, relationship_uid: relationshipUid},
        {requiredParams: ['relationship_uid']},
    );

    const relationship = data.relationships && data.relationships[0];

    if (relationship && !formState) {
        setFormState({
            fromEmail: relationship.from_email,
            fromEmailName: relationship.from_email_name,
            companyUid: relationship.company_uid,
            senderUserUid: relationship.sender_user_uid,
            recipientUserUid: relationship.recipient_user_uid,
        });
    }

    const handleChange = usePartiallyAppliedCallback(
        (key, value) => {
            const newState = {
                ...formState,
                [key]: value,
            };

            setFormState(newState);
        },
        [formState],
    );

    const handleCancel = useCallback(() => toggleModal(), [toggleModal]);

    const handleFromEmail = useCallback(
        (email, callback) => {
            if (!is_set(email, true)) {
                callback(null);
                return;
            }

            if (!bison.helpers.is_valid_email(email)) {
                setFormErrors({fromEmail: 'Invalid email'});
                setEmailStatus(null);
                return;
            }

            validateFromEmail({email}).then(({verified, spf, dkim}) => {
                if (verified && spf && dkim) {
                    callback(email);
                } else {
                    setFormErrors({
                        fromEmail: 'Domain not configured',
                    });
                    setEmailStatus({
                        verified,
                        spf,
                        dkim,
                    });
                }
            });
        },
        [validateFromEmail],
    );

    const handleSave = useCallback(() => {
        const {fromEmail, fromEmailName, companyUid, senderUserUid, recipientUserUid} = formState;

        handleFromEmail(fromEmail, validatedFromEmail => {
            updateCompany({
                relationship_uid: relationshipUid,
                from_email: validatedFromEmail,
                from_email_name: fromEmailName,
                company_uid: companyUid,
                sender_user_uid: senderUserUid,
                recipient_user_uid: recipientUserUid,
            })
                .then(() => {
                    toggleModal();
                })
                .catch(error => {
                    switch (error.message) {
                        case 'relationship_exists':
                            setFormErrors({
                                companyUid: 'A relationship already exists for this company',
                            });
                            break;
                        case 'company_contact_exists':
                            setFormErrors({email: 'A contact with this email already exists'});
                            break;
                    }
                });
        });
    }, [formState, handleFromEmail, updateCompany, relationshipUid, toggleModal]);

    if (!relationship || dataLoading || companiesLoading) {
        return <Loader />;
    }

    return (
        <>
            <ModalHeader width={1} pb={2} mb={3}>
                <Box width={2 / 3}>
                    <H1>Edit Company</H1>
                    <H2>{relationship.company_name}</H2>
                </Box>
            </ModalHeader>
            <Box p={1}>
                <Box mb={3}>
                    <Box px={1}>
                        <H3>Company and Deal Team Member</H3>
                        <Description>
                            The deal team member will receive all the email communication, and will
                            be responsible for submitting data for the company.
                        </Description>
                    </Box>
                    <Flex width={1}>
                        <Box my={2} width={1 / 2} p={1}>
                            <FilterableDropdownList
                                options={companies}
                                value={formState.companyUid}
                                valueKey='uid'
                                labelKey='name'
                                leftLabel='Company'
                                onValueChanged={handleChange('companyUid')}
                            />
                        </Box>
                        <Box my={2} width={1 / 2} p={1}>
                            <FilterableDropdownList
                                options={users}
                                value={formState.senderUserUid}
                                valueKey='uid'
                                labelKey='name'
                                subLabelKey='email'
                                leftLabel='Deal Team Member'
                                onValueChanged={handleChange('senderUserUid')}
                                error={formErrors.senderUserUid}
                            />
                        </Box>
                    </Flex>
                    <Box mt={3} px={1}>
                        <H3>Your contact person</H3>
                        <Description>
                            Your point of contact for the company. The selected user&apos;s contact
                            information will be displayed to the deal team.
                        </Description>
                    </Box>
                    <Flex width={1}>
                        <Box my={2} width={1 / 2} p={1}>
                            <FilterableDropdownList
                                options={users}
                                value={formState.recipientUserUid}
                                valueKey='uid'
                                labelKey='name'
                                subLabelKey='email'
                                leftLabel='Contact Person'
                                onValueChanged={handleChange('recipientUserUid')}
                                error={formErrors.recipientUserUid}
                            />
                        </Box>
                    </Flex>
                    <Box mt={3} mx={1}>
                        <H3>From Address</H3>
                        <Description>
                            Configure the email address and name to use for all outgoing email sent
                            to the users of this company.
                        </Description>
                    </Box>
                    <Flex width={1}>
                        <Box my={2} width={1 / 2} p={1}>
                            <TextInput
                                leftLabel='From Email'
                                placeholder='Default'
                                value={formState.fromEmail}
                                onValueChanged={handleChange('fromEmail')}
                                error={formErrors.fromEmail}
                            />
                            {emailStatus && (
                                <Flex alignItems='center' justifyContent='center'>
                                    <StatusIndicator
                                        label='Domain Verified'
                                        status={emailStatus.verified}
                                    />
                                    <StatusIndicator label='DKIM' status={emailStatus.dkim} />
                                    <StatusIndicator label='SPF' status={emailStatus.spf} />
                                </Flex>
                            )}
                        </Box>
                        <Box my={2} width={1 / 2} p={1}>
                            <TextInput
                                leftLabel='From Name'
                                placeholder='Default'
                                value={formState.fromEmailName}
                                onValueChanged={handleChange('fromEmailName')}
                            />
                        </Box>
                    </Flex>
                </Box>
                <Flex justifyContent='flex-end'>
                    <StyledButton primary onClick={handleSave} disabled={isSaving}>
                        Save
                        <Icon name='ok' glyphicon right />
                    </StyledButton>
                    <StyledButton onClick={handleCancel} disabled={isSaving}>
                        Cancel
                    </StyledButton>
                </Flex>
            </Box>
        </>
    );
}
