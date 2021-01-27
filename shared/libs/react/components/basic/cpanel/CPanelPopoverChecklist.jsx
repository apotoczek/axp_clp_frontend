import React from 'react';

import CPanelPopover, {
    CPanelPopoverItem,
    CPanelPopoverButton,
    CPanelPopoverDivider,
} from 'components/basic/cpanel/CPanelPopover';
import Icon from 'components/basic/Icon';

import {CPanelButton} from 'components/basic/cpanel/base';

function handleValueChange(value, selectedValues) {
    const index = selectedValues.indexOf(value);

    if (index > -1) {
        const newValues = [...selectedValues];

        newValues.splice(index, 1);

        return newValues;
    }

    return [...selectedValues, value];
}

function Checklist({options, emptyText, selectedValues, onValueChanged, onClose}) {
    return (
        <>
            {options.map(opt => (
                <CPanelPopoverItem
                    key={opt.value}
                    selected={selectedValues.indexOf(opt.value) > -1}
                    onClick={() => onValueChanged(handleValueChange(opt.value, selectedValues))}
                >
                    {opt.label}
                </CPanelPopoverItem>
            ))}
            {!options.length && emptyText}
            <CPanelPopoverDivider />
            <CPanelButton onClick={onClose}>Close</CPanelButton>
        </>
    );
}

export default function CPanelPopoverChecklist({
    label,
    options,
    selectedValues = [],
    onValueChanged,
    emptyText = '',
}) {
    return (
        <CPanelPopover
            render={({togglePopover}) => (
                <Checklist
                    options={options}
                    selectedValues={selectedValues}
                    emptyText={emptyText}
                    onValueChanged={onValueChanged}
                    onClose={togglePopover}
                />
            )}
        >
            <CPanelPopoverButton active={selectedValues.length}>
                {label} <Icon name='plus' right />
            </CPanelPopoverButton>
        </CPanelPopover>
    );
}
