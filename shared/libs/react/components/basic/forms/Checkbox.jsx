import React, {Component} from 'react';
import PropTypes from 'prop-types';
import styled, {css} from 'styled-components';

import Icon from 'components/basic/Icon';
import Input from 'components/basic/forms/input/Input';

const CheckboxIcon = styled(Icon)`
    color: #95a5a6;

    ${props =>
        props.checked &&
        css`
            color: #3ac376;
        `}
`;

const CheckboxInput = styled(Input)`
    cursor: pointer;
`;

export default class Checkbox extends Component {
    static propTypes = {
        checked: PropTypes.bool.isRequired,
        onValueChanged: PropTypes.func,
        uncheckedIcon: PropTypes.string,
        checkedIcon: PropTypes.string,
    };

    static defaultProps = {
        checkedIcon: 'check',
        uncheckedIcon: 'check-empty',
    };

    handleClick = value => () => {
        const {onValueChanged} = this.props;
        if (typeof onValueChanged === 'function') {
            onValueChanged(value);
        }
    };

    render() {
        const {
            leftLabel,
            checked,
            checkedIcon,
            uncheckedIcon,
            onValueChanged: _onValueChanged,
            ...rest
        } = this.props;

        return (
            <CheckboxInput
                {...rest}
                leftLabel={leftLabel}
                rightRender={() => (
                    <CheckboxIcon
                        name={checked ? checkedIcon : uncheckedIcon}
                        checked={checked}
                        right
                    />
                )}
                onClick={this.handleClick(!checked)}
            />
        );
    }
}
