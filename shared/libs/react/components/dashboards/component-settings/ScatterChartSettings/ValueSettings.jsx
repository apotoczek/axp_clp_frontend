import React, {useState} from 'react';
import styled from 'styled-components';
import {Flex, Box} from '@rebass/grid';

import {object_from_array} from 'src/libs/Utils';
import {usePartiallyAppliedCallback} from 'utils/hooks';

import {Bold, Italic} from 'components/basic/text';
import FilterableDropdownList from 'components/basic/forms/dropdowns/FilterableDropdownList';
import Collapsible from 'components/dashboards/component-settings/Collapsible';

import Parameters from 'components/dashboards/component-settings/Parameters';

export default function ValueSettings({onParameterChanged, onValueKeyChanged, provider}) {
    const axes = ['xAxis', 'yAxis'];
    if (provider.isBubbleChart()) {
        axes.push('zAxis');
    }

    const initialCollapsibleState = object_from_array(axes, axisName => [
        axisName,
        axisName === 'xAxis',
    ]);
    const [openCollapsibles, setOpenCollapsibles] = useState(initialCollapsibleState);

    const toggleCollapsible = usePartiallyAppliedCallback(axisName => {
        const oldState = {...openCollapsibles};
        setOpenCollapsibles(initialCollapsibleState);
        setOpenCollapsibles({[axisName]: !oldState[axisName]});
    }, []);

    return (
        <Flex flexDirection='column'>
            {axes.map(axisName => {
                const value = provider.valueForAxisName(axisName);
                return (
                    <Value
                        key={axisName}
                        axisName={axisName}
                        provider={provider}
                        isOpen={value.disabled ? false : openCollapsibles[axisName] || false}
                        toggleOpen={toggleCollapsible(axisName)}
                        value={value}
                        onParameterChanged={onParameterChanged(value.id)}
                        onValueKeyChanged={onValueKeyChanged(value.id)}
                    />
                );
            })}
        </Flex>
    );
}

const InlineBox = styled(Box)`
    display: inline-block;
`;

const Highlight = styled(Bold)`
    color: #3ac376;
`;

function Header({axisName, value, valueProvider}) {
    if (!value.valueLabel || !value.entityLabel) {
        return (
            <Highlight>
                {axisName.titleize()} Value (<Italic>Empty Value</Italic>)
            </Highlight>
        );
    }

    return (
        <>
            <InlineBox mr={3}>
                <Highlight>{axisName.titleize()}:</Highlight>
            </InlineBox>
            <Highlight>{value.valueLabel}</Highlight>
            {' for '}
            <Highlight>{value.entityLabel}</Highlight>
            {valueProvider.isValueGrouped(value.id) ? (
                <>
                    {' grouped by '}
                    <Highlight>{valueProvider.params(value.id).group_by.formattedValue}</Highlight>
                </>
            ) : null}
        </>
    );
}

function Value({
    axisName,
    value,
    provider,
    isOpen,
    toggleOpen,
    onParameterChanged,
    onValueKeyChanged,
}) {
    const header = (
        <Header axisName={axisName} value={value} valueProvider={provider.valueProvider} />
    );

    return (
        <Collapsible header={header} isOpen={isOpen} toggleOpen={toggleOpen}>
            <FilterableDropdownList
                mb={1}
                label='Value'
                manualValue={value.valueLabel}
                options={provider.optionsForValueId(value.id).sort(v => v.label)}
                disabled={!provider.isEntitySelected()}
                onValueChanged={valueKey => onValueKeyChanged({valueKey, axisName})}
            />
            <Parameters
                params={provider.valueProvider.params(value.id, ['group_by'])}
                onParameterChanged={onParameterChanged}
            />
        </Collapsible>
    );
}
