import React from 'react';
import styled, {css} from 'styled-components';

import {Box, Flex} from '@rebass/grid';

import FilterableDropdownList from 'components/basic/forms/dropdowns/FilterableDropdownList';
import DatePickerDropdown from 'components/basic/forms/dropdowns/DatePickerDropdown';

const ToggledFilterableDropdown = styled(FilterableDropdownList)`
    ${props =>
        props.disabled &&
        css`
            opacity: 0.5;
            pointer-events: none;
        `}
`;

const DataRequestForm = ({onValueChanged, options, values = {}, errors = {}}) => {
    const emailSequenceOptions = [...options.emailSequences];

    emailSequenceOptions.unshift({
        uid: null,
        name: 'None',
    });

    const enableReplyTo = !!values.emailSequenceUid;

    const today = new Date();

    return (
        <Flex flexWrap='wrap'>
            <Box width={1 / 2} p={1}>
                <FilterableDropdownList
                    label='Data Template'
                    valueKey='uid'
                    labelKey='name'
                    value={values.templateUid}
                    options={options.templates}
                    onValueChanged={value => onValueChanged('templateUid', value)}
                    error={errors.templateUid}
                />
            </Box>
            <Box width={1 / 4} p={1}>
                <FilterableDropdownList
                    label='Email Sequence'
                    valueKey='uid'
                    labelKey='name'
                    value={values.emailSequenceUid}
                    options={emailSequenceOptions}
                    onValueChanged={value => onValueChanged('emailSequenceUid', value)}
                    error={errors.emailSequenceUid}
                />
            </Box>
            <Box width={1 / 4} p={1}>
                <ToggledFilterableDropdown
                    disabled={!enableReplyTo}
                    label='Reply To'
                    valueKey='uid'
                    labelKey='name'
                    value={enableReplyTo && values.replyToUserUid}
                    options={options.users}
                    onValueChanged={value => onValueChanged('replyToUserUid', value)}
                    error={errors.replyToUserUid}
                />
            </Box>
            <Box width={1 / 3} p={1}>
                <DatePickerDropdown
                    label='Request Date'
                    value={values.requestDate}
                    onChange={value => onValueChanged('requestDate', value)}
                    error={errors.requestDate}
                    fromMonth={today}
                />
            </Box>
            <Box width={1 / 3} p={1}>
                <DatePickerDropdown
                    label='Due Date'
                    value={values.dueDate}
                    onChange={value => onValueChanged('dueDate', value)}
                    error={errors.dueDate}
                    fromMonth={today}
                />
            </Box>
            <Box width={1 / 3} p={1}>
                <DatePickerDropdown
                    label='As of Date'
                    value={values.asOfDate}
                    onChange={value => onValueChanged('asOfDate', value)}
                    error={errors.asOfDate}
                />
            </Box>
        </Flex>
    );
};

export default DataRequestForm;
