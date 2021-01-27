import React, {useState, useCallback} from 'react';

import {EditingSection} from 'components/reporting/shared';
import Toolbar, {ToolbarItem} from 'components/basic/Toolbar';
import {Viewport, Page, Content} from 'components/layout';

import Breadcrumbs from 'components/Breadcrumbs';
import {useBackendData, useBackendEndpoint} from 'utils/backendConnect';
import {useFormState, usePartiallyAppliedCallback} from 'utils/hooks';
import history from 'utils/history';
import {is_set} from 'src/libs/Utils';
import {stripIndent} from 'common-tags';
import bison from 'bison';
import ContactForm from 'components/reporting/ContactForm';
import TypeaheadInput from 'components/basic/forms/input/TypeaheadInput';
import FilterableDropdownList from 'components/basic/forms/dropdowns/FilterableDropdownList';
import {Box, Flex} from '@rebass/grid';
import Loader from 'components/basic/Loader';
import {H3, Description} from 'components/basic/text';

import {BASE_PATH, BASE_CRUMB, useContacts} from './helpers';

import {useClientUsers} from 'containers/reporting/helpers';

export default function CreatePortal() {
    const [companyName, setCompanyName] = useState('');
    const [companyUid, setCompanyUid] = useState(null);
    const [companyContactUid, setCompanyContactUid] = useState(null);
    const [recipientUserUid, setRecipientUserUid] = useState(null);
    const [formErrors, setFormErrors] = useState({});

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

    const {isLoading: isSaving, triggerEndpoint: savePortal} = useBackendEndpoint(
        'reporting/actions/create-portal',
    );

    const {data: companyData} = useBackendData('dataprovider/companies', {results_per_page: 'all'});

    const companies = companyData.results || [];
    const contacts = useContacts(companyUid);
    const users = useClientUsers();
    const {data: user} = useBackendData('dataprovider/user');

    const setFormState = usePartiallyAppliedCallback(
        (key, value) => {
            if (key === 'companyName') {
                const existingCompany = companies.find(c => c.name === value);
                setCompanyUid(existingCompany && existingCompany.uid);
                setCompanyName(value);
                setCompanyContactUid(null);
            } else if (key === 'companyContactUid') {
                setCompanyContactUid(value);
            } else if (key === 'recipientUserUid') {
                setRecipientUserUid(value);
            }
        },
        [companies],
    );

    const formState = {
        companyName,
        companyContactUid,
        recipientUserUid,
    };

    const handleSave = useCallback(() => {
        if (!companyName.length) {
            setFormErrors({companyName: 'Company name is required'});
            return;
        }

        if (is_set(companyContactUid)) {
            if (!contacts.find(c => c.uid === companyContactUid)) {
                setFormErrors({companyContactUid: 'Please select a valid company contact'});
                return;
            }
        } else {
            if (!triggerContactValidation()) {
                setFormErrors({});
                return;
            }
        }

        const data = {
            new_contact: {
                email: contactState.email,
                first_name: contactState.firstName,
                last_name: contactState.lastName,
            },
            recipient_user_uid: recipientUserUid,
        };

        const existingCompany = companies.find(c => c.name === companyName);

        if (existingCompany) {
            data.company_uid = existingCompany.uid;
        } else {
            data.company_name = companyName;
        }

        savePortal(data)
            .then(() => {
                history.push(BASE_PATH);
            })
            .catch(error => {
                switch (error.message) {
                    case 'relationship_exists':
                        setFormErrors({
                            companyName: 'A relationship already exists for this company',
                        });
                        break;
                    case 'company_contact_exists':
                        setFormErrors({email: 'A contact with this email already exists'});
                        break;
                }
            });
    }, [
        companies,
        companyContactUid,
        companyName,
        contactState.email,
        contactState.firstName,
        contactState.lastName,
        contacts,
        recipientUserUid,
        savePortal,
        triggerContactValidation,
    ]);

    if (recipientUserUid === null && user.uid) {
        setRecipientUserUid(user.uid);
    }

    return (
        <Viewport>
            <Breadcrumbs path={[BASE_CRUMB, 'Create New Portal']} urls={[BASE_PATH]} />
            <Toolbar flex>
                <ToolbarItem icon='cancel' disabled={isSaving} glyphicon right to={BASE_PATH}>
                    Cancel
                </ToolbarItem>
                <ToolbarItem onClick={handleSave} disabled={isSaving} icon='save' glyphicon right>
                    Save Portal
                </ToolbarItem>
            </Toolbar>
            <Page>
                <PageContent
                    isSaving={isSaving}
                    formState={formState}
                    setFormState={setFormState}
                    formErrors={formErrors}
                    contactState={contactState}
                    contactErrors={contactErrors}
                    setContactState={setContactState}
                    companies={companies}
                    contacts={contacts}
                    users={users}
                />
            </Page>
        </Viewport>
    );
}

function PageContent({
    isSaving,
    formState,
    formErrors,
    setFormState,
    contactState,
    contactErrors,
    setContactState,
    companies,
    contacts,
    users,
}) {
    if (isSaving) {
        return <Loader width={200} text='Creating Portal...' />;
    }

    return (
        <Content>
            <EditingSection
                flex={1 / 3}
                heading='Create Portal'
                description={stripIndent`
                A portal is a secure data warehouse that links a company
                to your portfolio manager account. Your portfolio companies
                will receive data requests and submit their operating metrics
                to fulfill data requests.

                Each portal is a secure and
                distinct data warehouse where recipients can store operating
                metrics, run analysis and build dashboards similar to how
                you use Cobalt Portfolio Manager.
            `}
            >
                <Box px={1}>
                    <H3>Company and Primary Contact</H3>
                    <Description>
                        The primary contact will receive all the email communication for this
                        portal, and will be responsible for submitting data for the portal.
                    </Description>
                </Box>
                <Flex flexWrap='wrap' my={2}>
                    <Box width={1 / 2} p={1}>
                        <TypeaheadInput
                            leftLabel='Company Name'
                            value={formState.companyName}
                            labelKey='name'
                            onValueChanged={setFormState('companyName')}
                            placeholder='Enter the name of the company you want data from'
                            error={formErrors.companyName}
                            options={companies}
                        />
                    </Box>
                    <Box width={1 / 2} p={1}>
                        <FilterableDropdownList
                            options={contacts}
                            value={formState.companyContactUid}
                            valueKey='uid'
                            labelKey='name'
                            subLabelKey='email'
                            leftLabel='Primary Contact'
                            onValueChanged={setFormState('companyContactUid')}
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
                <Box px={1} mt={3}>
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
                            leftLabel='Contact Person'
                            onValueChanged={setFormState('recipientUserUid')}
                            error={formErrors.recipientUserUid}
                        />
                    </Box>
                </Flex>
            </EditingSection>
        </Content>
    );
}
