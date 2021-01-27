import React from 'react';

import {Flex, Box} from '@rebass/grid';
import TextInput from 'components/basic/forms/input/TextInput';
import FilterableDropdownList from 'components/basic/forms/dropdowns/FilterableDropdownList';
import DatePickerDropdown from 'components/basic/forms/dropdowns/DatePickerDropdown';

import MultiLevelSelector from 'src/libs/react/components/MultiLevelSelector';
import {DropdownInput} from 'components/basic/forms/dropdowns/base';

import {EntityMetaScope} from 'src/libs/Enums';

const DealForm = ({
    onValueChanged,
    onAttrChanged,
    options,
    attributes,
    values = {},
    errors = {},
}) => {
    const {funds} = options;

    const attributeValues = values.attributes || {};

    const defaultAttributes = Object.values(attributes).filter(
        ({uid, scope}) => uid in attributeValues || scope === EntityMetaScope.Deal,
    );

    return (
        <Flex flexWrap='wrap'>
            <Box width={1} p={1}>
                <FilterableDropdownList
                    label='Fund'
                    manualValue={funds[values.user_fund_uid]}
                    options={Object.entries(funds).map(([value, label]) => ({value, label}))}
                    onValueChanged={value => onValueChanged('user_fund_uid', value)}
                    error={errors.user_fund_uid}
                />
            </Box>
            <Box width={1 / 2} p={1}>
                <DatePickerDropdown
                    label='Acquisition Date'
                    value={values.acquisition_date}
                    onChange={value => onValueChanged('acquisition_date', value)}
                    error={errors.acquisition_date}
                />
            </Box>
            <Box width={1 / 2} p={1}>
                <DatePickerDropdown
                    label='Exit Date'
                    value={values.exit_date}
                    onChange={value => onValueChanged('exit_date', value)}
                    error={errors.exit_date}
                />
            </Box>
            <Box width={1 / 2} p={1}>
                <TextInput
                    leftLabel='Deal Team Leader'
                    value={values.deal_team_leader}
                    onChange={value => onValueChanged('deal_team_leader', value.target.value)}
                    error={errors.deal_team_leader}
                />
            </Box>
            <Box width={1 / 2} p={1}>
                <TextInput
                    leftLabel='Deal Team Second'
                    value={values.deal_team_second}
                    onChange={value => onValueChanged('deal_team_second', value.target.value)}
                    error={errors.deal_team_second}
                />
            </Box>
            {defaultAttributes.map(attribute => {
                return (
                    <Box width={[1 / 2, null, null, null, 1 / 3]} key={attribute.uid} p={1}>
                        <MultiLevelSelector
                            members={attribute.members}
                            selectedItem={
                                (
                                    attribute.members.find(
                                        a => a.uid == attributeValues[attribute.uid],
                                    ) || {}
                                ).uid
                            }
                            onSelect={value => onAttrChanged(attribute.uid, value)}
                        >
                            {selectedValue => (
                                <DropdownInput leftLabel={attribute.name} value={selectedValue} />
                            )}
                        </MultiLevelSelector>
                    </Box>
                );
            })}
        </Flex>
    );
};

export default DealForm;
