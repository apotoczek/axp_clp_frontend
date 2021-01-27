import React from 'react';
import {Flex, Box} from '@rebass/grid';

import {SectionTitle} from 'components/dashboards/component-settings/base';
import LegendSettings from 'components/dashboards/component-settings/LegendSettings';

import TextInput from 'components/basic/forms/input/TextInput';
import ChecklistDropdown from 'components/basic/forms/dropdowns/ChecklistDropdown';
import Checkbox from 'components/basic/forms/Checkbox';

import BaseSpecHandler from 'component-spec-handlers/base-spec-handler';
import BarChartSpecHandler from 'component-spec-handlers/bar-chart-spec-handler';

import ValueSettings from './ValueSettings';
import {LabelSettings, DataPointsLabelSettings} from './label-settings';

export default class BarChartSettings extends React.Component {
    changeTitle = title => this.props.onSettingsChanged(BaseSpecHandler.changeSettings, {title});

    changeStacked = stacked =>
        this.props.onSettingsChanged(BaseSpecHandler.changeSettings, {stacked});

    changeLegendSetting = payload =>
        this.props.onSettingsChanged(BarChartSpecHandler.changeLegendSetting, {payload});

    changeHorizontal = horizontalBars =>
        this.props.onSettingsChanged(BaseSpecHandler.changeSettings, {horizontalBars});

    changeAxisEnableDataLabels = axisName => value =>
        this.props.onSettingsChanged(BarChartSpecHandler.changeAxisLabelSetting, {
            axisName,
            payload: {key: 'enableDataLabels', value},
        });

    changeTickRotation = axisName => value =>
        this.props.onSettingsChanged(BarChartSpecHandler.changeAxisLabelSetting, {
            axisName,
            payload: {key: 'tickRotation', value},
        });

    changeAxisLabelSetting = axisName => payload =>
        this.props.onSettingsChanged(BarChartSpecHandler.changeAxisLabelSetting, {
            axisName,
            payload,
        });

    changeAxisCustomDataInterval = axisName => payload =>
        this.props.onSettingsChanged(BarChartSpecHandler.changeAxisCustomDataInterval, {
            axisName,
            payload,
        });

    addNewValue = payload => this.props.onSettingsChanged(BarChartSpecHandler.addValue, payload);

    changeDisabledOption = optionName => {
        const disabledOptions = this.props.provider.disabledOptionValues();
        const disabled = disabledOptions.indexOf(optionName) === -1;

        this.props.onSettingsChanged(BarChartSpecHandler.changeDisabledOption, {
            optionName,
            payload: disabled,
        });
    };

    removeValue = valueId => () =>
        this.props.onSettingsChanged(BaseSpecHandler.removeValue, {valueId});

    duplicateValue = valueId => () =>
        this.props.onSettingsChanged(BarChartSpecHandler.duplicateValue, {valueId});

    changeValueLabel = valueId => name =>
        this.props.onSettingsChanged(BaseSpecHandler.changeValueSettings, {valueId, name});

    changeValueColor = valueId => color =>
        this.props.onSettingsChanged(BaseSpecHandler.changeValueSettings, {valueId, color});

    changeValueParameter = valueId => payload =>
        this.props.onSettingsChanged(BaseSpecHandler.changeValueParameter, {valueId, payload});

    changeValueEntity = valueId => payload =>
        this.props.onSettingsChanged(BaseSpecHandler.changeValueEntity, {valueId, payload});

    changeValueKey = valueId => key =>
        this.props.onSettingsChanged(BaseSpecHandler.changeValue, {valueId, key});

    changeValueOrder = valueId => payload =>
        this.props.onSettingsChanged(BarChartSpecHandler.changeValueOrder, {valueId, payload});

