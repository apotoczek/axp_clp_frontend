import React from 'react';
import PropTypes from 'prop-types';

import styled, {css} from 'styled-components';
import {Flex} from '@rebass/grid';

import AttributeTree from 'bison/utils/AttributeTree';
import Button from 'components/basic/forms/Button';
import Dropdown from 'components/basic/forms/dropdowns/Dropdown';
import Icon from 'components/basic/Icon';
import * as Utils from 'src/libs/Utils';

const MemberName = styled(Flex)`
    font-size: 13px;
    color: ${({theme}) => theme.multiLevelSelector.memberNameFg};
    ${({isActive, isLeaf, theme}) =>
        isActive &&
        !isLeaf &&
        css`
            color: ${theme.multiLevelSelector.memberNameActiveNotLeafBg};
        `}
    ${({isActive, isLeaf, theme}) =>
        isActive &&
        isLeaf &&
        css`
            color: ${theme.multiLevelSelector.memberNameActiveFg};
        `}
    ${({descendantIsActive, theme}) =>
        descendantIsActive &&
        css`
            color: ${theme.multiLevelSelector.memberNameActiveFg};
        `}
`;

MemberName.propTypes = {
    isActive: PropTypes.bool,
    isLeaf: PropTypes.bool,
    descendantIsActive: PropTypes.bool,
};

const MemberBox = styled(Flex)`
    ${({theme, isActive, isLeaf, descendantIsActive}) =>
        (isActive || descendantIsActive) &&
        !isLeaf &&
        css`
            border-left: 3px solid ${theme.multiLevelSelector.memberBoxActiveBorder};
            background-color: ${theme.multiLevelSelector.memberBoxActiveBg};
        `}
    height: 35px;
    cursor: pointer;
    padding: 0 4px;
    color: ${({theme}) => theme.multiLevelSelector.memberBoxFg};
    transition: background-color 0.3s ease;
    &:hover {
        background-color: ${({theme}) => theme.multiLevelSelector.memberBoxHoverBg};
    }
`;

MemberName.propTypes = {
    isActive: PropTypes.bool,
    isLeaf: PropTypes.bool,
    descendantIsActive: PropTypes.bool,
};

const UnderTitle = styled(Flex)`
    border-bottom: 1px solid ${({theme}) => theme.multiLevelSelector.titleBorder};
    align-items: center;
    flex-shrink: 1;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 1px;
    padding: 6px;
    background-color: ${({theme}) => theme.multiLevelSelector.titleBg};
    color: ${({theme}) => theme.multiLevelSelector.titleFg};
    transition: background-color 0.3s ease;
    &:hover {
        cursor: pointer;
        background-color: ${({theme}) => theme.multiLevelSelector.titleHoverBg};
    }
`;

const ItemList = styled.div`
    background-color: inherit;
    overflow-y: auto;
    flex-grow: 1;
    width: 100%;
`;

const Wrapper = styled(Flex)`
    overflow: hidden;
    flex-direction: column;
    min-width: 220px;
    max-height: 320px;
    min-height: 220px;
    background-color: ${({theme}) => theme.multiLevelSelector.wrapperBg};
    box-shadow: 0 3px 6px rgba(0, 0, 0, 0.16), 0 3px 6px rgba(0, 0, 0, 0.23);
`;

const BottomWrapper = styled(Flex)`
    flex-shrink: 1;
    flex-direction: row;
    background-color: ${({theme}) => theme.multiLevelSelector.footerBg};
    justify-content: flex-end;
    align-items: center;
    padding: 6px;
`;

const BaseButton = styled(Button)`
    display: flex;
    justify-content: center;
    min-width: 60px;
    padding: 3px 0;
    flex-shrink: 1;
    box-shadow: 0 0 0;
    transition: background-color 0.3s ease;
`;

const ClearButton = styled(BaseButton)`
    color: ${({theme}) => theme.multiLevelSelector.clearButtonFg};
    background-color: ${({theme}) => theme.multiLevelSelector.clearButtonBg};
    &:hover {
        border: none;
        background-color: ${({theme}) => theme.multiLevelSelector.clearButtonHoverBg};
    }
`;

const SaveButton = styled(BaseButton)`
    color: ${({theme}) => theme.multiLevelSelector.saveButtonFg};
    background-color: ${({theme}) => theme.multiLevelSelector.saveButtonBg};
    margin-left: 6px;
    &:hover {
        border: none;
        background-color: ${({theme}) => theme.multiLevelSelector.saveButtonHoverBg};
    }
`;

