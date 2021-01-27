import React, {useState, useCallback} from 'react';
import {usePartiallyAppliedCallback, useFormState} from 'utils/hooks';
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
import ContactForm from 'components/reporting/ContactForm';

import StatusIndicator from 'components/reporting/StatusIndicator';
import {useContacts} from './helpers';
import {useClientUsers} from 'containers/reporting/helpers';

const StyledButton = styled(Button)`
    display: inline-block;
    margin-left: 8px;
`;

export default function EditRelationshipModal({relationshipUid, isOpen, toggleModal}) {
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

    const [contactState, contactErrors, setContactState, triggerContactValidation] = useFormState({
        firstName: {
            initialValue: '',
            validator: value => (value.length ? null : 'First name is required'),
        },
        lastName: {
            initialValue: '',
            validator: value => (value.length ? null : 'Last name is required'),
        },
        email: {
            initialValue: '',
            validator: value =>
                value.length
                    ? bison.helpers.is_valid_email(value)
                        ? null
                        : 'Invalid email'
                    : 'Email is required',
        },
    });

    const companyUid = formState && formState.companyUid;

    const {
        triggerEndpoint: updatePortal,
        isLoading: isUpdating,
    } = useBackendEndpoint('reporting/actions/update-portal', {action: true});

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

    const contacts = useContacts(companyUid);
    const users = useClientUsers();

    const {data, isLoading: dataLoading} = useBackendData(
        'reporting/list-relationships',
        {relationship_uid: relationshipUid},
        {requiredParams: ['relationship_uid']},
    );

    const relationship = data.relationships && data.relationships[0];

    if (relationship && !formState) {
        setFormState({
            fromEmail: relationship.from_email,
            fromEmailName: relationship.from_email_name,
            companyUid: relationship.company_uid,
            companyContactUid: relationship.company_contact_uid,
            recipientUserUid: relationship.recipient_user_uid,
        });
    }

    const handleChange = usePartiallyAppliedCallback(
        (key, value) => {
            const newState = {
                ...formState,
                [key]: value,
            };

            if (key === 'companyUid' && value !== formState.companyUid) {
                newState.companyContactUid = null;
            }

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
        const {
            fromEmail,
            fromEmailName,
            companyUid,
            companyContactUid,
            recipientUserUid,
        } = formState;

        if (is_set(companyContactUid)) {
            if (!contacts.find(c => c.uid === companyContactUid)) {
                setFormErrors({companyContactUid: 'Please select a valid company contact'});
                return;
            }
        } else {
            if (!triggerContactValidation()) {
                return;
            }
        }

        handleFromEmail(fromEmail, validatedFromEmail => {
            const new_contact = companyContactUid
                ? null
                : {
                      first_name: contactState.firstName,
                      last_name: contactState.lastName,
                      email: contactState.email,
                  };

            updatePortal({
                relationship_uid: relationshipUid,
                from_email: validatedFromEmail,
                from_email_name: fromEmailName,
                company_uid: companyUid,
                company_contact_uid: companyContactUid,
                recipient_user_uid: recipientUserUid,
                new_contact,
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
    }, [
        formState,
        handleFromEmail,
        contacts,
        triggerContactValidation,
        contactState.firstName,
        contactState.lastName,
        contactState.email,
        updatePortal,
        relationshipUid,
        toggleModal,
    ]);

    if (!relationship || dataLoading || companiesLoading) {
        return <Loader />;
    }

    return (
        <>
            <ModalHeader width={1} pb={2} mb={3}>
                <Box width={2 / 3}>
                    <H1>Edit Portal</H1>
                    <H2>{relationship.company_name}</H2>
                </Box>
            </ModalHeader>
            <Box p={1}>
                <Box mb={3}>
                    <Box px={1}>
                        <H3>Company and Primary Contact</H3>
                        <Description>
                            The primary contact will receive all the email communication for this
                            portal, and will be responsible for submitting data for the portal.
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
                                options={contacts}
                                value={formState.companyContactUid}
                                valueKey='uid'
                                labelKey='name'
                                subLabelKey='email'
                                leftLabel='Primary Contact'
                                onValueChanged={handleChange('companyContactUid')}
                                error={formErrors.companyContactUid}
                            />
                        </Box>
                    </Flex>
                    {formState.companyContactUid === null && (
                        <ContactForm
                            state={contactState}
                            errors={{...contactErrors, ...formErrors}}
                            setState={setContactState}
                        />
                    )}
                    <Box mt={3} px={1}>
                        <H3>Your contact person</H3>
                        <Description>
                            Your point of contact for the portal. The selected user&apos;s contact
                            information will be displayed to the company.
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
                                leftLabel='Contact person'
                                onValueChanged={handleChange('recipientUserUid')}
                                error={formErrors.recipientUserUid}
                            />
                        </Box>
                    </Flex>
                    <Box mt={3} mx={1}>
                        <H3>From Address</H3>
                        <Description>
                            Configure the email address and name to use for all outgoing email sent
                            to the users of this portal.
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
