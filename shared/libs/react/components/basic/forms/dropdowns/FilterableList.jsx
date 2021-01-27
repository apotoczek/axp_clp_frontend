import React from 'react';
import styled from 'styled-components';

import TextInput from 'components/basic/forms/input/TextInput';
import List from 'components/basic/forms/dropdowns/List';

const ListWrapper = styled.div`
    overflow: auto;
`;

class FilterableList extends React.Component {
    static propTypes = {
        ...List.propTypes,
    };

    static defaultProps = {
        ...List.defaultProps,
    };

    state = {
        filter: '',
    };

    filterItems = (filter, items, labelKey, subLabelKey) => {
        if (filter && filter.length > 0) {
            const lowerCaseValue = filter.toLowerCase();

            return items
                .filter(
                    option =>
                        (option[labelKey] &&
                            option[labelKey].toLowerCase().includes(lowerCaseValue)) ||
                        (option[subLabelKey] &&
                            option[subLabelKey].toLowerCase().includes(lowerCaseValue)),
                )
                .sortBy(o => !o[labelKey].toLowerCase().startsWith(lowerCaseValue));
        }

        return items;
    };

    handleFilterChange = filter => {
        this.setState({filter});
    };

    render() {
        const {filter} = this.state;
        const {
            items,
            labelKey,
            subLabelKey,
            filterRightIcon,
            filterRightOnClick,
            filterRightGlyphicon,
            ...rest
        } = this.props;

        return (
            <>
                <TextInput
                    autoFocus
                    defaultValue={filter}
                    placeholder='Filter ... '
                    onValueChanged={this.handleFilterChange}
                    debounceValueChange={false}
                    rightIcon={filterRightIcon}
                    rightOnClick={filterRightOnClick}
                    rightGlyphicon={filterRightGlyphicon}
                />
                <ListWrapper>
                    <List
                        labelKey={labelKey}
                        subLabelKey={subLabelKey}
                        items={this.filterItems(filter, items, labelKey, subLabelKey)}
                        {...rest}
                    />
                </ListWrapper>
            </>
        );
    }
}

export default FilterableList;
