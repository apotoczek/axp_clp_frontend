import React from 'react';

import {Box, Flex} from '@rebass/grid';

import TextInput from 'components/basic/forms/input/TextInput';

import FilterableDropdownList from 'components/basic/forms/dropdowns/FilterableDropdownList';
import DropdownList from 'components/basic/forms/dropdowns/DropdownList';
import {RelativeDatePicker, CustomPeriodNotification} from 'components/reporting/shared';

const periodEnd = frequency => {
    switch (parseInt(frequency)) {
        case 3:
            return 'year end';
        case 2:
            return 'quarter end';
        case 1:
            return 'month end';
    }
};

const MandateForm = ({onValueChanged, options, values = {}, errors = {}, company = {}}) => {
    const emailSequenceOptions = [...options.emailSequences];

    emailSequenceOptions.unshift({
        uid: null,
        name: 'None',
    });

    const replyToOptions = [...options.users];

    replyToOptions.unshift({
        uid: null,
        name: 'Default',
    });

    const enableReplyTo = !!values.emailSequenceUid;

    return (
        <Flex flexWrap='wrap'>
            <Box width={1 / 2} p={1}>
                <TextInput
                    leftLabel='Name'
                    value={values.name}
                    onValueChanged={value => onValueChanged('name', value)}
                    placeholder='Enter a name for your recurring request'
                    error={errors.name}
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
                <FilterableDropdownList
                    disabled={!enableReplyTo}
                    label='Reply To'
                    valueKey='uid'
                    labelKey='name'
                    subLabelKey='email'
                    value={enableReplyTo && values.replyToUserUid}
                    options={replyToOptions}
                    onValueChanged={value => onValueChanged('replyToUserUid', value)}
                    error={errors.replyToUserUid}
                />
            </Box>
            <Box width={1 / 2} p={1}>
                <DropdownList
                    label='Frequency'
                    options={options.frequencies}
                    value={values.frequency}
                    onValueChanged={value => onValueChanged('frequency', value)}
                    error={errors.frequency}
                />
            </Box>
            <Box width={1 / 2} p={1}>
                <RelativeDatePicker
                    label='Request Date'
                    timeMarker={periodEnd(values.frequency)}
                    onValueChanged={value => onValueChanged('relativeRequestDate', value)}
                    base={values.relativeRequestDate && values.relativeRequestDate.base}
                    days={values.relativeRequestDate && values.relativeRequestDate.days}
                />
            </Box>
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
            <Box width={1 / 2} p={1}>
                <RelativeDatePicker
                    label='Due Date'
                    timeMarker={periodEnd(values.frequency)}
                    onValueChanged={value => onValueChanged('relativeDueDate', value)}
                    base={values.relativeDueDate && values.relativeDueDate.base}
                    days={values.relativeDueDate && values.relativeDueDate.days}
                />
            </Box>
            {!!(company.non_standard_fiscal_year_end || company.non_standard_fiscal_quarters) && (
                <Box width={1 / 2} p={1} ml='auto'>
                    <CustomPeriodNotification
                        companyName={company.name}
                        fiscalYearEnd={
                            company.non_standard_fiscal_year_end && company.fiscal_year_end
                        }
                        fiscalQuarters={
                            company.non_standard_fiscal_quarters && company.fiscal_quarters
                        }
                    />
                </Box>
            )}
        </Flex>
    );
};

export default MandateForm;
