import React from 'react';

import {H3} from 'components/basic/text';
import {Flex, Box} from '@rebass/grid';

import TypeaheadInput from 'components/basic/forms/input/TypeaheadInput';
import TextInput from 'components/basic/forms/input/TextInput';
import DropdownList from 'components/basic/forms/dropdowns/DropdownList';
import {TextDataSpecType} from 'src/libs/Enums';

const getLabel = (value, options) => {
    const option = options.find(o => o.value === value);

    return option && option.label;
};

const TextDataSpecForm = ({onValueChanged, options = {}, values = {}, errors = {}}) => {
    return (
        <Flex flexWrap='wrap'>
            <Flex width={1} mt={3}>
                <Box width={1 / 2} p={1}>
                    <H3>Group Name</H3>
                    <TypeaheadInput
                        value={values.groupName}
                        onValueChanged={value => onValueChanged('groupName', value)}
                        placeholder='Enter group name for the field'
                        error={errors.groupName}
                        debounceValueChange={false}
                        options={options.groups}
                    />
                </Box>
                <Box width={1 / 2} p={1}>
                    <H3>Field Type</H3>
                    <DropdownList
                        manualValue={getLabel(values.specType, options.specTypes)}
                        options={options.specTypes}
                        onValueChanged={value => onValueChanged('specType', value)}
                        error={errors.specType}
                    />
                </Box>
            </Flex>
            {values.specType === TextDataSpecType.FreeText && (
                <Box width={1} p={1} mt={3}>
                    <H3>Label</H3>
                    <TextInput
                        placeholder='Enter a label for the field'
                        value={values.label}
                        onValueChanged={value => onValueChanged('label', value)}
                        error={errors.label}
                    />
                </Box>
            )}
            {values.specType === TextDataSpecType.Attribute && (
                <Box width={1} p={1} mt={3}>
                    <H3>Attribute</H3>
                    <DropdownList
                        placeholder='Select attribute to populate the field'
                        manualValue={getLabel(values.attributeUid, options.attributes)}
                        options={options.attributes}
                        onValueChanged={value => onValueChanged('attributeUid', value)}
                        error={errors.attributeUid}
                    />
                </Box>
            )}
        </Flex>
    );
};

export default TextDataSpecForm;
