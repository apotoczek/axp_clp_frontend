import React from 'react';
import {Flex} from '@rebass/grid';

import FilterableDropdownList from 'components/basic/forms/dropdowns/FilterableDropdownList';

export default function EntitySettings({provider, onGroupingChanged, onEntityChanged}) {
    const groupingParam = provider.getGroupingParam();
    return (
        <Flex flexDirection='column'>
            <FilterableDropdownList
                mb={1}
                label='Entity'
                manualValue={provider.getVehicleName()}
                error={provider.getVehicleError()}
                options={provider.vehicleOptions()}
                placeholder='E.g. Gross Fund II'
                onValueChanged={entityUid => onEntityChanged(provider.getVehicle(entityUid))}
            />
            <FilterableDropdownList
                mb={1}
                options={groupingParam.options || []}
                value={groupingParam.value}
                label={groupingParam.label}
                placeholder='E.g. Vintage Year'
                onValueChanged={group => onGroupingChanged(group)}
            />
        </Flex>
    );
}
