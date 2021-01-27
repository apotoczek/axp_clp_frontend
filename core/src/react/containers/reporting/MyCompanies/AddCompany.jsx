import React, {useState, useCallback} from 'react';

import {EditingSection} from 'components/reporting/shared';
import Toolbar, {ToolbarItem} from 'components/basic/Toolbar';
import {Viewport, Page, Content} from 'components/layout';

import Breadcrumbs from 'components/Breadcrumbs';
import {useBackendData, useBackendEndpoint} from 'utils/backendConnect';
import {usePartiallyAppliedCallback} from 'utils/hooks';
import history from 'utils/history';
import {is_set} from 'src/libs/Utils';
import TypeaheadInput from 'components/basic/forms/input/TypeaheadInput';
import FilterableDropdownList from 'components/basic/forms/dropdowns/FilterableDropdownList';
import {Box, Flex} from '@rebass/grid';
import Loader from 'components/basic/Loader';
import {H3, Description} from 'components/basic/text';

import {BASE_PATH, BASE_CRUMB} from './helpers';
import {useClientUsers} from 'containers/reporting/helpers';

export default function AddCompany() {
    const [companyName, setCompanyName] = useState('');
    const [senderUserUid, setSenderUserUid] = useState(null);
    const [recipientUserUid, setRecipientUserUid] = useState(null);
    const [formErrors, setFormErrors] = useState({});

    const {isLoading: isSaving, triggerEndpoint: addCompany} = useBackendEndpoint(
        'reporting/actions/create-internal',
    );

    const {data: companyData} = useBackendData('dataprovider/companies', {results_per_page: 'all'});

    const companies = companyData.results || [];
    const users = useClientUsers();
    const {data: user} = useBackendData('dataprovider/user');

    const setFormState = usePartiallyAppliedCallback((key, value) => {
        if (key === 'companyName') {
            setCompanyName(value);
        } else if (key === 'senderUserUid') {
            setSenderUserUid(value);
        } else if (key === 'recipientUserUid') {
            setRecipientUserUid(value);
        }
    }, []);

    const formState = {
        companyName,
        senderUserUid,
        recipientUserUid,
    };

    const handleSave = useCallback(() => {
        const errors = {};

        if (!companyName.length) {
            errors.companyName = 'Company name is required';
        }

        if (!is_set(senderUserUid)) {
            errors.senderUserUid = 'You have to pick a user';
        }

        if (!is_set(recipientUserUid)) {
            errors.recipientUserUid = 'You have to pick a user';
        }

        setFormErrors(errors);

        if (is_set(errors, true)) {
            return;
        }

        const data = {
            sender_user_uid: senderUserUid,
            recipient_user_uid: recipientUserUid,
        };

        const existingCompany = companies.find(c => c.name === companyName);

        if (existingCompany) {
            data.company_uid = existingCompany.uid;
        } else {
            data.company_name = companyName;
        }

        addCompany(data)
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
    }, [companyName, senderUserUid, recipientUserUid, companies, addCompany]);

    if (recipientUserUid === null && user.uid) {
        setRecipientUserUid(user.uid);
    }

    return (
        <Viewport>
            <Breadcrumbs path={[BASE_CRUMB, 'Add Company']} urls={[BASE_PATH]} />
            <Toolbar flex>
                <ToolbarItem icon='cancel' disabled={isSaving} glyphicon right to={BASE_PATH}>
                    Cancel
                </ToolbarItem>
                <ToolbarItem onClick={handleSave} disabled={isSaving} icon='save' glyphicon right>
                    Save Company
                </ToolbarItem>
            </Toolbar>
            <Page>
                <PageContent
                    isSaving={isSaving}
                    formState={formState}
                    setFormState={setFormState}
                    formErrors={formErrors}
                    companies={companies}
                    users={users}
                />
            </Page>
        </Viewport>
    );
}

function PageContent({isSaving, formState, formErrors, setFormState, companies, users}) {
    if (isSaving) {
        return <Loader width={200} text='Adding Company...' />;
    }

    return (
        <Content>
            <EditingSection flex={1 / 3} heading='Add Company' description=''>
                <Box px={1}>
                    <H3>Company and Deal Team Member</H3>
                    <Description>
                        The deal team member will receive all the email communication, and will be
                        responsible for submitting data for the company.
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
                            options={users}
                            value={formState.senderUserUid}
                            valueKey='uid'
                            labelKey='name'
                            subLabelKey='email'
                            leftLabel='Deal Team Member'
                            onValueChanged={setFormState('senderUserUid')}
                            error={formErrors.senderUserUid}
                        />
                    </Box>
                </Flex>
                <Box px={1} mt={3}>
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
                            onValueChanged={setFormState('recipientUserUid')}
                            error={formErrors.recipientUserUid}
                        />
                    </Box>
                </Flex>
            </EditingSection>
        </Content>
    );
}
