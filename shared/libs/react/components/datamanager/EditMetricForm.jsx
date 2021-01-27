import React from 'react';

import {H2, H3, Description} from 'components/basic/text';
import {Flex, Box} from '@rebass/grid';
import DropdownList from 'components/basic/forms/dropdowns/DropdownList';

const getLabel = (value, options) => {
    const option = options.find(o => o.value === value);

    return option && option.label;
};

export const EditMetricForm = ({onValueChanged, options = {}, values = {}}) => {
    return (
        <Flex flexWrap='wrap'>
            <Box width={1} p={1}>
                <H2>{values.name}</H2>
                <Description>
                    Changing format or value type will also change other reporting periods
                    configured for {values.name}
                </Description>
            </Box>
            <Flex width={1} mt={3}>
                <Box width={1 / 3} p={1}>
                    <H3>Format</H3>
                    <DropdownList
                        manualValue={getLabel(values.format, options.formats)}
                        options={options.formats}
                        onValueChanged={value => onValueChanged('format', value)}
                    />
                </Box>
                <Box width={1 / 3} p={1}>
                    <H3>Value Type</H3>
                    <DropdownList
                        manualValue={getLabel(values.valueType, options.valueTypes)}
                        options={options.valueTypes}
                        onValueChanged={value => onValueChanged('valueType', value)}
                    />
                </Box>
                <Box width={1 / 3} p={1}>
                    <H3>Reporting Period</H3>
                    <DropdownList
                        manualValue={getLabel(values.reportingPeriod, options.reportingPeriods)}
                        options={options.reportingPeriods.filter(
                            p => p.valueType === values.valueType,
                        )}
                        onValueChanged={value => onValueChanged('reportingPeriod', value)}
                    />
                </Box>
            </Flex>
        </Flex>
    );
};

export default EditMetricForm;
