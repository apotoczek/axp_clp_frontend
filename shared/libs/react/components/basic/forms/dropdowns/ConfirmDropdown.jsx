import React from 'react';
import styled from 'styled-components';
import {Flex} from '@rebass/grid';
import Button from 'components/basic/forms/Button';

import Dropdown from 'components/basic/forms/dropdowns/Dropdown';
import {DropdownContent} from 'components/basic/forms/dropdowns/base';

const TextWrapper = styled.div`
    color: ${({theme}) => theme.confirmDropdown.fg};
    font-size: 15px;
    font-weight: 300;
    margin-bottom: 15px;
    text-align: center;
`;

const Muted = styled.div`
    color: ${({theme}) => theme.confirmDropdown.mutedFg};
    font-size: 13px;
`;

const Content = styled(DropdownContent)`
    background-color: ${({theme}) => theme.confirmDropdown.bg};
    max-width: 250px;

    padding: 8px;

    color: ${({theme}) => theme.confirmDropdown.fg};

    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.16), 0 1px 3px rgba(0, 0, 0, 0.23);
    border: 1px solid ${({theme}) => theme.confirmDropdown.border};
`;

const ConfirmDropdownContent = ({text, subText, onConfirm, onCancel}) => (
    <Content>
        <TextWrapper>
            {text}
            {subText && <Muted>{subText}</Muted>}
        </TextWrapper>
        <Flex>
            <Button mr={1} flex={1} primary onClick={onConfirm}>
                Yes
            </Button>
            <Button ml={1} flex={1} onClick={onCancel}>
                Cancel
            </Button>
        </Flex>
    </Content>
);
const ConfirmDropdown = ({text, subText, onConfirm, className, disabled, children}) => (
    <Dropdown
        disabled={disabled}
        className={className}
        render={({togglePopover}) => (
            <ConfirmDropdownContent
                text={text}
                subText={subText}
                onConfirm={() => {
                    togglePopover();
                    onConfirm();
                }}
                onCancel={() => togglePopover()}
            />
        )}
    >
        {children}
    </Dropdown>
);
export default ConfirmDropdown;
