import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import {CSSTransition} from 'react-transition-group';

import {is_set} from 'src/libs/Utils';

import Icon from 'components/basic/Icon';
import {Description, H4, H2} from 'components/basic/text';

import Dropdown, {DropdownOpenMode} from 'components/basic/forms/dropdowns/Dropdown';

const StyledIcon = styled(Icon)`
    padding-left: 5px;
`;

const InlineDropdown = styled(Dropdown)`
    display: inline-block;
    cursor: pointer;
`;

const Content = styled.div`
    background-color: ${({theme}) => theme.textDropdown.bg};
    max-width: 450px;

    padding: 10px 15px;

    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.16), 0 1px 3px rgba(0, 0, 0, 0.23);
    border: 1px solid ${({theme}) => theme.textDropdown.border};

    color: ${({theme}) => theme.textDropdown.fg};
    font-size: 14px;

    &.fade-appear {
        opacity: 0;
    }

    &.fade-appear-active {
        opacity: 1;
        transition: opacity 100ms ease-in-out;
    }
`;

const StyledInfoText = styled.div`
    margin-bottom: 24px;
`;

const StyledTitle = styled(H2)`
    margin-bottom: 15px;
`;

const ItalicDescription = styled(Description)`
    font-style: italic;
`;

function TextDropdown({content, title, children, hoverOpenDelay}) {
    const dropdownContent = (
        <CSSTransition in appear timeout={100} classNames='fade'>
            <Content>
                <StyledTitle>{title}</StyledTitle>
                {content}
            </Content>
        </CSSTransition>
    );
    return (
        <InlineDropdown
            content={dropdownContent}
            hoverOpenDelay={hoverOpenDelay}
            openOn={DropdownOpenMode.Hover}
        >
            {children}
        </InlineDropdown>
    );
}

InfoTextDropdown.propTypes = {
    title: PropTypes.string,
    infoTexts: PropTypes.arrayOf(
        PropTypes.shape({
            title: PropTypes.string,
            description: PropTypes.string,
            italic: PropTypes.string,
        }),
    ),
    hoverOpenDelay: PropTypes.number,
    iconSize: PropTypes.number,
};

export default function InfoTextDropdown({
    title,
    infoTexts,
    iconSize,
    hoverOpenDelay = 300,
    children,
}) {
    const content = infoTexts.map(infoText => (
        <StyledInfoText key={infoText.title}>
            <H4>{infoText.title}</H4>
            <Description>{infoText.description}</Description>
            <ItalicDescription>{infoText.italic}</ItalicDescription>
        </StyledInfoText>
    ));

    return (
        <TextDropdown title={title} content={content} hoverOpenDelay={hoverOpenDelay}>
            {is_set(children, true) ? (
                children
            ) : (
                <StyledIcon size={iconSize} name='question-sign' glyphicon />
            )}
        </TextDropdown>
    );
}
