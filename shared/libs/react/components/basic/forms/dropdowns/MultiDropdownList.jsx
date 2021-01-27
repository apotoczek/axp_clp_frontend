import React from 'react';
import styled from 'styled-components';

import Dropdown from 'components/basic/forms/dropdowns/Dropdown';
import FilterableList from 'components/basic/forms/dropdowns/FilterableList';
import {DropdownContent, DropdownInput} from 'components/basic/forms/dropdowns/base';

const FlexContent = styled(DropdownContent)`
    display: flex;
    height: 300px;
`;

const DropdownWrapper = styled.div`
    flex: 1;
    width: 250px;
    margin-right: 10px;
    overflow-y: auto;
    max-height: 250px;

    &:last-child {
        margin-right: 0;
    }
`;

export default class MultiDropdownList extends React.Component {
    handleOptionSelected = (key, togglePopover) => value => {
        const {onValueChanged, values} = this.props;

        if (typeof onValueChanged === 'function') {
            onValueChanged(key, value);
        }

        const allValuesSet = Object.values({...values, [key]: value}).reduce(
            (res, v) => res && typeof v === 'string',
        );

        if (allValuesSet) {
            togglePopover();
        }
    };

    render() {
        const {values, multiOptions, ...rest} = this.props;

        return (
            <Dropdown
                render={({togglePopover}) => (
                    <FlexContent>
                        {Object.entries(multiOptions).map(([key, options]) => (
                            <DropdownWrapper key={key}>
                                <FilterableList
                                    onItemClick={this.handleOptionSelected(key, togglePopover)}
                                    items={options}
                                    selectedLabel={values[key]}
                                />
                            </DropdownWrapper>
                        ))}
                    </FlexContent>
                )}
            >
                <DropdownInput
                    {...rest}
                    value={Object.values(values)
                        .filter(v => typeof v === 'string')
                        .join(' - ')}
                    rightIcon='down-dir'
                />
            </Dropdown>
        );
    }
}
