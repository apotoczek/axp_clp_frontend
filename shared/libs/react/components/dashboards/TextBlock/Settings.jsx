import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {Flex} from '@rebass/grid';

import {
    DataValueForm,
    DateForm,
    VariableList,
} from 'components/dashboards/component-settings/variables';

const States = {
    LIST: 1,
    DATE_VALUE: 2,
    DATA_VALUE: 3,
};

export default class TextBlockSettings extends Component {
    static propTypes = {
        onSettingsChanged: PropTypes.func.isRequired,
        provider: PropTypes.object.isRequired,
    };

    state = {
        menuState: States.LIST,
        valueId: null,
    };

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
            <Flex flexDirection='column'>
                <Flex flex='1' justifyContent='center' mb={3}>
                    {menuState === States.DATE_VALUE && (
                        <DateForm
                            provider={this.props.provider}
                            onSettingsChanged={this.props.onSettingsChanged}
                            onSubmit={this.resetState}
                            onCancel={this.resetState}
                            onDelete={this.resetState}
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
                            valueGetter={this.props.componentProvider.getMapping}
                        />
                    )}
                </Flex>
            </Flex>
        );
    }
}
