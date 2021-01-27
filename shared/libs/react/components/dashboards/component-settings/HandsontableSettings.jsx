import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {Flex} from '@rebass/grid';

import {SectionTitle, SectionSubTitle} from 'components/dashboards/component-settings/base';
import Checkbox from 'components/basic/forms/Checkbox';

import {
    DataValueForm,
    DateForm,
    VariableList,
} from 'components/dashboards/component-settings/variables';

import BaseSpecHandler from 'component-spec-handlers/base-spec-handler';

const validVariableName = value => {
    // Transform provided variable name to the format Handsontable accepts
    // as variable names:
    //   - No leading digits
    //   - Uppercase only
    //   - No arithmetic characters
    //   - Alphanumeric and underscores only
    //     (expand this if Handsontable allows other variable names)
    //
    // Returns an object {
    //    changed:  <whether the value was changed>
    //    newValue: <the requested new value of the variable>
    //  }
    const cellRefReg = /^[A-Z]+\d+$/;
    const varNameIsCellRef = cellRefReg.test(value.toUpperCase());

    const newValue = value.replace(/^\d+|[^A-z\d_]/, '').toUpperCase();
    return newValue == value && !varNameIsCellRef;
};

const States = {
    LIST: 1,
    DATE_VALUE: 2,
    DATA_VALUE: 3,
};

class HandsontableSettings extends Component {
    static propTypes = {
        onSettingsChanged: PropTypes.func.isRequired,
        provider: PropTypes.object.isRequired,
    };

    state = {
        menuState: States.LIST,
        valueId: null,
    };

    changeTableSetting = payload =>
        this.props.onSettingsChanged(BaseSpecHandler.changeSettings, payload);

    resetState = () =>
        this.setState({
            menuState: States.LIST,
            valueId: null,
        });

    handleEditVariable = valueId => {
        if (this.props.provider.isDateVariable(valueId)) {
            this.setState({valueId, menuState: States.DATE_VALUE});
        } else {
            this.setState({valueId, menuState: States.DATA_VALUE});
        }
    };

    getInitialState = () => {
        const {valueId} = this.state;
        if (!valueId) {
            return {};
        }

        if (this.props.provider.isDateVariable(valueId)) {
            const {format, date, name} = this.props.provider.getDateVariable(valueId);
            return {
                initialName: name,
                initialFormat: format,
                initialDate: date,
                initialValueId: valueId,
                key: valueId,
            };
        }
        const {entity, valueKey, params, name} = this.props.provider.getDataVariable(valueId);
        return {
            initialEntity: entity,
            initialValueKey: valueKey,
            initialParams: params,
            initialName: name,
            initialValueId: valueId,
            key: valueId,
        };
    };

    render() {
        const {menuState} = this.state;
        const initialState = this.getInitialState();

        return (
            <Flex p={3} flexWrap='wrap' flexDirection='column'>
                <Flex flexDirection='column' mb={4}>
                    <SectionTitle>Table Settings</SectionTitle>
                    <SectionSubTitle noTopMargin>Table Styles</SectionSubTitle>
                    <Checkbox
                        leftLabel='Gridlines'
                        checked={this.props.provider.settingsValueForComponent(['gridLines'], true)}
                        onValueChanged={gridLines => this.changeTableSetting({gridLines})}
                        mb={1}
                    />
                </Flex>

                <SectionTitle>Variable Setup</SectionTitle>
                <Flex justifyContent='center'>
                    {menuState === States.DATE_VALUE && (
                        <DateForm
                            provider={this.props.provider}
                            onSettingsChanged={this.props.onSettingsChanged}
                            onSubmit={this.resetState}
                            onCancel={this.resetState}
                            onDelete={this.resetState}
                            customNameValidator={validVariableName}
                            {...initialState}
                        />
                    )}
                    {menuState === States.DATA_VALUE && (
                        <DataValueForm
                            provider={this.props.provider}
                            onSettingsChanged={this.props.onSettingsChanged}
                            onSubmit={this.resetState}
                            onCancel={this.resetState}
                            onDelete={this.resetState}
                            customNameValidator={validVariableName}
                            {...initialState}
                        />
                    )}
                    {menuState === States.LIST && (
                        <VariableList
                            provider={this.props.provider}
                            onSettingsChanged={this.props.onSettingsChanged}
                            onAddDataVariable={() => this.setState({menuState: States.DATA_VALUE})}
                            onAddDateVariable={() => this.setState({menuState: States.DATE_VALUE})}
                            onEditVariable={this.handleEditVariable}
                            valueGetter={this.props.componentProvider.variableValue}
                        />
                    )}
                </Flex>
            </Flex>
        );
    }
}

export default HandsontableSettings;