    render() {
        return (
            <Flex p={3} flexWrap='wrap'>
                <Flex width={[1, 1, 1, 0.5]} pr={[0, 0, 0, 1]} flexDirection='column'>
                    <SectionTitle>Values</SectionTitle>
                    <ValueSettings
                        provider={this.props.provider}
                        onAddValue={this.addNewValue}
                        onValueRemoved={this.removeValue}
                        onValueDuplicated={this.duplicateValue}
                        onValueOrderChanged={this.changeValueOrder}
                        onParameterChanged={this.changeValueParameter}
                        onLabelChanged={this.changeValueLabel}
                        onColorChanged={this.changeValueColor}
                        onEntityChanged={this.changeValueEntity}
                        onValueKeyChanged={this.changeValueKey}
                    />
                </Flex>
                <Flex width={[1, 1, 1, 0.5]} pl={[0, 0, 0, 1]} flexDirection='column'>
                    <Box mb={3}>
                        <SectionTitle>General</SectionTitle>
                        <TextInput
                            leftLabel='Chart Title'
                            value={this.props.provider.settingsValueForComponent(['title'])}
                            onValueChanged={this.changeTitle}
                            mb={1}
                            placeholder='E.g. IRR for the Fiscal Year'
                        />
                        <ChecklistDropdown
                            label='Disable'
                            onValueChanged={this.changeDisabledOption}
                            options={[
                                {label: 'Title', value: 'title'},
                                {label: 'Grid', value: 'grid'},
                            ]}
                            values={this.props.provider.disabledOptionValues()}
                            placeholder='E.g. Title'
                            mb={1}
                        />
                        <Checkbox
                            checked={this.props.provider.settingsValueForComponent(
                                ['horizontalBars'],
                                false,
                            )}
                            leftLabel='Horizontal Bars'
                            onValueChanged={this.changeHorizontal}
                            mb={1}
                        />
                        <Checkbox
                            leftLabel='Stack Values Within Groups'
                            checked={this.props.provider.settingsValueForComponent(
                                ['stacked'],
                                false,
                            )}
                            onValueChanged={this.changeStacked}
                            mb={1}
                        />
                        <LegendSettings
                            provider={this.props.provider}
                            onLegendSettingChanged={this.changeLegendSetting}
                        />
                    </Box>
                    <Flex flexDirection='column'>
                        <SectionTitle>Chart Labels</SectionTitle>
                        <LabelSettings
                            title='X-Axis'
                            axisName='xAxis'
                            provider={this.props.provider}
                            onLabelSettingChanged={this.changeAxisLabelSetting('xAxis')}
                            onCustomDataIntervalChanged={this.changeAxisCustomDataInterval('xAxis')}
                            onEnableDataLabelsChanged={this.changeAxisEnableDataLabels('xAxis')}
                            onTickRotationChanged={this.changeTickRotation('xAxis')}
                            noCustomDataInterval
                            noDisplayUnits
                        />
                        <LabelSettings
                            title={oneLine`
                                ${
                                    this.props.provider.settingsValueForComponent([
                                        'horizontalBars',
                                    ])
                                        ? 'Bottom'
                                        : 'Left'
                                }
                                Y-Axis
                            `}
                            axisName='leftYAxis'
                            provider={this.props.provider}
                            onLabelSettingChanged={this.changeAxisLabelSetting('leftYAxis')}
                            onCustomDataIntervalChanged={this.changeAxisCustomDataInterval(
                                'leftYAxis',
                            )}
                            onEnableDataLabelsChanged={this.changeAxisEnableDataLabels('leftYAxis')}
                            onTickRotationChanged={this.changeTickRotation('leftYAxis')}
                        />
                        <LabelSettings
                            title={oneLine`
                                ${
                                    this.props.provider.settingsValueForComponent([
                                        'horizontalBars',
                                    ])
                                        ? 'Top'
                                        : 'Right'
                                }
                                Y-Axis
                            `}
                            axisName='rightYAxis'
                            provider={this.props.provider}
                            onLabelSettingChanged={this.changeAxisLabelSetting('rightYAxis')}
                            onCustomDataIntervalChanged={this.changeAxisCustomDataInterval(
                                'rightYAxis',
                            )}
                            onEnableDataLabelsChanged={this.changeAxisEnableDataLabels(
                                'rightYAxis',
                            )}
                            onTickRotationChanged={this.changeTickRotation('rightYAxis')}
                        />
                        <DataPointsLabelSettings
                            provider={this.props.provider}
                            onEnableDataLabelsChanged={this.changeAxisEnableDataLabels('dataPoint')}
                            onTickRotationChanged={this.changeTickRotation('dataPoint')}
                            onLabelSettingChanged={this.changeAxisLabelSetting('dataPoint')}
                        />
                    </Flex>
                </Flex>
            </Flex>
        );
    }
}
