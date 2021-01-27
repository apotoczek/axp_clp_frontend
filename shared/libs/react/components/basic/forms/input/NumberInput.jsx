import React, {Component} from 'react';
import PropTypes from 'prop-types';

import TextInput from 'components/basic/forms/input/TextInput';

class NumberInput extends Component {
    static propTypes = {
        ...TextInput.propTypes,
        min: PropTypes.number,
        max: PropTypes.number,
    };

    static defaultProps = {
        debounceValueChange: true,
    };

    state = {
        invalidValue: false,
    };

    handleValueChanged = value => {
        const {min, max} = this.props;
        const intVal = parseInt(value);
        if (!isNaN(intVal)) {
            if ((min !== undefined && min > intVal) || (max !== undefined && max < intVal)) {
                this.setState({invalidValue: true});
            } else {
                this.setState({invalidValue: false});
                this.props.onValueChanged(intVal);
            }
        } else if (!value) {
            this.setState({invalidValue: false});
            this.props.onValueChanged(undefined);
        } else {
            this.setState({invalidValue: true});
        }
    };

    render() {
        return (
            <TextInput
                {...this.props}
                invalidValue={this.state.invalidValue}
                onValueChanged={event => this.handleValueChanged(event)}
            />
        );
    }
}

export default NumberInput;