const ExpandButtonWrapper = styled(Button)`
    color: ${({theme}) => theme.multiLevelSelector.expandButtonFg};
    display: flex;
    align-items: center;
    border-radius: 3px;
    width: 66px;
    height: 22px;
    font-size: 9px;
    margin: 0 4px;
    padding-left: 6px;
    box-shadow: 0 0 0;
    background-color: ${({theme}) => theme.multiLevelSelector.expandButtonBg};
    border: 1px solid ${({theme}) => theme.multiLevelSelector.expandButtonBorder};
    transition: background-color 0.3s ease;
    &:hover {
        color: ${({theme}) => theme.multiLevelSelector.expandButtonDescendantActiveHighlight};
        border: 1px solid
            ${({theme}) => theme.multiLevelSelector.expandButtonDescendantActiveHighlight};
        background-color: #ffffff;
    }

    ${props =>
        !props.descendantIsActive &&
        props.isActive &&
        css`
            background-color: ${({theme}) => theme.multiLevelSelector.expandButtonBg};
            border: 1px solid ${({theme}) => theme.multiLevelSelector.expandButtonBorder};
            background-color: #ffffff;
        `}

    ${props =>
        props.descendantIsActive &&
        css`
            color: #ffffff;
            border: none;
            background-color: ${({theme}) =>
                theme.multiLevelSelector.expandButtonDescendantActiveHighlight};
        `}
`;

MemberName.propTypes = {
    isActive: PropTypes.bool,
    descendantIsActive: PropTypes.bool,
};

// Popover button that is rendered in the cell (contains selected value or N/A)
const DropdownButton = styled(Button)`
    color: ${({value, theme}) =>
        value === 'N/A'
            ? theme.multiLevelSelector.dropdownButtonNAFg
            : theme.multiLevelSelector.dropdownButtonFg};
    font-family: 'Lato', 'Helvetica Neue', Helvetica, Arial, sans-serif;
    letter-spacing: 0;
    font-size: 11px;
    padding: 0 0 0 2px;
    margin: 0;
    width: auto;
    box-shadow: 0 0;
    white-space: nowrap;
    background-color: ${({theme}) => theme.multiLevelSelector.dropdownButtonBg};
    &:hover {
        top: 0;
        left: 0;
    }
`;

MemberName.propTypes = {
    isActive: PropTypes.bool.isRequired,
    descendantIsActive: PropTypes.bool.isRequired,
};

const CheckboxIcon = styled(Icon)`
    color: ${({theme}) => theme.multiLevelSelector.checkboxIconFg};
    cursor: pointer;
    background-color: ${({theme}) => theme.multiLevelSelector.memberBoxBg};
    transition: background-color 0.3s ease;
    ${({checked, theme}) =>
        checked &&
        css`
            color: ${theme.multiLevelSelector.checkboxIconHoverFg};
        `}
`;

CheckboxIcon.propTypes = {
    checked: PropTypes.bool,
};

export default class MultiLevelSelector extends React.Component {
    static propTypes = {
        members: PropTypes.array.isRequired,
        selectedItem: PropTypes.string,
        onSelect: PropTypes.func.isRequired,
        children: PropTypes.func,
    };

    /**
     * Note: This (tree) will only be loaded when the component is initialized.
     * This is currently not an issue because we currently do not require
     * that the members passed in be able to change throughout the life of
     * the component.
     **/
    tree = new AttributeTree(this.props.members || []);

    state = {
        // Actual selected item uid, post-save or as loaded.
        selectedItem: this.props.selectedItem,
        // Currently "selected" member uid, but not yet saved.
        activeItem: this.props.selectedItem,
        // Nesting level context base context = null, else member's uid
        context: this.props.selectedItem
            ? this.tree.getParentId(this.props.selectedItem || null)
            : null,
    };

    navigateUp = () => {
        const parent = this.tree.getParent(this.state.context);
        const context = parent ? parent.uid : null;
        this.setState({context});
    };

    navigateInto = memberUid => {
        this.setState({context: memberUid});
    };

    setActiveItem = item => {
        const activeItem = this.state.activeItem === item ? null : item;
        this.setState({activeItem});
    };

    saveSelection = () => {
        const {activeItem} = this.state;
        this.setState({selectedItem: activeItem, isOpen: false});
        this.props.onSelect(activeItem);
    };

    formatSelected() {
        const selected = this.state.selectedItem;
        const formatted = selected ? this.tree.getFullMemberName(selected) : 'N/A';
        return formatted;
    }

    clearValues = () => {
        this.setState({selectedItem: null, activeItem: null, context: null});
        this.props.onSelect(null);
    };

    resetValues = () => {
        this.setState({activeItem: this.state.selectedItem});
        return true;
    };

    clearContext = () => {
        this.setState({context: null});
    };

