import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {Flex, Box} from '@rebass/grid';

import {ParamType, DateParamType} from 'src/libs/Enums';
import Button from 'components/basic/forms/Button';
import {is_set} from 'src/libs/Utils';
import FilterableDropdownList from 'components/basic/forms/dropdowns/FilterableDropdownList';
import Icon from 'components/basic/Icon';
import DataTable from 'components/basic/DataTable';
import TextInput from 'components/basic/forms/input/TextInput';
import ValueSelector from 'components/dashboards/component-settings/ValueSelector';
import DateSelector from 'components/dashboards/component-settings/DateSelector';

const DEFAULT_DATE_FORM = {
    name: null,
    date: {
        type: DateParamType.RELATIVE_GLOBAL,
    },
    format: '{M}/{d}/{yy}',
    valueId: null,
};

const DEFAULT_VALUE_FORM = {
    name: null,
    entity: {},
    valueKey: null,
    params: {},
    valueId: null,
};

export class DataValueForm extends Component {
    static propTypes = {
        onSettingsChanged: PropTypes.func.isRequired,
        provider: PropTypes.object.isRequired,
        customNameValidator: PropTypes.func,

        onSubmit: PropTypes.func.isRequired,
        onDelete: PropTypes.func.isRequired,
        onCancel: PropTypes.func.isRequired,

        initialName: PropTypes.string,
        initialEntity: PropTypes.object,
        initialValueKey: PropTypes.string,
        initialparams: PropTypes.object,
        initialValueId: PropTypes.string,
    };

    state = {
        form: {
            name: this.props.initialName || DEFAULT_VALUE_FORM.name,
            entity: this.props.initialEntity || DEFAULT_VALUE_FORM.entity,
            valueKey: this.props.initialValueKey || DEFAULT_VALUE_FORM.valueKey,
            params: this.props.initialParams || DEFAULT_VALUE_FORM.params,
            valueId: this.props.initialValueId || DEFAULT_VALUE_FORM.valueId,
        },
        errors: {},
    };

    handleSetFormName = name =>
        this.setState(state => ({
            form: {
                ...state.form,
                name,
            },
            errors: {
                ...state.errors,
                name: null,
            },
        }));

    handleSetFormEntity = entityUid => {
        const vehicle = this.props.provider.getVehicle(entityUid) || {};
        const formattedEntity = !is_set(vehicle, true)
            ? {}
            : {
                  uid: vehicle.entity_uid,
                  type: vehicle.entity_type.camelize(false),
                  cashflowType: vehicle.cashflow_type,
              };

        this.setState(state => ({
            form: {
                ...state.form,
                entity: formattedEntity,
            },
            errors: {
                ...state.errors,
                entity: null,
            },
        }));
    };

    handleSetFormValue = valueKey => {
        const params = this.props.provider.valueMapEntry(valueKey).params;
        const defaultParams = {};

        if (params) {
            for (const [paramKey, param] of Object.entries(params)) {
                if (!param.defaultOption) {
                    continue;
                }
                let defaultValue = param.defaultOption;
                if (param.type === ParamType.SINGLE_SELECTION) {
                    defaultValue = defaultValue.toString();
                }
                defaultParams[paramKey] = defaultValue;
            }
        }
        this.setState(state => ({
            form: {
                ...state.form,
                params: defaultParams,
                valueKey,
            },
        }));
    };

    handleSetFormParams = ({key, value}) => {
        this.setState(prevState => ({
            form: {
                ...prevState.form,
                params: {
                    ...prevState.form.params,
                    [key]: value,
                },
            },
        }));
    };

    handleSubmitValueVariable = () => {
        const {
            form: {name, entity, valueKey, valueId},
        } = this.state;
        const valueIdForName = this.props.provider.valueIdForName(name);
        const {customNameValidator} = this.props;
        const errors = {};

        if (!name) {
            errors.name = 'Required Field';
        } else if (valueIdForName && valueIdForName != valueId) {
            errors.name = 'Variable name already exists';
        } else if (customNameValidator && !customNameValidator(name)) {
            errors.name = 'Invalid variable name';
        }

        if (!is_set(entity, true)) {
            errors.entity = 'Required field';
        }

        if (!is_set(valueKey)) {
            errors.valueKey = 'Required field';
        }

        if (is_set(errors, true)) {
            this.setState({errors});
            return;
        }

        this.props.onSettingsChanged('createVariable', {...this.state.form});
        this.props.onSubmit();
    };

