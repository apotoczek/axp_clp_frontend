import React from 'react';
import PropTypes from 'prop-types';
import {Flex, Box} from '@rebass/grid';

import {format_array} from 'src/libs/Formatters';
import {is_set} from 'src/libs/Utils';
import {DropdownContent, DropdownInput} from 'components/basic/forms/dropdowns/base';
import TextInput from 'components/basic/forms/input/TextInput';
import Dropdown from 'components/basic/forms/dropdowns/Dropdown';
import CollapsibleList from 'components/basic/forms/dropdowns/CollapsibleList';

function sortFunction(a, b) {
    /* This sort function places leaves at the top and nestable members,
       below. Furthermore secondary sorts alphabetically.
    */
    if (a.disableCollapse && !b.disableCollapse) {
        return -1;
    } else if (b.disableCollapse && !a.disableCollapse) {
        return 1;
    }
    return a.label > b.label ? 1 : -1;
}

export default class AttributeSelectorDropdown extends React.PureComponent {
    static propTypes = {
        items: PropTypes.arrayOf(
            PropTypes.shape({
                value: PropTypes.any,
                label: PropTypes.string,
                options: PropTypes.array,
            }),
        ).isRequired,
        onAttributeClicked: PropTypes.func.isRequired,
    };

    static defaultProps = {
        items: [],
        onAttributeClicked: () => {},
    };

    state = {filterStr: null};

    filterStr() {
        const categoriesSelected = this.props.items.reduce((accumulated, value) => {
            return is_set(value.selected) ? [...accumulated, value.label] : accumulated;
        }, []);

        if (categoriesSelected.length === 0) {
            // Nothing selected
            return 'No filters applied';
        } else if (categoriesSelected.length === 1) {
            return categoriesSelected[0];
        }

        return format_array(categoriesSelected.sort());
    }

    handleItemClicked = rootKey => (filterKey, _checked) => {
        this.props.onAttributeClicked(rootKey, filterKey);
    };

    handleSearchStringChanged = value => {
        this.setState({filterStr: value});
    };

    generateChildren = (rootKey, selected, item) => {
        const isSelected = selected.includes(item.value);
        if (!is_set(item.options, true)) {
            return {
                ...item,
                selectable: true,
                selected: isSelected,
                highlight: isSelected,
                disableCollapse: true, // Reached a leaf, non collapsible
            };
        }

        const childItems = item.options
            .map(option => this.generateChildren(rootKey, selected, option))
            .sort(sortFunction);
        const newItem = {
            ...item,
            selected: isSelected,
            highlight:
                isSelected || childItems.reduce((acc, {highlight}) => acc || highlight, false),
            selectable: true,
        };

        newItem.children = (
            <Box ml={3} flex='1 1 auto'>
                <CollapsibleList
                    selected={selected}
                    onSelect={this.handleItemClicked(rootKey)}
                    items={childItems}
                />
            </Box>
        );
        return newItem;
    };

    dropdownContent = ({togglePopover}) => {
        const filter = (this.state.filterStr || '').toLowerCase();

        return (
            <DropdownContent>
                <Flex flexDirection='column'>
                    <TextInput
                        label='Filter'
                        placeholder='Filter category...'
                        value={this.state.filterStr}
                        onValueChanged={this.handleSearchStringChanged}
                        rightIcon='remove'
                        rightOnClick={() => togglePopover()}
                        rightGlyphicon
                    />

                    <CollapsibleList
                        items={this.props.items
                            .filter(
                                o =>
                                    !is_set(filter, true) || o.label.toLowerCase().includes(filter),
                            )
                            .map(o => ({
                                ...this.generateChildren(o.value, o.selected || [], o),
                                selectable: false,
                            }))
                            .sort((a, b) => (a.label > b.label ? 1 : -1))}
                    />
                </Flex>
            </DropdownContent>
        );
    };

    render() {
        return (
            <Dropdown positionSettings={{offsetY: -39}} render={this.dropdownContent}>
                <DropdownInput
                    placeholder='Include filter attributes'
                    value={this.filterStr()}
                    rightIcon='down-dir'
                    leftIcon='filter'
                    label='Filter'
                />
            </Dropdown>
        );
    }
}