    renderSelector = ({togglePopover}) => {
        const {context, activeItem} = this.state;
        const path = this.tree.getLineage(context);
        const items = this.tree.getChildren(context || null) || [];
        const ancestorIds = this.tree.getLineageIds(activeItem) || [];
        return (
            <Wrapper>
                <Header path={path} navigateUp={this.navigateUp} clearContext={this.clearContext} />
                <ItemList>
                    {items.map(item => {
                        const hasChildren = Utils.is_set(this.tree.getChildren(item.uid), true);
                        const descendantIsActive =
                            ancestorIds.includes(item.uid) && item.uid !== activeItem;
                        return (
                            <MemberItem
                                key={item.uid}
                                onSelect={() => this.setActiveItem(item.uid)}
                                member={item}
                                isActive={activeItem == item.uid}
                                descendantIsActive={descendantIsActive}
                                onExpand={this.navigateInto}
                                isLeaf={!hasChildren}
                            />
                        );
                    })}
                </ItemList>
                <Bottom
                    clearValues={() => {
                        this.clearValues();
                        this.saveSelection();
                    }}
                    saveSelection={() => {
                        this.saveSelection();
                        togglePopover();
                    }}
                    selectedItem={this.state.activeItem}
                />
            </Wrapper>
        );
    };
    render() {
        const fullPath = this.formatSelected();
        const children = this.props.children;
        return (
            <Dropdown render={this.renderSelector} onClickOutside={this.resetValues}>
                {children ? children(fullPath) : <DropdownButton>{fullPath}</DropdownButton>}
            </Dropdown>
        );
    }
}

const BackIcon = styled.div`
    margin-right: 6px;
    min-width: 24px;
    min-height: 24px;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
`;

function Header({path, navigateUp}) {
    const item = path.length ? path[path.length - 1] : null;
    if (!item) {
        return <></>;
    }
    return (
        <Flex flexDirection='column'>
            {path.length >= 1 && (
                <UnderTitle onClick={() => navigateUp()}>
                    <BackIcon>
                        <Icon glyphicon name='chevron-left' />
                    </BackIcon>{' '}
                    {item.name}
                </UnderTitle>
            )}
        </Flex>
    );
}

Header.propTypes = {
    path: PropTypes.arrayOf(PropTypes.object).isRequired,
    navigateUp: PropTypes.func.isRequired,
};

function Bottom({clearValues, saveSelection}) {
    return (
        <BottomWrapper>
            <ClearButton onClick={() => clearValues()}>Clear</ClearButton>
            <SaveButton onClick={() => saveSelection()}>OK</SaveButton>
        </BottomWrapper>
    );
}

Bottom.propTypes = {
    clearValues: PropTypes.func.isRequired,
    saveSelection: PropTypes.func.isRequired,
};

function CallToAction({isLeaf, isActive, descendantIsActive, onClick, onSelect}) {
    return isLeaf ? (
        <Checkbox checked={isActive} onClick={onSelect} />
    ) : (
        <ExpandButton
            onClick={onClick}
            isActive={isActive}
            descendantIsActive={descendantIsActive}
        />
    );
}

CallToAction.propTypes = {
    isLeaf: PropTypes.bool.isRequired,
    isActive: PropTypes.bool.isRequired,
    descendantIsActive: PropTypes.bool.isRequired,
    onClick: PropTypes.func.isRequired,
    onSelect: PropTypes.func.isRequired,
};

function MemberItem({member, isLeaf, descendantIsActive, isActive, onExpand, onSelect}) {
    const onCtaClick = e => {
        e.stopPropagation();
        onExpand(member.uid);
    };
    return (
        <MemberBox isActive={isActive} descendantIsActive={descendantIsActive} isLeaf={isLeaf}>
            <MemberName
                isLeaf={isLeaf}
                isActive={isActive}
                onClick={onSelect}
                descendantIsActive={descendantIsActive}
                pl={2}
                alignItems='center'
                flex={1}
            >
                {member.name}
            </MemberName>
            <Flex alignItems='center' justifyContent='center' p={1}>
                <CallToAction
                    isLeaf={isLeaf}
                    isActive={isActive}
                    descendantIsActive={descendantIsActive}
                    onClick={onCtaClick}
                    onSelect={onSelect}
                />
            </Flex>
        </MemberBox>
    );
}

MemberItem.propTypes = {
    member: PropTypes.shape({
        uid: PropTypes.string.isRequired,
    }),
    isLeaf: PropTypes.bool.isRequired,
    descendantIsActive: PropTypes.bool.isRequired,
    isActive: PropTypes.bool.isRequired,
    onExpand: PropTypes.func.isRequired,
    onSelect: PropTypes.func.isRequired,
};

function ExpandButton({onClick, isActive, descendantIsActive}) {
    return (
        <ExpandButtonWrapper
            onClick={onClick}
            isActive={isActive}
            descendantIsActive={descendantIsActive}
        >
            EXPAND <Icon glyphicon name='chevron-right' size='8' />
        </ExpandButtonWrapper>
    );
}

ExpandButton.propTypes = {
    descendantIsActive: PropTypes.bool.isRequired,
    isActive: PropTypes.bool.isRequired,
    onClick: PropTypes.func.isRequired,
};

function Checkbox({checked, onClick}) {
    return (
        <CheckboxIcon
            name={checked ? 'check' : 'check-empty'}
            onClick={onClick}
            checked={checked}
        />
    );
}

Checkbox.propTypes = {
    checked: PropTypes.bool.isRequired,
    onClick: PropTypes.func.isRequired,
};