    handleDeleteVariable = valueId => {
        this.props.onSettingsChanged('deleteVariables', {valueIds: [valueId]});
        this.props.onDelete();
    };

    render() {
        const {provider} = this.props;
        const {
            form: {name, entity, valueKey, params, valueId},
            errors,
        } = this.state;
        return (
            <Flex my={3} width={0.6} flexDirection='column' px={4}>
                <Flex justifyContent='space-between' mb={1}>
                    <Box width={1 / 3}>
                        <TextInput
                            placeholder='Variable name'
                            leftLabel='Name'
                            value={name}
                            onValueChanged={this.handleSetFormName}
                            error={errors.name}
                        />
                    </Box>
                    <Box width={1 / 3}>
                        <TextInput leftLabel='Variable' value={name && `{{${name}}}`} disabled />
                    </Box>
                </Flex>
                <FilterableDropdownList
                    label='Entity'
                    manualValue={provider.getVehicleName(entity.uid)}
                    options={provider.vehicleOptions()}
                    onValueChanged={this.handleSetFormEntity}
                    error={errors.entity || provider.getVehicleError(entity.uid)}
                    subLabelKey='description'
                    mb={1}
                />
                <ValueSelector
                    selectedValue={provider.getValueLabel(valueKey)}
                    valueOptions={provider.getValuesForEntity(entity, params)}
                    params={provider.getParams(entity, valueKey, params)}
                    onValueChanged={this.handleSetFormValue}
                    onParameterChanged={this.handleSetFormParams}
                    error={errors.valueKey}
                />
                <Flex justifyContent='flex-end' mt={2} mb={4}>
                    <Button mr={2} onClick={this.props.onCancel}>
                        Cancel
                    </Button>
                    {valueId && (
                        <Button danger mr={2} onClick={() => this.handleDeleteVariable(valueId)}>
                            Delete
                        </Button>
                    )}
                    <Button primary onClick={this.handleSubmitValueVariable}>
                        {valueId ? 'Update' : 'Create'}
                    </Button>
                </Flex>
            </Flex>
        );
    }
}

export class DateForm extends Component {
    static propTypes = {
        onSettingsChanged: PropTypes.func.isRequired,
        provider: PropTypes.object.isRequired,
        customNameValidator: PropTypes.func,

        onSubmit: PropTypes.func.isRequired,
        onDelete: PropTypes.func.isRequired,
        onCancel: PropTypes.func.isRequired,

        initialName: PropTypes.string,
        initialDate: PropTypes.object,
        initialFormat: PropTypes.string,
        initialValueId: PropTypes.string,
    };

    state = {
        form: {
            name: this.props.initialName || DEFAULT_DATE_FORM.name,
            date: this.props.initialDate || DEFAULT_DATE_FORM.date,
            format: this.props.initialFormat || DEFAULT_DATE_FORM.format,
            valueId: this.props.initialValueId || DEFAULT_DATE_FORM.valueId,
        },
        errors: {},
    };

    handleSetFormValue = key => value =>
        this.setState(state => ({
            form: {
                ...state.form,
                [key]: value,
            },
            errors: {
                ...state.errors,
                [key]: null,
            },
        }));

    handleDeleteVariable = valueId => {
        this.props.onSettingsChanged('deleteVariables', {valueIds: [valueId]});
        this.props.onDelete();
    };

    handleSubmitDateVariable = () => {
        const {
            form: {name, format, date, valueId},
        } = this.state;
        const {customNameValidator} = this.props;
        const valueIdForName = this.props.provider.valueIdForName(name);
        const errors = {};

        if (!name) {
            errors.name = 'Required Field';
        } else if (valueIdForName && valueIdForName != valueId) {
            errors.name = 'Variable name already exists';
        } else if (customNameValidator && !customNameValidator(name)) {
            errors.name = 'Invalid variable name';
        }

        if (!is_set(format, true)) {
            errors.format = 'Required field';
        }

        if (!is_set(date, true)) {
            errors.date = 'Required field';
        }

        if (is_set(errors, true)) {
            this.setState({errors});
            return;
        }

        this.props.onSettingsChanged('createDateVariable', {...this.state.form});
        this.props.onSubmit();
    };

