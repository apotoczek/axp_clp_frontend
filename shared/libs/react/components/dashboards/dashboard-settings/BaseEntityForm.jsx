import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {Flex, Box} from '@rebass/grid';

import ExtraPropTypes from 'utils/extra-prop-types';

import FilterableDropdownList from 'components/basic/forms/dropdowns/FilterableDropdownList';

export default class BaseEntityForm extends Component {
    static propTypes = {
        baseEntities: PropTypes.arrayOf(ExtraPropTypes.uuid),
        vehicles: PropTypes.objectOf(
            PropTypes.shape({
                entity_uid: PropTypes.string.isRequired,
                entity_type: PropTypes.string.isRequired,
                entity_name: PropTypes.string,
            }),
        ).isRequired,
        enableAddEntity: PropTypes.bool,

        onAddEntity: PropTypes.func.isRequired,
        onChangeEntity: PropTypes.func.isRequired,
        onRemoveEntity: PropTypes.func.isRequired,
    };

    state = {
        selectedEntity: null,
    };

    onChangeEntity = oldEntityUuid => newEntityUuid => {
        this.props.onChangeEntity(oldEntityUuid, newEntityUuid);
    };

    newVehicleOptions = () =>
        Object.values(this.props.vehicles).filter(
            entity => !this.props.baseEntities.includes(entity.entity_uid),
        );

    changeVehicleOptions = selectedVehicle =>
        this.newVehicleOptions().filter(
            entity =>
                entity.entity_type === selectedVehicle.entity_type &&
                entity.cashflow_type === selectedVehicle.cashflow_type,
        );

    render() {
        return (
            <Flex flexWrap='wrap'>
                <Box flex='0 0 100%'>
                    {this.props.baseEntities
                        .filter(uuid => uuid in this.props.vehicles)
                        .map(uuid => (
                            <FilterableDropdownList
                                leftIcon='remove'
                                leftGlyphicon
                                leftOnClick={() => this.props.onRemoveEntity(uuid)}
                                key={uuid}
                                onValueChanged={this.onChangeEntity(uuid)}
                                options={this.changeVehicleOptions(this.props.vehicles[uuid])}
                                keyKey='entity_uid'
                                valueKey='entity_uid'
                                labelKey='entity_name'
                                subLabelKey='description'
                                manualValue={this.props.vehicles[uuid].entity_name || 'N/A'}
                                mb={1}
                            />
                        ))}
                </Box>
                {this.props.enableAddEntity && (
                    <FilterableDropdownList
                        flex={1}
                        mt={2}
                        onValueChanged={this.props.onAddEntity}
                        options={this.newVehicleOptions()}
                        keyKey='entity_uid'
                        valueKey='entity_uid'
                        labelKey='entity_name'
                        subLabelKey='description'
                        label='Add entity'
                    />
                )}
            </Flex>
        );
    }
}
