import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import Dropdown from 'components/basic/forms/dropdowns/Dropdown';
import Icon from 'components/basic/Icon';
import Button from 'src/libs/react/components/basic/forms/Button';

const Wrapper = styled.div`
    background: ${({theme}) => theme.dataTable.columnChecklistDropdown.bg};
    min-width: 224px;

    padding: 16px 0;
    border-radius: 2px;
    box-shadow: 0 3px 6px rgba(0, 0, 0, 0.16), 0 3px 6px rgba(0, 0, 0, 0.23);

    color: ${({theme}) => theme.dataTable.columnChecklistDropdown.fg};
`;

const Content = styled.div`
    max-width: 300px;
    max-height: 300px;
    overflow-y: auto;
    padding: 0 16px;
`;

const ToggleButton = styled(Button)`
    margin: 10px 16px 0;
`;

const Checkmark = styled(Icon)`
    font-size: 12px;
`;

const ItemWrapper = styled.button`
    width: 100%;
    margin-bottom: 5px;

    outline: none;

    line-height: 1.5;
    font-size: 12px;
    padding: 5px 10px;

    background: ${({theme, selected}) =>
        selected ? theme.dataTable.columnChecklistDropdown.itemBgSelected : 'transparent'};
    color: ${({theme, selected}) =>
        selected
            ? theme.dataTable.columnChecklistDropdown.itemFgSelected
            : theme.dataTable.columnChecklistDropdown.fg};
    border-radius: 3px;
    border: 1px solid
        ${({theme, selected}) =>
            selected ? theme.dataTable.columnChecklistDropdown.itemBorderSelected : '#6D83A3'};
    text-align: left;
`;

Item.propTypes = {
    children: PropTypes.node.isRequired,
    selected: PropTypes.bool,
};
function Item(props) {
    return (
        <ItemWrapper {...props}>
            {props.children}
            {props.selected ? <Checkmark glyphicon name='ok' right /> : null}
        </ItemWrapper>
    );
}

ColumnChecklistDropdown.propTypes = {
    children: PropTypes.node.isRequired,
    onSelect: PropTypes.func,
    selected: PropTypes.arrayOf(PropTypes.any).isRequired,
    options: PropTypes.arrayOf(
        PropTypes.shape({
            key: PropTypes.any,
            label: PropTypes.string.isRequired,
        }),
    ).isRequired,
};
export default function ColumnChecklistDropdown({
    options,
    selected,
    onSelect,
    children,
    onToggleAll,
}) {
    return (
        <Dropdown
            render={() => (
                <Wrapper>
                    <Content>
                        {options.map(option => (
                            <Item
                                key={option.key}
                                selected={selected.includes(option.key)}
                                onClick={() => onSelect(option.key)}
                            >
                                {option.label}
                            </Item>
                        ))}
                    </Content>
                    <ToggleButton onClick={onToggleAll}>
                        {options.length === selected.length
                            ? 'Hide All Columns'
                            : 'Show All Columns'}
                    </ToggleButton>
                </Wrapper>
            )}
        >
            {children}
        </Dropdown>
    );
}
