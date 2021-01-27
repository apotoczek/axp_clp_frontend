import React, {Component} from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import {Flex} from '@rebass/grid';

import FilterableDropdownList from 'components/basic/forms/dropdowns/FilterableDropdownList';
import Checkbox from 'components/basic/forms/Checkbox';
import {ParamType} from 'src/libs/Enums';
import Icon from 'components/basic/Icon';

import DropdownList from 'components/basic/forms/dropdowns/DropdownList';
import DateParameter from 'components/dashboards/component-settings/DateParameter';
import {is_set} from 'src/libs/Utils';

const ParameterComponentWrapper = styled.div`
    clear: both;
    margin-top: 4px;
`;

const Wrapper = styled.div`
    width: 100%;
    overflow: hidden;
`;

const StyledCollapsor = styled(Flex)`
    background: ${({theme}) => theme.dashboard.settings.collapsible.headerBg};
    border: 1px solid ${({theme}) => theme.dashboard.settings.collapsible.border};
    border-bottom: none;
    border-radius: 3px;
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
    cursor: pointer;
    font-size: 16px;
    color: ${({theme}) => theme.dashboard.settings.collapsible.fg};
`;

const ParamsWrapper = styled.div`
    padding: ${props => props.open && 8}px;
    background: ${({theme}) => theme.dashboard.settings.collapsible.bg};
    border: 1px solid ${({theme}) => theme.dashboard.settings.collapsible.border};
    border-top: none;

    border-radius: 3px;
    border-top-left-radius: 0;
    border-top-right-radius: 0;
`;

const Collapsed = ({open, onToggle}) => (
    <StyledCollapsor alignItems='center' onClick={onToggle} mt={3} p={2}>
        <Icon name={open ? 'angle-down' : 'angle-right'} />
        Parameters
    </StyledCollapsor>
);
const SingleSelectionParameter = ({options, label, formattedValue, onValueChanged}) => {
    if (Object.values(options).length > 10) {
        return (
            <FilterableDropdownList
                label={label}
                options={options}
                manualValue={formattedValue}
                onValueChanged={onValueChanged}
            />
        );
    }

    return (
        <DropdownList
            label={label}
            options={options}
            manualValue={formattedValue}
            onValueChanged={onValueChanged}
        />
    );
};

function ToggleParameter({value, onValueChanged, label}) {
    return <Checkbox label={label} checked={value} onValueChanged={onValueChanged} />;
}

SingleSelectionParameter.propTypes = {
    options: PropTypes.array.isRequired,
    label: PropTypes.string.isRequired,
    value: PropTypes.string,
    placeholder: PropTypes.string,
    onValueChanged: PropTypes.func.isRequired,
};

class ValueSelector extends Component {
    static propTypes = {
        selectedValue: PropTypes.string,
        valueOptions: PropTypes.array.isRequired,
        params: PropTypes.object,

        onValueChanged: PropTypes.func.isRequired,
        onParameterChanged: PropTypes.func.isRequired,
    };

    static defaultProps = {
        params: {},
    };

    state = {
        hideParams: true,
    };

    handleParameterChanged = key => value => {
        const {onParameterChanged} = this.props;
        onParameterChanged({key, value});
    };

    toggleHideParams = () => {
        this.setState(prevState => ({
            hideParams: !prevState.hideParams,
        }));
    };

    renderParameter = ({key, type, globalParams, ...parameter}) => {
        let ParameterComponent;
        switch (type) {
            case ParamType.SINGLE_SELECTION:
                ParameterComponent = SingleSelectionParameter;
                break;
            case ParamType.DATE_SELECTION:
                ParameterComponent = DateParameter;
                break;
            case ParamType.TOGGLE:
                ParameterComponent = ToggleParameter;
                break;
        }

        return (
            <ParameterComponentWrapper key={key}>
                {ParameterComponent ? (
                    <ParameterComponent
                        {...parameter}
                        onValueChanged={this.handleParameterChanged(key)}
                        globalParams={globalParams}
                    />
                ) : null}
            </ParameterComponentWrapper>
        );
    };

    render() {
        const {
            selectedValue,
            valueOptions,
            params = {},
            onValueChanged,
            className,
            globalParams = {},
            error,
        } = this.props;

        const {hideParams} = this.state;

        return (
            <Wrapper className={className}>
                <FilterableDropdownList
                    label='Value'
                    manualValue={selectedValue}
                    options={valueOptions}
                    onValueChanged={onValueChanged}
                    error={error}
                />
                {is_set(params, true) && (
                    <>
                        <Collapsed open={!hideParams} onToggle={this.toggleHideParams} />
                        <ParamsWrapper open={!hideParams}>
                            {!this.state.hideParams &&
                                Object.entries(params).map(([key, param]) =>
                                    this.renderParameter({...param, key, globalParams}),
                                )}
                        </ParamsWrapper>
                    </>
                )}
            </Wrapper>
        );
    }
}

export default ValueSelector;
