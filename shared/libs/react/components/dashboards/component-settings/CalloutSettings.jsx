import React, {Component} from 'react';
import PropTypes from 'prop-types';

import ColorPickerDropdown from 'components/basic/forms/dropdowns/ColorPickerDropdown';
import NumberInput from 'components/basic/forms/input/NumberInput';
import FilterableDropdownList from 'components/basic/forms/dropdowns/FilterableDropdownList';
import Checkbox from 'components/basic/forms/Checkbox';
import TextInput from 'components/basic/forms/input/TextInput';
import {Section, SectionTitle} from 'components/dashboards/component-settings/base';

import {Flex} from '@rebass/grid';
import DropdownList from 'components/basic/forms/dropdowns/DropdownList';
import ValueSelector from 'components/dashboards/component-settings/ValueSelector';

class CalloutSettings extends Component {
    static propTypes = {
        onValueChanged: PropTypes.func,
        onSettingsChanged: PropTypes.func.isRequired,
        provider: PropTypes.object.isRequired,
    };

    handleChange = type => payload => {
        const {onSettingsChanged} = this.props;
        onSettingsChanged(type, payload);
    };

    render() {
        const {provider} = this.props;
        const changeValue = this.handleChange('changeValue');
        const changeParameter = this.handleChange('changeParameter');
        const changeEntity = this.handleChange('changeEntity');
        const changeSettings = this.handleChange('changeSettings');

        const format = provider.getFormat();

        return (
            <Flex p={3} flexWrap='wrap'>
                <Flex width={[1, 1, 1, 0.5]} pr={[0, 0, 0, 1]} flexDirection='column'>
                    <Section>
                        <SectionTitle>Data Source</SectionTitle>
                        <FilterableDropdownList
                            label='Entity'
                            manualValue={provider.entityName()}
                            error={provider.entityError()}
                            options={provider.vehicleOptions()}
                            onValueChanged={uid =>
                                changeEntity({
                                    entity: provider.getVehicle(uid),
                                    valueId: provider.valueId(),
                                })
                            }
                            subLabelKey='description'
                            mb={1}
                        />
                        <ValueSelector
                            selectedValue={provider.getSelectedValue()}
                            valueOptions={provider.getValues()}
                            params={provider.getSelectedValueParams()}
                            onValueChanged={key =>
                                changeValue({key, valueId: provider.valueId(), type: 'base'})
                            }
                            onParameterChanged={payload =>
                                changeParameter({...payload, valueId: provider.valueId()})
                            }
                        />
                    </Section>
                </Flex>
                <Flex width={[1, 1, 1, 0.5]} pl={[0, 0, 0, 1]} flexDirection='column'>
                    <Section>
                        <SectionTitle>Styles</SectionTitle>
                        <ColorPickerDropdown
                            label='Label Color'
                            color={provider.settingsValueForComponent(['labelColor'])}
                            colors={provider.getCustomColors()}
                            onChange={labelColor => changeSettings({labelColor})}
                            mb={1}
                        />
                        <ColorPickerDropdown
                            label='Value Color'
                            color={provider.settingsValueForComponent(['valueColor'])}
                            colors={provider.getCustomColors()}
                            onChange={valueColor => changeSettings({valueColor})}
                            mb={1}
                        />
                        <NumberInput
                            leftLabel='Label font size'
                            value={provider.settingsValueForComponent(['labelSize'])}
                            placeholder='Type a number'
                            onValueChanged={labelSize => changeSettings({labelSize})}
                            mb={1}
                        />
                        <NumberInput
                            leftLabel='Value font size'
                            value={provider.settingsValueForComponent(['valueSize'])}
                            placeholder='Type a number'
                            onValueChanged={valueSize => changeSettings({valueSize})}
                            mb={3}
                        />
                        <SectionTitle>Formatting</SectionTitle>
                        <Flex mb={1}>
                            <DropdownList
                                leftLabel='Display Units'
                                value={provider.settingsValueForComponent(['displayUnits'])}
                                options={[
                                    {label: 'None', value: undefined},
                                    {label: 'Hundreds', value: 'hundreds'},
                                    {label: 'Thousands', value: 'thousands'},
                                    {label: 'Millions', value: 'millions'},
                                    {label: 'Billions', value: 'billions'},
                                    {label: 'Trillions', value: 'trillions'},
                                ]}
                                onValueChanged={value => changeSettings({displayUnits: value})}
                                mr={1}
                            />
                            <Checkbox
                                leftLabel='Show Unit'
                                checked={provider.settingsValueForComponent(['showUnit'], true)}
                                onValueChanged={value => changeSettings({showUnit: value})}
                            />
                        </Flex>
                        <NumberInput
                            leftLabel='Decimal Places'
                            min={0}
                            max={20}
                            placeholder='E.g. 0 (Default 2)'
                            value={provider.settingsValueForComponent(['decimalPlaces'])}
                            onValueChanged={value => changeSettings({decimalPlaces: value})}
                            mb={1}
                        />
                        {format === 'money' && (
                            <TextInput
                                leftLabel='Currency Symbol Override'
                                min={0}
                                placeholder='E.g. USD'
                                value={provider.settingsValueForComponent(['currencySymbol'])}
                                onValueChanged={value => changeSettings({currencySymbol: value})}
                                mb={1}
                            />
                        )}
                    </Section>
                </Flex>
            </Flex>
        );
    }
}

export default CalloutSettings;
