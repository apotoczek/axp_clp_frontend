import React from 'react';

import Icon from 'components/basic/Icon';
import List from 'components/basic/forms/dropdowns/List';

export default function Checklist({
    options,
    values,
    noOptionsLabel,
    labelKey = 'label',
    keyKey = 'key',
    valueKey = 'value',
    onValueChanged = () => {},
    iconKey,
    iconType,
}) {
    let mappedOptions = options;
    if (options.length === 0) {
        mappedOptions = [{value: null, label: noOptionsLabel, disabled: true}];
    } else {
        mappedOptions = options.map(option => {
            const iconRight = (
                <Icon name={values.includes(option[valueKey]) ? 'check' : 'check-empty'} />
            );
            return {...option, iconRight};
        });
    }

    return (
        <List
            onItemClick={onValueChanged}
            items={mappedOptions}
            keyKey={keyKey}
            valueKey={valueKey}
            labelKey={labelKey}
            values={values}
            iconKey={iconKey}
            iconType={iconType}
        />
    );
}