    render() {
        const {
            form: {name, date, format, valueId},
            errors,
        } = this.state;
        const {provider} = this.props;
        return (
            <Flex my={3} width={0.6} flexDirection='column' px={4}>
                <Flex justifyContent='space-between' mb={2}>
                    <Box width={1 / 3}>
                        <TextInput
                            placeholder='Variable name'
                            leftLabel='Name'
                            value={name}
                            onValueChanged={this.handleSetFormValue('name')}
                            error={errors.name}
                        />
                    </Box>
                    <Box width={1 / 3}>
                        <TextInput leftLabel='Variable' value={name && `{{${name}}}`} disabled />
                    </Box>
                </Flex>
                <DateSelector
                    formattedValue={provider.formattedDate(date, format)}
                    date={date}
                    timestamp={provider.dateTimestamp(date)}
                    onDateValueChanged={this.handleSetFormValue('date')}
                    onFormatChanged={this.handleSetFormValue('format')}
                    formatError={errors.format}
                />
                <Flex mt={2} mb={4} justifyContent='flex-end'>
                    <Button mr={2} onClick={this.props.onCancel}>
                        Cancel
                    </Button>
                    {valueId && (
                        <Button danger mr={2} onClick={() => this.handleDeleteVariable(valueId)}>
                            Delete
                        </Button>
                    )}
                    <Button primary onClick={this.handleSubmitDateVariable}>
                        {valueId ? 'Update' : 'Create'}
                    </Button>
                </Flex>
            </Flex>
        );
    }
}

export class VariableList extends Component {
    state = {
        searchString: '',
        selectedVariables: [],
    };

    handleDeleteSelected = () => {
        this.props.onSettingsChanged('deleteVariables', {valueIds: this.state.selectedVariables});
        this.setState({selectedVariables: []});
    };

    render() {
        const {searchString} = this.state;
        return (
            <Flex width={0.6} flexDirection='column'>
                <Flex mt={4} mb={2} justifyContent='space-between'>
                    <Box width={350}>
                        <TextInput
                            leftGlyphicon
                            leftIcon='search'
                            placeholder='Search Variables'
                            value={searchString}
                            onValueChanged={value => this.setState({searchString: value})}
                        />
                    </Box>
                    <Flex justifyContent='flex-end'>
                        <Box>
                            <Button onClick={this.props.onAddDataVariable}>+ Value Variable</Button>
                        </Box>
                        <Box mx={2}>
                            <Button onClick={this.props.onAddDateVariable}>+ Date Variable</Button>
                        </Box>
                        <Box>
                            <Button
                                danger
                                disabled={!is_set(this.state.selectedVariables, true)}
                                onClick={this.handleDeleteSelected}
                            >
                                Delete Selected
                            </Button>
                        </Box>
                    </Flex>
                </Flex>
                <DataTable
                    pushHeight
                    enablePagination
                    enableSelection
                    enableContextHeader
                    label='Variables'
                    resultsPerPage={10}
                    rowsAreFiltered={is_set(searchString, true)}
                    onSelectionChanged={selectedVariables => this.setState({selectedVariables})}
                    selection={this.state.selectedVariables}
                    columns={[
                        {
                            key: 'name',
                            label: 'Name',
                        },
                        {
                            key: 'type',
                            label: 'Type',
                        },
                        {
                            key: 'variable',
                            label: 'Variable',
                        },
                        {
                            key: 'formattedValue',
                            label: 'Value',
                            disableSort: true,
                        },
                        {
                            key: 'valueId',
                            label: 'Edit',
                            disableSort: true,
                            cellRenderer: ({cellData: valueId}) => (
                                <Icon
                                    button
                                    glyphicon
                                    name='pencil'
                                    onClick={() => this.props.onEditVariable(valueId)}
                                />
                            ),
                        },
                    ]}
                    rowKey='valueId'
                    rows={this.props.provider.filterMapVariables(
                        searchString,
                        this.props.valueGetter,
                    )}
                />
            </Flex>
        );
    }
}
