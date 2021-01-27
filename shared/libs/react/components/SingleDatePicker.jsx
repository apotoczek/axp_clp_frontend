import React from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';

import DayPicker from 'react-day-picker';

const StyledDayPicker = styled(DayPicker)`
    &.DayPicker {
        font-size: 17px;
        outline: none;

        * {
            outline: none;
        }

        .DayPicker-wrapper {
            padding-bottom: 0.5em;
        }

        .DayPicker-Month {
            margin: 0.5em;
        }

        .DayPicker-WeekNumber {
            border-right: 1px solid #eaecec;
            color: ${({theme}) => theme.datePicker.weekNumberFg};
        }

        .DayPicker-Caption {
            color: ${({theme}) => theme.datePicker.captionFg};
        }

        .DayPicker-Weekday {
            color: ${({theme}) => theme.datePicker.weekDayFg};
        }

        .DayPicker-Day {
            color: ${({theme}) => theme.datePicker.dayFg};

            &.DayPicker-Day--outside {
                color: ${({theme}) => theme.datePicker.outsideDayFg};
            }

            &.DayPicker-Day--selected :not(.DayPicker-Day--disabled) :not(.DayPicker-Day--outside) {
                background-color: ${({theme}) => theme.datePicker.selectedDayBg};
                color: ${({theme}) => theme.datePicker.selectedDayFg};

                &:hover {
                    background-color: ${({theme}) => theme.datePicker.selectedDayBg};
                    color: ${({theme}) => theme.datePicker.selectedDayFg};
                }
            }

            &:not(.DayPicker-Day--disabled)
                :not(.DayPicker-Day--selected)
                :not(.DayPicker-Day--outside)
                :hover {
                background-color: ${({theme}) => theme.datePicker.dayHoverBg} !important;
                color: ${({theme}) => theme.datePicker.dayHoverFg};
            }

            &.DayPicker-Day--disabled {
                color: ${({theme}) => theme.datePicker.disabledDayFg};
                cursor: not-allowed;
            }

            &.DayPicker-Day--today:not(.DayPicker-Day--selected) {
                color: ${({theme}) => theme.datePicker.todayFg} !important;
            }
        }
    }
`;

export default class SingleDatePicker extends React.Component {
    static propTypes = {
        onChange: PropTypes.func.isRequired,
        selectedDay: PropTypes.objectOf(Date),
        disabledDays: PropTypes.arrayOf(PropTypes.object),
        fromMonth: PropTypes.objectOf(Date),
        toMonth: PropTypes.objectOf(Date),
        numberOfMonths: PropTypes.number,
    };

    static defaultProps = {
        numberOfMonths: 2,
    };

    handleDayClick = (day, modifiers = {}) => {
        if (modifiers.disabled) {
            return;
        }

        this.props.onChange(day);
    };

    render() {
        const {selectedDay, disabledDays, fromMonth, toMonth, numberOfMonths} = this.props;

        return (
            <StyledDayPicker
                fixedWeeks
                showWeekNumbers
                selectedDays={selectedDay}
                month={selectedDay}
                onDayClick={this.handleDayClick}
                numberOfMonths={numberOfMonths}
                disabledDays={disabledDays}
                fromMonth={fromMonth}
                toMonth={toMonth}
            />
        );
    }
}
