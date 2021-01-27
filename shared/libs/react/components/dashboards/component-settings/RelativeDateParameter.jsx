import React, {Component} from 'react';
import {Flex, Box} from '@rebass/grid';
import PropTypes from 'prop-types';

import {SectionSubTitle} from 'components/dashboards/component-settings/base';

import NumberInput from 'components/basic/forms/input/NumberInput';
import {DateOffsetType} from 'src/libs/Enums';

import RadioButtons from 'components/basic/forms/selection/RadioButtons';

import InfoTextDropdown from 'components/basic/forms/dropdowns/InfoTextDropdown';

const DateOffsetLabel = {
    [DateOffsetType.Yearly]: 'Annually',
    [DateOffsetType.Quarterly]: 'Quarterly',
    [DateOffsetType.Monthly]: 'Monthly',
    [DateOffsetType.OnDate]: 'On Date',
};

const DateOffsetSettingHelpText = [
    {
        title: 'Annually',
        description: 'Select Annually if you would like to use year end dates.',
    },
    {
        title: 'Quarterly',
        description: 'Select Quarterly if you would like to use quarter end dates.',
    },
    {
        title: 'Monthly',
        description: 'Select Monthly if you would like to use month end dates.',
    },
    {
        title: 'On Date',
        description: 'Select On Date if you want to use the dashboard’s global date exactly.',
        italic: ' (This is if you’ve chosen Relative Global date in Date Type).',
    },
    {
        title: 'On Date',
        description: 'Select On Date if you want to use today’s date.',
        italic: ' (This is if you’ve chosen Relative Date in Date Type).',
    },
];

const DateOffsetHelpText = [
    {
        title: 'Years ago',
        description:
            'Select the number of years you would like the value to refer to, if necessary.',
    },
    {
        title: 'Quarters ago',
        description: 'Select the number of quarters you would like the value to refer to.',
        italic: ' (This is only visible if Quarterly is chosen in the Date Offset Settings).',
    },
    {
        title: 'Months ago',
        description: 'Select the number of months you would like the value to refer to.',
        italic: ' (This is only visible if Monthly is chosen in the Date Offset Settings).',
    },
];

class RelativeDateParameter extends Component {
    static propTypes = {
        value: PropTypes.shape({
            years: PropTypes.number,
            quarters: PropTypes.number,
            months: PropTypes.number,
        }),

        onValueChanged: PropTypes.func.isRequired,
    };

    static defaultProps = {
        value: {
            years: 0,
            quarters: 0,
            months: 0,
        },
    };

    handleYearChanged = years => {
        const {onValueChanged, value} = this.props;
        onValueChanged({
            ...value,
            years,
        });
    };

    handleQuarterChanged = quarters => {
        const {onValueChanged, value} = this.props;
        onValueChanged({
            ...value,
            quarters,
        });
    };

    handleMonthChanged = months => {
        const {onValueChanged, value} = this.props;
        onValueChanged({
            ...value,
            months,
        });
    };

    handleDateOffsetTypeChange = dateOffsetType => {
        const {onValueChanged, value} = this.props;
        onValueChanged({
            ...value,
            dateOffsetType: dateOffsetType.value,
        });
    };

    render() {
        const {
            value: {years, quarters, months, dateOffsetType},
        } = this.props;
        const items = Object.values(DateOffsetType).map(value => ({
            value,
            label: DateOffsetLabel[value],
        }));

        const offsetBoxScale = !dateOffsetType || dateOffsetType === DateOffsetType.Yearly ? 2 : 1;

        return (
            <>
                <SectionSubTitle mt={3} mx={1}>
                    Date offset interval
                    <InfoTextDropdown
                        iconSize={10}
                        title='Date Offset Settings'
                        infoTexts={DateOffsetSettingHelpText}
                    />
                </SectionSubTitle>
                <RadioButtons
                    options={items}
                    value={dateOffsetType}
                    onSelect={this.handleDateOffsetTypeChange}
                />
                {dateOffsetType !== DateOffsetType.OnDate && (
                    <>
                        <SectionSubTitle mt={3} mx={1}>
                            Date offset
                            <InfoTextDropdown
                                iconSize={10}
                                title='Date Offset'
                                infoTexts={DateOffsetHelpText}
                            />
                        </SectionSubTitle>
                        <Flex>
                            <Box flex={1} mx={1}>
                                <NumberInput
                                    leftLabel='Years ago'
                                    placeholder='E.g. 3'
                                    value={years}
                                    min={0}
                                    max={new Date().getFullYear()}
                                    onValueChanged={year => this.handleYearChanged(year)}
                                />
                            </Box>
                            {dateOffsetType === DateOffsetType.Quarterly && (
                                <Box flex={1} mx={1}>
                                    <NumberInput
                                        leftLabel='Quarters ago'
                                        placeholder='E.g. 2'
                                        value={quarters}
                                        min={0}
                                        onValueChanged={quarter =>
                                            this.handleQuarterChanged(quarter)
                                        }
                                    />
                                </Box>
                            )}
                            {dateOffsetType === DateOffsetType.Monthly && (
                                <Box flex={1} mx={1}>
                                    <NumberInput
                                        leftLabel='Months ago'
                                        placeholder='E.g. 2'
                                        value={months}
                                        min={0}
                                        onValueChanged={month => this.handleMonthChanged(month)}
                                    />
                                </Box>
                            )}

                            <Box flex={offsetBoxScale} mx={offsetBoxScale} />
                        </Flex>
                    </>
                )}
            </>
        );
    }
}

export default RelativeDateParameter;
