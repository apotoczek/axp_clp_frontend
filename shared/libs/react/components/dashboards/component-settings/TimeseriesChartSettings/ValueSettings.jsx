import React, {useState, useCallback} from 'react';
import styled from 'styled-components';
import {Flex} from '@rebass/grid';
import uuid from 'uuid/v4';

import {object_from_array} from 'src/libs/Utils';
import {usePartiallyAppliedCallback} from 'utils/hooks';

import {Bold, Italic} from 'components/basic/text';
import Button from 'components/basic/forms/Button';
import Checkbox from 'components/basic/forms/Checkbox';
import Collapsible from 'components/dashboards/component-settings/Collapsible';
import ColorPickerDropdown from 'components/basic/forms/dropdowns/ColorPickerDropdown';
import DropdownList from 'components/basic/forms/dropdowns/DropdownList';
import FilterableDropdownList from 'components/basic/forms/dropdowns/FilterableDropdownList';
import Icon from 'components/basic/Icon';
import InfoTextDropdown from 'components/basic/forms/dropdowns/InfoTextDropdown';
import TextInput from 'components/basic/forms/input/TextInput';

import Parameters from 'components/dashboards/component-settings/Parameters';

const DERIVED_VALUE_LABEL_DESCRIPTION = [
    {
        title: 'Value Name',
        description: oneLine`
            {{valueName}} gets replaced with the name of the value that the data point
            comes from.
        `,
    },
    {
        title: 'Entity Name',
        description: oneLine`
            {{entityName}} gets replaced with the name of the entity that the data point
            comes from.
        `,
    },
    {
        title: 'Group Name',
        description: oneLine`
            {{groupName}} gets replaced with the name of the group that the data point
            comes from.
        `,
        italic: ' Only works if the value that the data point comes from is grouped.',
    },
];

export default function ValueSettings({
    provider,
    onAddValue,
    onValueRemoved,
    onValueDuplicated,
    onValueOrderChanged,
    onParameterChanged,
    onLabelChanged,
    onDisplayTypeChanged,
    onColorChanged,
    onEntityChanged,
    onValueKeyChanged,
    onValueStackedChanged,
}) {
    const values = provider.values();
    const initialCollapsibleState = object_from_array(values, value => [value.valueId, false]);
    const [openCollapsibles, setOpenCollapsibles] = useState(initialCollapsibleState);

    const toggleCollapsible = usePartiallyAppliedCallback(valueId => {
        const oldState = {...openCollapsibles};
        setOpenCollapsibles(initialCollapsibleState);
        setOpenCollapsibles({[valueId]: !oldState[valueId]});
    }, []);

    const handleAddValue = useCallback(() => {
        const valueId = uuid();
        toggleCollapsible(valueId)();
        onAddValue({valueId});
    }, [onAddValue, toggleCollapsible]);

    return (
        <Flex flexDirection='column'>
            {values.map((value, idx) => (
                <Value
                    key={value.valueId}
                    idx={idx}
                    isFirstValue={idx === 0}
                    isLastValue={idx === values.length - 1}
                    isOpen={openCollapsibles[value.valueId] || false}
                    toggleOpen={toggleCollapsible(value.valueId)}
                    value={value}
                    provider={provider}
                    onParameterChanged={onParameterChanged(value.valueId)}
                    onLabelChanged={onLabelChanged(value.valueId)}
                    onDisplayTypeChanged={onDisplayTypeChanged(value.valueId)}
                    onColorChanged={onColorChanged(value.valueId)}
                    onEntityChanged={onEntityChanged(value.valueId)}
                    onValueKeyChanged={onValueKeyChanged(value.valueId)}
                    onValueRemoved={onValueRemoved(value.valueId)}
                    onValueDuplicated={onValueDuplicated(value.valueId)}
                    onValueOrderChanged={onValueOrderChanged(value.valueId)}
                    onValueStackedChanged={onValueStackedChanged(value.valueId)}
                />
            ))}
            <Button onClick={handleAddValue} alignSelf='flex-start'>
                Add Value
                <Icon name='plus' right />
            </Button>
        </Flex>
    );
}

const Highlight = styled(Bold)`
    color: #3ac376;
`;

