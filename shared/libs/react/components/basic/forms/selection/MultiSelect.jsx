import React from 'react';

import styled from 'styled-components';
import PropTypes from 'prop-types';

import EnumSelect from 'components/basic/forms/selection/EnumSelect';
import ListBox from 'components/basic/forms/selection/ListBox';
import SortableListBox from 'components/basic/forms/selection/SortableListBox';
import SearchBox from 'components/basic/forms/selection/SearchBox';

import {EnumFilterer, TextFilterer} from 'components/basic/forms/selection/filters';

const insertAction = {
    color: 'green',
    symbol: '+',
};

const reverseAction = {
    color: 'red',
    symbol: '-',
};

export const Badge = styled.span`
    color: ${({theme}) => theme.multiSelect.badgeFg};
`;

const Header = styled.div`
    color: ${({theme}) => theme.multiSelect.headerFg};
    text-transform: uppercase;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 1px;
    margin: 0 0 8px 4px;
    padding: 0;
    position: relative;
`;

const Column = styled.div`
    box-sizing: border-box;
    display: inline-block;
    height: 100%;
    width: calc(50% - 5px);
    &:first-child {
        margin-right: 10px;
    }
`;

const Wrapper = styled.section`
    display: block;
    width: 100%;
    overflow: hidden;
    margin: 10px auto 20px;
    background-color: ${({theme}) => theme.multiSelect.wrapperBg};
`;

class MultiSelect extends React.Component {
    static propTypes = {
        leftLabel: PropTypes.string,
        rightLabel: PropTypes.string,
        disabledKeys: PropTypes.array,
        selectedKeys: PropTypes.array,
        metaKey: PropTypes.string,
        labelKey: PropTypes.string,
        keyKey: PropTypes.string,
        filterKey: PropTypes.string,
        searchPlaceholder: PropTypes.string,
        filterOptions: PropTypes.arrayOf(
            PropTypes.shape({
                value: PropTypes.any.isRequired,
                label: PropTypes.string.isRequired,
            }),
        ),
        onItemSelect: PropTypes.func,
        onItemUnselect: PropTypes.func,
        options: PropTypes.arrayOf(PropTypes.object).isRequired,
    };

    static defaultProps = {
        leftLabel: 'Select',
        rightLabel: 'Included',
        labelKey: 'name',
        keyKey: 'key',
        disabledKeys: [],
    };

    constructor(props) {
        super(props);

        this.filterer = new TextFilterer(props.labelKey);

        this.state = {
            filters: {
                text: '',
            },
        };

        if (props.filterKey && props.filterOptions) {
            this.state.filters[props.filterKey] = props.filterOptions[0];
            this.enumFilterer = new EnumFilterer(props.filterKey);
        }
    }

    handleQueryChange(e) {
        const filters = this.state.filters;

        this.setState({
            filters: {
                ...filters,
                text: e.target.value,
            },
        });
    }

    handleFilterChange(option) {
        const filters = this.state.filters;

        this.setState({
            filters: {
                ...filters,
                [this.props.filterKey]: option,
            },
        });
    }

    handleItemSelect = item => {
        const {onItemSelect, keyKey} = this.props;

        if (typeof onItemSelect === 'function') {
            onItemSelect(item[keyKey]);
        }
    };

    handleItemUnselect = item => {
        const {onItemUnselect, keyKey} = this.props;

        if (typeof onItemUnselect === 'function') {
            onItemUnselect(item[keyKey]);
        }
    };

    handleItemMove = (oldIndex, newIndex) => {
        const {onItemMove} = this.props;

        if (typeof onItemMove === 'function') {
            onItemMove(oldIndex, newIndex);
        }
    };

    render() {
        const {
            selectedKeys,
            disabledKeys,
            filterOptions,
            filterKey,
            labelKey,
            metaKey,
            keyKey,
            options,
            leftLabel,
            rightLabel,
            searchPlaceholder,
        } = this.props;

        const {filters} = this.state;

        const indexedOptions = {};
        let filteredOptions = [];

        for (const option of options) {
            indexedOptions[option[keyKey]] = option;

            if (selectedKeys.indexOf(option[keyKey]) === -1) {
                filteredOptions.push(option);
            }
        }

        const selectedOptions = selectedKeys
            .filter(key => indexedOptions[key])
            .map(key => indexedOptions[key]);

        if (this.enumFilterer) {
            filteredOptions = this.enumFilterer.filter(filters[filterKey].value, filteredOptions);
        }

        filteredOptions = this.filterer.filter(filters.text, filteredOptions);

        const hasFilters = filterOptions && filterKey;

        return (
            <Wrapper>
                <Column>
                    <Header>{leftLabel}</Header>
                    <SearchBox
                        placeholder={searchPlaceholder}
                        onChange={this.handleQueryChange.bind(this)}
                    />
                    {hasFilters && (
                        <EnumSelect
                            options={filterOptions}
                            selected={filters[filterKey]}
                            onSelect={this.handleFilterChange.bind(this)}
                        />
                    )}
                    <ListBox
                        labelKey={labelKey}
                        metaKey={metaKey}
                        keyKey={keyKey}
                        action={insertAction}
                        options={filteredOptions}
                        onSelect={this.handleItemSelect.bind(this)}
                    />
                </Column>
                <Column>
                    <Header>
                        {rightLabel} <Badge>{selectedOptions.length}</Badge>
                    </Header>
                    <SortableListBox
                        onMove={this.handleItemMove}
                        disabledKeys={disabledKeys}
                        labelKey={labelKey}
                        metaKey={metaKey}
                        keyKey={keyKey}
                        action={reverseAction}
                        options={selectedOptions}
                        onSelect={this.handleItemUnselect}
                        scrollOnUpdate
                    />
                </Column>
            </Wrapper>
        );
    }
}

export default MultiSelect;
