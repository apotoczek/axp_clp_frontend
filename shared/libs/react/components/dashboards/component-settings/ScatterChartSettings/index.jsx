import React from 'react';
import PropTypes from 'prop-types';
import {Flex, Box} from '@rebass/grid';

import {SectionTitle} from 'components/dashboards/component-settings/base';
import TextInput from 'components/basic/forms/input/TextInput';
import ChecklistDropdown from 'components/basic/forms/dropdowns/ChecklistDropdown';
import LegendSettings from 'components/dashboards/component-settings/LegendSettings';

import BaseSpecHandler from 'component-spec-handlers/base-spec-handler';
import ScatterChartSpecHandler from 'component-spec-handlers/scatter-chart-spec-handler';

import EntitySettings from './EntitySettings';
import ValueSettings from './ValueSettings';
import {LabelSettings, DataPointsLabelSettings} from './label-settings';

export default class ScatterChartSettings extends React.PureComponent {
    static propTypes = {
        onSettingsChanged: PropTypes.func.isRequired,
        provider: PropTypes.object.isRequired,
        globalParams: PropTypes.object,
    };

    changeValueParameter = valueId => payload =>
        this.props.onSettingsChanged(BaseSpecHandler.changeValueParameter, {valueId, payload});

    changeGrouping = group =>
        this.props.onSettingsChanged(ScatterChartSpecHandler.changeGrouping, {value: group});

    changeEntity = entity => this.props.onSettingsChanged(BaseSpecHandler.changeEntity, {entity});

    changeValueKey = valueId => payload =>
        this.props.onSettingsChanged(ScatterChartSpecHandler.changeValueKey, {valueId, payload});

    changeTitle = title => this.props.onSettingsChanged(BaseSpecHandler.changeSettings, {title});

    changeDisabledOption = optionName => {
        const disabledOptions = this.props.provider.disabledOptionValues();
        const disabled = disabledOptions.indexOf(optionName) === -1;

        this.props.onSettingsChanged(ScatterChartSpecHandler.changeDisabledOption, {
            optionName,
            payload: disabled,
        });
    };

    changeLegendEnable = value =>
        this.props.onSettingsChanged(ScatterChartSpecHandler.changeLegendSetting, {
            payload: {key: 'enable', value},
        });

    changeLegendSetting = payload =>
        this.props.onSettingsChanged(ScatterChartSpecHandler.changeLegendSetting, {payload});

    changeAxisLabelSetting = axisName => payload =>
        this.props.onSettingsChanged(ScatterChartSpecHandler.changeAxisLabelSetting, {
            axisName,
            payload,
        });

    changeAxisCustomDataInterval = axisName => payload =>
        this.props.onSettingsChanged(ScatterChartSpecHandler.changeAxisCustomDataInterval, {
            axisName,
            payload,
        });

    changeAxisEnableDataLabels = axisName => value =>
        this.props.onSettingsChanged(ScatterChartSpecHandler.changeAxisLabelSetting, {
            axisName,
            payload: {key: 'enableDataLabels', value},
        });

    changeTickRotation = axisName => value =>
        this.props.onSettingsChanged(ScatterChartSpecHandler.changeAxisLabelSetting, {
            axisName,
            payload: {key: 'tickRotation', value},
        });

    render() {
        return (
            <Flex p={3} flexWrap='wrap'>
                <Flex width={[1, 1, 1, 0.5]} pr={[0, 0, 0, 1]} flexDirection='column'>
                    <Box mb={3}>
                        <SectionTitle>Entities</SectionTitle>
                        <EntitySettings
                            provider={this.props.provider}
                            onGroupingChanged={this.changeGrouping}
                            onEntityChanged={this.changeEntity}
                        />
                    </Box>
                    <Box>
                        <SectionTitle>Values</SectionTitle>
                        <ValueSettings
                            onParameterChanged={this.changeValueParameter}
                            onValueKeyChanged={this.changeValueKey}
                            onZValueCleared={this.clearZValue}
                            provider={this.props.provider}
                        />
                    </Box>
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
                            mb={1}
                            options={[
                                {label: 'Title', value: 'title'},
                                {label: 'Grid', value: 'grid'},
                            ]}
                            values={this.props.provider.disabledOptionValues()}
                            placeholder='E.g. Title'
                        />
                        <LegendSettings
                            provider={this.props.provider}
                            onEnableLegendChanged={this.changeLegendEnable}
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
                        />
                        <LabelSettings
                            title='Y-Axis'
                            axisName='yAxis'
                            provider={this.props.provider}
                            onLabelSettingChanged={this.changeAxisLabelSetting('yAxis')}
                            onCustomDataIntervalChanged={this.changeAxisCustomDataInterval('yAxis')}
                            onEnableDataLabelsChanged={this.changeAxisEnableDataLabels('yAxis')}
                            onTickRotationChanged={this.changeTickRotation('yAxis')}
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