function Header({valueProvider, value}) {
    if (!value.valueLabel || !value.entityLabel) {
        return <Italic>Empty Value</Italic>;
    }

    return (
        <>
            <Highlight>{value.valueLabel}</Highlight> for <Highlight>{value.entityLabel}</Highlight>
            {valueProvider.isValueGrouped(value.valueId) ? (
                <>
                    {' grouped by '}
                    <Highlight>
                        {valueProvider.params(value.valueId).group_by.formattedValue}
                    </Highlight>
                </>
            ) : null}
        </>
    );
}

function Value({
    idx,
    isFirstValue,
    isLastValue,
    value,
    provider,
    isOpen,
    toggleOpen,
    onParameterChanged,
    onLabelChanged,
    onDisplayTypeChanged,
    onColorChanged,
    onEntityChanged,
    onValueKeyChanged,
    onValueRemoved,
    onValueDuplicated,
    onValueOrderChanged,
    onValueStackedChanged,
}) {
    const header = <Header valueProvider={provider.valueProvider} value={value} />;

    const headerRightContent = (
        <>
            {!isFirstValue && (
                <Icon
                    name='arrow-up'
                    glyphicon
                    button
                    onClick={event => {
                        event.stopPropagation();
                        onValueOrderChanged(idx - 1);
                    }}
                    size={12}
                    left
                />
            )}
            {!isLastValue && (
                <Icon
                    name='arrow-down'
                    glyphicon
                    button
                    onClick={event => {
                        event.stopPropagation();
                        onValueOrderChanged(idx + 1);
                    }}
                    size={12}
                    left
                />
            )}
            <Icon
                name='trash'
                glyphicon
                button
                onClick={event => {
                    event.stopPropagation();
                    onValueRemoved();
                }}
                left
                size={12}
            />
            <Icon
                name='duplicate'
                glyphicon
                button
                onClick={event => {
                    event.stopPropagation();
                    onValueDuplicated();
                }}
                size={12}
            />
        </>
    );
    return (
        <Collapsible
            header={header}
            isOpen={isOpen}
            toggleOpen={toggleOpen}
            headerRightContent={headerRightContent}
        >
            <Flex flex={1} mb={1}>
                <DropdownList
                    flex={1}
                    mr={1}
                    leftLabel='Display Type'
                    options={['line', 'column', 'scatter', 'area'].map(value => ({
                        label: value.titleize(),
                        value,
                    }))}
                    placeholder='Line'
                    value={provider.settingsValueForValueId(value.valueId, ['type'])}
                    onValueChanged={onDisplayTypeChanged}
                />
                <ColorPickerDropdown
                    flex={1}
                    label='Display Color'
                    disabled={provider.valueProvider.isValueGrouped(value.valueId)}
                    color={provider.settingsValueForValueId(value.valueId, ['color'])}
                    colors={provider.getCustomColors()}
                    onChange={onColorChanged}
                />
            </Flex>
            <Checkbox
                leftLabel='Stack Value'
                checked={provider.settingsValueForValueId(value.valueId, ['stacked'], false)}
                onValueChanged={onValueStackedChanged}
                mb={1}
            />
            <FilterableDropdownList
                mb={1}
                label='Entity'
                manualValue={value.entityLabel}
                error={value.entityError}
                options={provider.vehicleOptions()}
                placeholder='None'
                onValueChanged={entityUid => onEntityChanged(provider.getVehicle(entityUid))}
            />
            <FilterableDropdownList
                mb={1}
                label='Value'
                manualValue={value.valueLabel}
                options={provider.optionsForValueId(value.valueId).sort(v => v.label)}
                disabled={!provider.isEntitySelected(value.valueId)}
                onValueChanged={onValueKeyChanged}
            />
            <InfoTextDropdown
                title='Available Variables'
                infoTexts={DERIVED_VALUE_LABEL_DESCRIPTION}
            >
                <TextInput
                    mb={1}
                    leftLabel='Label'
                    value={provider.settingsValueForValueId(value.valueId, ['name'])}
                    disabled={!provider.isValueSelected(value.valueId)}
                    placeholder='E.g. {{valueName}} - {{groupName}}'
                    onValueChanged={onLabelChanged}
                />
            </InfoTextDropdown>
            <Parameters
                enableFilters
                params={value.params}
                onParameterChanged={onParameterChanged}
            />
        </Collapsible>
    );
}
