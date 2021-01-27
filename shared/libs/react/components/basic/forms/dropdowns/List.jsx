import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import Icon from 'components/basic/Icon';

import ExtraPropTypes from 'utils/extra-prop-types';
import {is_set} from 'src/libs/Utils';

class FocusedDropdownOption extends React.Component {
    element = React.createRef();

    componentDidUpdate(prevProps) {
        const {isHovered, index, scrollIntoView} = this.props;

        if (scrollIntoView && isHovered && !prevProps.isHovered) {
            this.element.current.scrollIntoView({block: index ? 'nearest' : 'end'});
        }
    }

    render() {
        return <DropdownOption ref={this.element} {...this.props} />;
    }
}

const DropdownOption = styled.div`
    width: auto;
    padding: 6px 12px;
    cursor: pointer;

    border-bottom: 1px solid ${({theme}) => theme.dropdownOption.border};
    &:last-child {
        border-bottom: none;
    }

    color: ${({isSelected, theme}) =>
        isSelected ? theme.dropdownOption.selectedFg : theme.dropdownOption.fg};

    background: ${({isHovered, theme}) =>
        isHovered ? theme.dropdownOption.hoveredBg : theme.dropdownOption.bg};

    line-height: 21px;
    opacity: ${props => (props.muted ? 0.7 : 1)};
    overflow: auto;
`;

const Right = styled.span`
    float: right;
`;

const SubLabel = styled.span`
    text-transform: uppercase;
    font-size: 80%;
`;

export default class List extends React.Component {
    static propTypes = {
        onItemClick: PropTypes.func,
        broadcastFullOption: PropTypes.bool,
        selectedLabel: ExtraPropTypes.deprecated(PropTypes.string, 'Use values instead.'),
        values: PropTypes.arrayOf(PropTypes.any),
        items: optionArrayType,
        keyKey: PropTypes.string,
        valueKey: PropTypes.string,
        labelKey: PropTypes.string,
        subLabelKey: PropTypes.string,
        iconKey: PropTypes.string,
        iconType: PropTypes.string,
    };

    static defaultProps = {
        broadcastFullOption: false,
        items: [],
        keyKey: 'key',
        valueKey: 'value',
        labelKey: 'label',
        subLabelKey: 'subLabel',
    };

    state = {
        filter: '',
        hoveredIndex: 0,
        trapHover: false,
    };

    componentDidMount() {
        document.addEventListener('keydown', this.handleKeyPressed);
    }

    componentWillUnmount() {
        document.removeEventListener('keydown', this.handleKeyPressed);
    }

    handleMouseMove = () => {
        if (this.state.trapHover) {
            this.setState({trapHover: false});
        }
    };

    handleMouseOver = index => {
        if (!this.state.trapHover) {
            this.setState({hoveredIndex: index});
        }
    };

    handleItemClick = option => () => {
        if (option.disabled) {
            return;
        }

        const {broadcastFullOption, onItemClick, valueKey} = this.props;

        const value = broadcastFullOption ? option : option[valueKey];
        if (typeof onItemClick === 'function') {
            onItemClick(value);
        }
    };

    handleKeyPressed = event => {
        const currentIndex = this.state.hoveredIndex;
        if (event.key === 'ArrowUp') {
            const newIndex = Math.max(0, currentIndex - 1);

            this.setState({hoveredIndex: newIndex, trapHover: true});
            event.preventDefault();
        } else if (event.key === 'ArrowDown') {
            const newIndex = Math.min(this.props.items.length - 1, currentIndex + 1);

            this.setState({hoveredIndex: newIndex, trapHover: true});
            event.preventDefault();
        } else if (event.key === 'Enter') {
            if (currentIndex == null) {
                return;
            }
            this.handleItemClick(this.props.items[currentIndex])();
            event.preventDefault();
        }
    };

    isOptionSelected = option => {
        const {selectedLabel, labelKey, valueKey, values = []} = this.props;
        if (is_set(selectedLabel)) {
            return selectedLabel && selectedLabel === option[labelKey];
        }

        if (is_set(values, true)) {
            return values.includes(option[valueKey]);
        }

        return false;
    };

    render() {
        const {items, keyKey, valueKey, labelKey, subLabelKey, iconKey, iconType} = this.props;
        return (
            <div onMouseMove={this.handleMouseMove}>
                {items.map((option, index) => (
                    <FocusedDropdownOption
                        index={index}
                        onMouseOver={() => this.handleMouseOver(index)}
                        isHovered={index == this.state.hoveredIndex}
                        scrollIntoView={this.state.trapHover}
                        key={option[keyKey] || option[valueKey] || option[labelKey]}
                        onClick={this.handleItemClick(option)}
                        isSelected={this.isOptionSelected(option)}
                        muted={option.muted || option.disabled}
                    >
                        {iconKey &&
                            (iconType ? (
                                <Icon mr={2} name={option[iconKey]} {...{[iconType]: true}} />
                            ) : (
                                <Icon mr={2} name={option[iconKey]} />
                            ))}
                        {option[labelKey]}
                        <Right>
                            <SubLabel>{option[subLabelKey]}</SubLabel>
                            {option.iconRight}
                        </Right>
                    </FocusedDropdownOption>
                ))}
            </div>
        );
    }
}

export function optionArrayType(props, propName, componentName, ...rest) {
    const defaultProps = List.defaultProps;

    return PropTypes.arrayOf(
        PropTypes.shape({
            [props['keyKey'] || defaultProps.keyKey]: PropTypes.any,
            [props['valueKey'] || defaultProps.valueKey]: PropTypes.any,
            [props['labelKey'] || defaultProps.labelKey]: PropTypes.any,
            [props['subLabelKey'] || defaultProps.subLabelKey]: PropTypes.any,
        }),
    )(props, propName, componentName, ...rest);
}
