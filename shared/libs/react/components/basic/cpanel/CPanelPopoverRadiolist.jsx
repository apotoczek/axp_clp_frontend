import React, {useState} from 'react';
import styled from 'styled-components';
import {is_set} from 'src/libs/Utils';

import CPanelPopover, {
    CPanelPopoverItem,
    CPanelPopoverButton,
    CPanelPopoverDivider,
} from 'components/basic/cpanel/CPanelPopover';
import CPanelInput from 'components/basic/cpanel/CPanelInput';

import {CPanelButton} from 'components/basic/cpanel/base';
import Icon from 'components/basic/Icon';

const ScrollWrapper = styled.div`
    max-height: 500px;
    overflow-y: auto;
`;

function RadioList({options, emptyText, selectedValue, onValueChanged, onClose, enableSearch}) {
    const [searchQuery, setSearchQuery] = useState('');
    let results = options;
    if (enableSearch && searchQuery?.length) {
        results = results.filter(({label}) =>
            label.toLowerCase().includes(searchQuery.toLowerCase()),
        );
    }

    return (
        <>
            {enableSearch ? (
                <CPanelInput
                    placeholder='Filter...'
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                />
            ) : null}
            <ScrollWrapper>
                {results.map(opt => (
                    <CPanelPopoverItem
                        key={opt.value}
                        selected={selectedValue === opt.value}
                        onClick={() => onValueChanged(opt.value)}
                    >
                        {opt.label}
                    </CPanelPopoverItem>
                ))}
            </ScrollWrapper>
            {!options.length && emptyText}
            <CPanelPopoverDivider />
            <CPanelButton onClick={onClose}>Close</CPanelButton>
        </>
    );
}

export default function CPanelPopoverChecklist({
    label,
    options,
    selectedValue,
    onValueChanged,
    emptyText = '',
    enableSearch,
    isLoading,
}) {
    if (isLoading) {
        return (
            <CPanelPopoverButton>
                <Icon size={12} glyphicon name='cog' className='animate-spin' />
            </CPanelPopoverButton>
        );
    }

    const selected = options.find(v => v.value === selectedValue);

    return (
        <CPanelPopover
            render={({togglePopover}) => (
                <RadioList
                    options={options}
                    selectedValue={selectedValue}
                    emptyText={emptyText}
                    onValueChanged={onValueChanged}
                    onClose={togglePopover}
                    enableSearch={enableSearch}
                />
            )}
        >
            <CPanelPopoverButton truncate active={is_set(selectedValue)}>
                {is_set(selectedValue) ? (
                    <>
                        <b>{label}</b>: {selected?.label}
                    </>
                ) : (
                    emptyText
                )}
            </CPanelPopoverButton>
        </CPanelPopover>
    );
}
