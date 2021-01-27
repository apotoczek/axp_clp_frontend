import React from 'react';

import {Box, Flex} from '@rebass/grid';

import TextInput from 'components/basic/forms/input/TextInput';

export default function ContactForm({state, errors, setState}) {
    return (
        <Flex width={1}>
            <Box width={1 / 3} p={1}>
                <TextInput
                    leftLabel='First Name'
                    value={state.firstName}
                    onValueChanged={setState('firstName')}
                    placeholder='Enter the first name of the contact'
                    error={errors.firstName}
                />
            </Box>
            <Box width={1 / 3} p={1}>
                <TextInput
                    leftLabel='Last Name'
                    value={state.lastName}
                    onValueChanged={setState('lastName')}
                    placeholder='Enter the last name of the contact'
                    error={errors.lastName}
                />
            </Box>
            <Box width={1 / 3} p={1}>
                <TextInput
                    leftLabel='Email Address'
                    value={state.email}
                    onValueChanged={setState('email')}
                    placeholder='Enter the email address of the contact'
                    error={errors.email}
                />
            </Box>
        </Flex>
    );
}
