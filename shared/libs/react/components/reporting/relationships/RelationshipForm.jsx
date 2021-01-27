import React from 'react';
import {Box, Flex} from '@rebass/grid';

import TextInput from 'components/basic/forms/input/TextInput';
import TypeaheadInput from 'components/basic/forms/input/TypeaheadInput';

import FilterableDropdownList from 'components/basic/forms/dropdowns/FilterableDropdownList';

import {Heading} from 'components/reporting/shared';

const InternalUserForm = ({onValueChanged, users, values, errors}) => {
    const selectedUser = users.find(c => c.uid === values.userUid) || {};

    return (
        <Box>
            <Heading label='Deal Team Contact'>
                This person will be responsible for uploading and maintaining data for the company.
            </Heading>
            <Flex flexWrap='wrap'>
                <Box width={1 / 2} p={1}>
                    <FilterableDropdownList
                        options={users}
                        manualValue={selectedUser.label}
                        leftLabel='User'
                        onValueChanged={value => onValueChanged('userUid', value)}
                        error={errors.userUid}
                    />
                </Box>
            </Flex>
        </Box>
    );
};

const UserForm = ({onValueChanged, values, errors}) => (
    <Box>
        <Heading label='Primary Contact at the Company'>
            This person will be the main point of contact, and will recieve all emails related to
            this Portal.
        </Heading>
        <Flex flexWrap='wrap'>
            <Box width={1 / 3} p={1}>
                <TextInput
                    leftLabel='First Name'
                    value={values.contactFirstName}
                    onValueChanged={value => onValueChanged('contactFirstName', value)}
                    placeholder='Enter the first name of the primary contact at the company'
                    error={errors.contactFirstName}
                />
            </Box>
            <Box width={1 / 3} p={1}>
                <TextInput
                    leftLabel='Last Name'
                    value={values.contactLastName}
                    onValueChanged={value => onValueChanged('contactLastName', value)}
                    placeholder='Enter the last name of the primary contact at the company'
                    error={errors.contactLastName}
                />
            </Box>
            <Box width={1 / 3} p={1}>
                <TextInput
                    leftLabel='Email Address'
                    value={values.contactEmail}
                    onValueChanged={value => onValueChanged('contactEmail', value)}
                    placeholder='Enter the email address of the primary contact at the company'
                    error={errors.contactEmail}
                />
            </Box>
        </Flex>
    </Box>
);
const RelationshipForm = ({
    onValueChanged,
    companyOptions = [],
    userOptions = [],
    values = {},
    errors = {},
    internal = false,
}) => {
    return (
        <Box>
            <Flex flexWrap='wrap'>
                <Box width={1 / 2} p={1}>
                    <TypeaheadInput
                        leftLabel='Company Name'
                        value={values.companyName}
                        onValueChanged={value => onValueChanged('companyName', value)}
                        placeholder='Enter the name of the company you want data from'
                        error={errors.companyName}
                        debounceValueChange={false}
                        options={companyOptions}
                    />
                </Box>
            </Flex>
            {internal ? (
                <InternalUserForm
                    onValueChanged={onValueChanged}
                    values={values}
                    errors={errors}
                    users={userOptions}
                />
            ) : (
                <UserForm onValueChanged={onValueChanged} values={values} errors={errors} />
            )}
        </Box>
    );
};

export default RelationshipForm;
