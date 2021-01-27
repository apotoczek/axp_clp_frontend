import React, {useCallback, useContext, useEffect} from 'react';
import {useParams, useHistory} from 'react-router-dom';
import {Flex, Box} from '@rebass/grid';
import bison from 'bison';

import {useBackendEndpoint, useBackendData} from 'utils/backendConnect';
import {useFormState} from 'utils/hooks';
import {NotificationContext} from 'contexts';
import {NotificationType} from 'src/libs/Enums';

import {Content} from 'components/layout';
import Toolbar, {ToolbarItem} from 'components/basic/Toolbar';
import {H1, Description} from 'components/basic/text';
import TextInput from 'components/basic/forms/input/TextInput';

import TextField from 'src/libs/react/components/basic/forms/input/TextField';

function ContactForm({title, companyId, formState, formErrors, onValueChanged, onSave}) {
    return (
        <>
            <Content>
                <Toolbar>
                    <ToolbarItem to={`/company-analytics/${companyId}/contacts`} right>
                        Cancel
                    </ToolbarItem>
                    <ToolbarItem icon='save' glyphicon right onClick={onSave}>
                        Save Contact
                    </ToolbarItem>
                </Toolbar>
                <Flex flexDirection='column' p={16}>
                    <Box mb={32}>
                        <H1>{title}</H1>
                        <Description>
                            Contacts store information about the people at a company and how to
                            contact them.
                        </Description>
                    </Box>
                    <Flex flexWrap='wrap'>
                        <Box width={1 / 2} p={2}>
                            <TextInput
                                leftLabel='First Name'
                                value={formState.firstName}
                                onValueChanged={value => onValueChanged('firstName', value)}
                                error={formErrors.firstName}
                            />
                        </Box>
                        <Box width={1 / 2} p={2}>
                            <TextInput
                                leftLabel='Last Name'
                                value={formState.lastName}
                                onValueChanged={value => onValueChanged('lastName', value)}
                                error={formErrors.lastName}
                            />
                        </Box>
                        <Box width={1 / 2} p={2}>
                            <TextInput
                                leftLabel='Email'
                                value={formState.email}
                                onValueChanged={value => onValueChanged('email', value)}
                                error={formErrors.email}
                            />
                        </Box>
                        <Box width={1 / 2} p={2}>
                            <TextInput
                                leftLabel='Phone'
                                value={formState.phone}
                                onValueChanged={value => onValueChanged('phone', value)}
                                error={formErrors.phone}
                            />
                        </Box>
                        <Box width={1 / 2} p={2}>
                            <TextInput
                                leftLabel='Title'
                                placeholder='e.g. CEO'
                                value={formState.title}
                                onValueChanged={value => onValueChanged('title', value)}
                                error={formErrors.title}
                            />
                        </Box>
                        <Box width={1 / 2} p={2}>
                            <TextInput
                                leftLabel='Board Role'
                                placeholder='e.g. Chairman'
                                value={formState.boardRole}
                                onValueChanged={value => onValueChanged('boardRole', value)}
                                error={formErrors.boardRole}
                            />
                        </Box>
                        <Box width={1} p={2}>
                            <TextField
                                autoGrow
                                topLabel='Notes'
                                value={formState.notes}
                                onValueChanged={value => onValueChanged('notes', value)}
                                error={formErrors.notes}
                            />
                        </Box>
                    </Flex>
                </Flex>
            </Content>
        </>
    );
}

function requiredString(value) {
    return value && value.length ? null : 'This field is required';
}

function requiredEmail(value) {
    return value && value.length
        ? bison.helpers.is_valid_email(value)
            ? null
            : 'Invalid email'
        : 'This field is required';
}

export function NewContactForm() {
    const {companyId} = useParams();
    const notifications = useContext(NotificationContext);
    const history = useHistory();

    const {triggerEndpoint: createContact} = useBackendEndpoint('company-contacts/create');

    const [formState, formErrors, setFormState, triggerFormValidation] = useFormState({
        firstName: {initialValue: '', validator: requiredString},
        lastName: {initialValue: '', validator: requiredString},
        email: {initialValue: '', validator: requiredEmail},
        title: {initialValue: '', validator: requiredString},
        phone: {initialValue: ''},
        boardRole: {initialValue: ''},
        notes: {initialValue: ''},
    });

    const onSave = useCallback(() => {
        if (!triggerFormValidation()) {
            return;
        }

        const {firstName, lastName, email, phone, title, boardRole, notes} = formState;

        createContact({
            company_uid: companyId,
            first_name: firstName,
            last_name: lastName,
            email: email,
            phone: phone,
            title: title,
            board_role: boardRole,
            notes: notes,
        })
            .then(() => {
                history.push(`/company-analytics/${companyId}/contacts`);
            })
            .catch(() => {
                notifications.add({
                    type: NotificationType.Error,
                    message: oneLine`
                        Something went wrong while creating your contact.
                        Please try again.
                    `,
                });
            });
    }, [triggerFormValidation, formState, createContact, companyId, history, notifications]);

    return (
        <ContactForm
            title='Create Contact'
            companyId={companyId}
            formState={formState}
            formErrors={formErrors}
            onValueChanged={(key, value) => setFormState(key)(value)}
            onSave={onSave}
        />
    );
}

export function EditContactForm() {
    const {contactId, companyId} = useParams();
    const notifications = useContext(NotificationContext);
    const history = useHistory();

    const [formState, formErrors, setFormState, triggerFormValidation] = useFormState({
        firstName: {initialValue: '', validator: requiredString},
        lastName: {initialValue: '', validator: requiredString},
        email: {initialValue: '', validator: requiredEmail},
        title: {initialValue: '', validator: requiredString},
        phone: {initialValue: ''},
        boardRole: {initialValue: ''},
        notes: {initialValue: ''},
    });

    const {triggerEndpoint: saveContact} = useBackendEndpoint('company-contacts/update');

    const {
        data: {contacts = []},
    } = useBackendData('company-contacts/list', {company_uid: companyId});

    const contact = contacts.find(c => c.uid == contactId) || {person: {}};

    const onSave = useCallback(() => {
        if (!triggerFormValidation()) {
            return;
        }

        const {firstName, lastName, email, phone, title, boardRole, notes} = formState;

        saveContact({
            uid: contactId,
            first_name: firstName,
            last_name: lastName,
            email: email,
            phone: phone,
            title: title,
            board_role: boardRole,
            notes: notes,
        })
            .then(() => {
                history.push(`/company-analytics/${companyId}/contacts`);
            })
            .catch(() => {
                notifications.add({
                    type: NotificationType.Error,
                    message: oneLine`
                        Something went wrong while saving your contact.
                        Please try again.
                    `,
                });
            });
    }, [
        companyId,
        contactId,
        formState,
        history,
        notifications,
        saveContact,
        triggerFormValidation,
    ]);

    // If the data from the backend updates, we set that data as the current state.
    // Note that the backend data only updates if the component id changes.
    useEffect(() => {
        setFormState('firstName')(contact.first_name);
        setFormState('lastName')(contact.last_name);
        setFormState('email')(contact.email);
        setFormState('phone')(contact.phone);
        setFormState('title')(contact.title);
        setFormState('boardRole')(contact.board_role);
        setFormState('notes')(contact.notes);
    }, [contact, setFormState]);

    return (
        <ContactForm
            title='Edit Contact'
            companyId={companyId}
            formState={formState}
            formErrors={formErrors}
            onValueChanged={(key, value) => setFormState(key)(value)}
            onSave={onSave}
        />
    );
}
