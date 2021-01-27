import React, {useState} from 'react';

import styled from 'styled-components';
import Checklist from 'components/basic/forms/dropdowns/Checklist';
import TextInput from 'components/basic/forms/input/TextInput';

const ListWrapper = styled.div`
    overflow: auto;
`;

export default function FilterableChecklist({
    options,
    values,
    noOptionsLabel,
    onValueChanged,
    labelKey,
    keyKey,
    valueKey,
}) {
    const [filter, setFilter] = useState('');

    const filterOptions = (filter, options, labelKey) => {
        if (filter && filter.length > 0) {
            const lowerCaseValue = filter.toLowerCase();
            return options
                .filter(
                    option =>
                        option[labelKey] && option[labelKey].toLowerCase().includes(lowerCaseValue),
                )
                .sortBy(o => !o[labelKey].toLowerCase().startsWith(lowerCaseValue));
        }

        return options;
    };

    return (
        <ListWrapper>
            <TextInput
                autoFocus
                defaultValue={filter}
                placeholder='Filter ...'
                onValueChanged={setFilter}
            />
            <Checklist
                options={filterOptions(filter, options, labelKey)}
                values={values}
                noOptionsLabel={noOptionsLabel}
                onValueChanged={onValueChanged}
                labelKey={labelKey}
                keyKey={keyKey}
                valueKey={valueKey}
            />
        </ListWrapper>
    );
}
