import React from 'react';
import {Flex, Box} from '@rebass/grid';

import {SectionTitle} from 'components/dashboards/component-settings/base';

import TextInput from 'components/basic/forms/input/TextInput';
import ChecklistDropdown from 'components/basic/forms/dropdowns/ChecklistDropdown';
import Checkbox from 'components/basic/forms/Checkbox';
import LegendSettings from 'components/dashboards/component-settings/LegendSettings';

import BaseSpecHandler from 'component-spec-handlers/base-spec-handler';
import PieChartSpecHandler from 'component-spec-handlers/pie-chart-spec-handler';

import ValueSettings from './ValueSettings';
import DataPointsLabelSettings from './DataPointsLabelSettings';

export default class PieChartSettings extends React.Component {
    changeTitle = title => this.props.onSettingsChanged(BaseSpecHandler.changeSettings, {title});
    changeDonut = donut => this.props.onSettingsChanged(BaseSpecHandler.changeSettings, {donut});

    changeDataPointEnableDataLabels = value =>
        this.props.onSettingsChanged(PieChartSpecHandler.changeDataPointLabelSetting, {
            payload: {key: 'enableDataLabels', value},
        });

    changeDataPointLabelSetting = payload =>
        this.props.onSettingsChanged(PieChartSpecHandler.changeDataPointLabelSetting, {payload});

    changeLegendSetting = payload =>
        this.props.onSettingsChanged(PieChartSpecHandler.changeLegendSetting, {payload});

    addNewValue = payload => this.props.onSettingsChanged(PieChartSpecHandler.addValue, payload);

    changeDisabledOption = optionName => {
        const disabledOptions = this.props.provider.disabledOptionValues();
        const disabled = disabledOptions.indexOf(optionName) === -1;

        this.props.onSettingsChanged(PieChartSpecHandler.changeDisabledOption, {
            optionName,
            payload: disabled,
        });
    };

    removeValue = valueId => () =>
        this.props.onSettingsChanged(PieChartSpecHandler.removeValue, {valueId});

    duplicateValue = valueId => () =>
        this.props.onSettingsChanged(PieChartSpecHandler.duplicateValue, {valueId});

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
        this.props.onSettingsChanged(PieChartSpecHandler.changeValueOrder, {valueId, payload});

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
                            placeholder='E.g. Number of Employees'
                        />
                        <ChecklistDropdown
                            label='Disable'
                            onValueChanged={this.changeDisabledOption}
                            options={[{label: 'Title', value: 'title'}]}
                            values={this.props.provider.disabledOptionValues()}
                            placeholder='E.g. Title'
                            mb={1}
                        />
                        <Checkbox
                            checked={this.props.provider.settingsValueForComponent(
                                ['donut'],
                                false,
                            )}
                            leftLabel='Donut View'
                            onValueChanged={this.changeDonut}
                            mb={1}
                        />
                        <LegendSettings
                            provider={this.props.provider}
                            onLegendSettingChanged={this.changeLegendSetting}
                        />
                    </Box>
                    <Flex flexDirection='column'>
                        <SectionTitle>Chart Labels</SectionTitle>
                        <DataPointsLabelSettings
                            provider={this.props.provider}
                            onEnableDataLabelsChanged={this.changeDataPointEnableDataLabels}
                            onLabelSettingChanged={this.changeDataPointLabelSetting}
                        />
                    </Flex>
                </Flex>
            </Flex>
        );
    }
}
