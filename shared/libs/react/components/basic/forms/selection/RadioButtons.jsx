import React from 'react';
import PropTypes from 'prop-types';
import {Flex} from '@rebass/grid';

import Checkbox from 'components/basic/forms/Checkbox';

RadioButtons.propTypes = {
    options: PropTypes.arrayOf(
        PropTypes.shape({
            value: PropTypes.any.isRequired,
            text: PropTypes.string,
            label: PropTypes.string,
        }),
    ),
    selected: PropTypes.shape({
        value: PropTypes.any,
    }),
    onSelect: PropTypes.func,
};
export default function RadioButtons({options, value, onSelect}) {
    return (
        <Flex>
            {options.map(o => (
                <Checkbox
                    mx={1}
                    key={o.value}
                    leftLabel={o.text || o.label}
                    checked={o.value === value}
                    checkedIcon='dot-circled'
                    uncheckedIcon='circle-empty'
                    onValueChanged={() => onSelect(o)}
                />
            ))}
        </Flex>
    );
}
