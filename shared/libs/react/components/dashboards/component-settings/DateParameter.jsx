import React, {useCallback} from 'react';
import PropTypes from 'prop-types';
import {Flex, Box} from '@rebass/grid';
import styled from 'styled-components';

import {H3, H4, Description} from 'components/basic/text';

import RadioButtons from 'components/basic/forms/selection/RadioButtons';
import RelativeDateParameter from 'components/dashboards/component-settings/RelativeDateParameter';
import {SectionSubTitle} from 'components/dashboards/component-settings/base';
import {DateParamType, DateOffsetType} from 'src/libs/Enums';

import Checkbox from 'components/basic/forms/Checkbox';
import {date_to_epoch, epoch_to_date} from 'src/libs/Utils';
import DatePickerDropdown from 'components/basic/forms/dropdowns/DatePickerDropdown';
import InfoTextDropdown from 'components/basic/forms/dropdowns/InfoTextDropdown';

const DateTypeLabel = {
    [DateParamType.STATIC]: 'Static Date',
    [DateParamType.RELATIVE]: 'Relative Date',
    [DateParamType.RELATIVE_GLOBAL]: 'Relative Global Date',
};

const StyledHeader = styled(Flex)`
    background: #eff1f9;
`;

const Wrapper = styled(Flex)`
    border: 1px solid #bec2d5;
    border-radius: 2px;
    background: #ffffff;
`;

const StyledBox = styled(Flex)`
    background: ${({theme}) => theme.radioButton.bgColor};
    color: ${({theme}) => theme.radioButton.fgColor};
`;

const ParameterTitle = styled(H3)`
    margin: 0;
`;

const CurrentlyUsed = styled(H4)`
    margin: 0;
`;

const GlobalDate = styled(Description)`
    color: #39bee5;
    padding-left: 8px;
    margin: 0;
`;

const Explain = styled(Flex)`
    color: ${({theme}) => theme.input.labelFg};
    font-style: italic;
`;

const DateTypeHelpText = [
    {
        title: 'Static Date',
        description:
            'Select static date if you would like the date value to be for a specific date. This date will not change.',
    },
    {
        title: 'Relative Global Date',
        description:
            'Select Relative Global Date if you would like the date value to update relative to the dashboard’s Global Date.',
    },
    {
        title: 'Relative Date',
        description:
            'Select Relative Date if you would like the date value to update relative to today’s date.',
    },
];

export default class DateParameter extends React.Component {
    static propTypes = {
        label: PropTypes.string,
        value: PropTypes.shape({
            years: PropTypes.number,
            quarters: PropTypes.number,
            months: PropTypes.number,
            type: PropTypes.oneOf(Object.values(DateParamType)),
            dateOffsetType: PropTypes.oneOf(Object.values(DateOffsetType)),
            staticDate: PropTypes.number,
            sinceInception: PropTypes.bool,
        }),
        formattedValue: PropTypes.string,
        onValueChanged: PropTypes.func,
    };

    handleSelectType = option => {
        const {onValueChanged, value} = this.props;

        onValueChanged({
            ...value,
            type: option.value,
        });
    };

    render() {
        const {value, label, formattedValue, onValueChanged} = this.props;
        const items = Object.values(DateParamType).map(value => ({
            value,
            label: DateTypeLabel[value],
        }));
        const isRelative = [DateParamType.RELATIVE, DateParamType.RELATIVE_GLOBAL].includes(
            value.type,
        );
        return (
            <Wrapper flexDirection='column' mt={2}>
                <StyledHeader justifyContent='space-between' py={2} px={3}>
                    <ParameterTitle>{label}</ParameterTitle>
                    <Flex alignItems='center'>
                        <CurrentlyUsed>Currently used: </CurrentlyUsed>
                        <GlobalDate>{formattedValue}</GlobalDate>
                    </Flex>
                    {isRelative && (
                        <Explain ml={1}>This date is relative, it will change over time.</Explain>
                    )}
                </StyledHeader>
                <Flex flexDirection='column' p={2} pt={0}>
                    <SectionSubTitle mx={1}>
                        Date Type
                        <InfoTextDropdown
                            iconSize={10}
                            title='Date Type'
                            infoTexts={DateTypeHelpText}
                        />
                    </SectionSubTitle>
                    <RadioButtons
                        options={items}
                        value={value.type}
                        onSelect={this.handleSelectType}
                    />
                    <DatePicker
                        value={value}
                        onValueChanged={onValueChanged}
                        subType={this.props.subType}
                    />
                </Flex>
            </Wrapper>
        );
    }
}

function DatePicker({value, onValueChanged, subType}) {
    const handleStaticDateChanged = useCallback(
        date => {
            onValueChanged({...value, staticDate: date_to_epoch(date), sinceInception: false});
        },
        [onValueChanged, value],
    );

    const handleSinceInceptionChanged = useCallback(() => {
        onValueChanged({...value, staticDate: null, sinceInception: true});
    }, [onValueChanged, value]);

    let content = null;
    if (value.type === DateParamType.STATIC) {
        let sinceInceptionCheckbox = <Box flex={1} mx={1} />;
        if (subType === 'startDate') {
            sinceInceptionCheckbox = (
                <Checkbox
                    mx={1}
                    flex={1}
                    leftLabel='Since Inception'
                    checkedIcon='dot-circled'
                    uncheckedIcon='circle-empty'
                    checked={value.sinceInception || false}
                    onValueChanged={handleSinceInceptionChanged}
                />
            );
        }
        content = (
            <Flex flexDirection='column'>
                <SectionSubTitle mx={1}>Date</SectionSubTitle>
                <StyledBox>
                    <Box flex={1} mx={1}>
                        <DatePickerDropdown
                            label='Pick a date'
                            value={value.staticDate && epoch_to_date(value.staticDate)}
                            onChange={handleStaticDateChanged}
                        />
                    </Box>
                    {sinceInceptionCheckbox}
                    <Box flex={1} mx={1} />
                </StyledBox>
            </Flex>
        );
    } else if ([DateParamType.RELATIVE, DateParamType.RELATIVE_GLOBAL].includes(value.type)) {
        content = <RelativeDateParameter value={value} onValueChanged={onValueChanged} />;
    }

    return content;
}
