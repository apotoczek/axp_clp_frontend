import React from 'react';
import styled from 'styled-components';

import {
    Column,
    Section,
    SectionTitle,
    SectionSubTitle,
    ChartSettings,
} from 'components/dashboards/component-settings/base';

import ValueSelector from 'components/dashboards/component-settings/ValueSelector';
import TextInput from 'components/basic/forms/input/TextInput';

import Button from 'components/basic/forms/Button';
import Icon from 'components/basic/Icon';

import FilterableDropdownList from 'components/basic/forms/dropdowns/FilterableDropdownList';
import Checkbox from 'components/basic/forms/Checkbox';
import ColorPickerDropdown from 'components/basic/forms/dropdowns/ColorPickerDropdown';

const NewButton = styled(Button)`
    display: inline-block;
    margin-top: 15px;
`;

class WaterfallChartSettings extends React.Component {
    handleChange = type => value => {
        this.props.onSettingsChanged(type, value);
    };

    renderBarOptions = value => {
        const {provider} = this.props;
        const {valueId, valueLabel, entityLabel, entityError, params} = value;

        const changeEntity = this.handleChange('changeEntity');
        const changeValue = this.handleChange('changeValue');
        const removeValue = this.handleChange('removeValue');
        const changeParameter = this.handleChange('changeParameter');
        const negateValue = this.handleChange('negateValue');
        const xLabel = this.handleChange('xLabel');
        const valueSettings = provider.settingsForValueId(valueId);

        return (
            <div style={{marginBottom: '10px'}} key={valueId}>
                <Column pct={94}>
                    <FilterableDropdownList
                        label='Entity'
                        manualValue={entityLabel}
                        error={entityError}
                        options={provider.vehicleOptions()}
                        onValueChanged={uid =>
                            changeEntity({
                                entity: provider.getVehicle(uid),
                                valueId,
                            })
                        }
                        subLabelKey='description'
                    />
                </Column>
                <Column pct={6} last>
                    <Button onClick={() => removeValue({valueId})}>
                        <Icon name='trash' />
                    </Button>
                </Column>
                <Column pct={100} last>
                    <ValueSelector
                        selectedValue={valueLabel}
                        valueOptions={provider.optionsForValueId(valueId)}
                        onValueChanged={key => changeValue({valueId, key})}
                        params={params}
                        onParameterChanged={payload => changeParameter({valueId, ...payload})}
                    />
                </Column>
                <Column>
                    <Checkbox
                        label='Negate value'
                        checked={valueSettings.valueNegation || false}
                        onValueChanged={value => negateValue({valueId, negate: value})}
                    />
                </Column>
                <Column last>
                    <TextInput
                        leftLabel='Label'
                        onValueChanged={value => xLabel({valueId, label: value})}
                        value={value.xLabel}
                    />
                </Column>
            </div>
        );
    };

    render() {
        const {provider} = this.props;
        const settings = provider.settings;

        const onSettingsChanged = this.handleChange('changeSettings');
        const style = {
            marginBottom: '10px',
        };

        return (
            <Section>
                <Column>
                    <SectionTitle>Values & Entities</SectionTitle>
                    <SectionSubTitle>Base Datasource</SectionSubTitle>
                    {provider.values().map(this.renderBarOptions)}
                    <NewButton onClick={() => this.props.onSettingsChanged('addValue', {})}>
                        <Icon name='plus' />
                        Add value
                    </NewButton>
                </Column>
                <Column>
                    <Section>
                        <SectionTitle>Settings</SectionTitle>
                        <ChartSettings
                            settings={settings}
                            onChangeSetting={onSettingsChanged}
                            style={style}
                        />
                        <SectionSubTitle>Bars</SectionSubTitle>
                        <Column>
                            <Checkbox
                                label='Show Total'
                                checked={settings.showTotal || false}
                                onValueChanged={value => onSettingsChanged({showTotal: value})}
                            />
                        </Column>
                        <Column last>
                            <TextInput
                                leftLabel='Total Label'
                                onValueChanged={value => onSettingsChanged({totalLabel: value})}
                                value={settings.totalLabel}
                            />
                        </Column>
                        <SectionSubTitle>Colors</SectionSubTitle>
                        <Column>
                            <ColorPickerDropdown
                                label='Base Color'
                                color={settings.negColor}
                                colors={provider.getCustomColors()}
                                onChange={color => onSettingsChanged({negColor: color})}
                                style={style}
                            />
                        </Column>
                        <Column last>
                            <ColorPickerDropdown
                                label='Color of Positive'
                                color={settings.posColor}
                                colors={provider.getCustomColors()}
                                onChange={color => onSettingsChanged({posColor: color})}
                                style={style}
                            />
                        </Column>
                        <Column>
                            <ColorPickerDropdown
                                label='Color of Total'
                                color={settings.totalColor}
                                colors={provider.getCustomColors()}
                                onChange={color => onSettingsChanged({totalColor: color})}
                            />
                        </Column>
                    </Section>
                </Column>
            </Section>
        );
    }
}

export default WaterfallChartSettings;
