import React, {useState, useCallback} from 'react';
import styled from 'styled-components';
import {Flex} from '@rebass/grid';

import {date_to_epoch, epoch_to_date} from 'src/libs/Utils';

import {Link} from 'components/basic/text';
import Dropdown from 'components/basic/forms/dropdowns/Dropdown';
import SingleDatePicker from 'components/SingleDatePicker';
import {DropdownContent} from 'components/basic/forms/dropdowns/base';
import TextInput from 'components/basic/forms/input/TextInput';
import Icon from 'components/basic/Icon';

const DatePickerDropdownContent = styled(DropdownContent)`
    max-height: 500px;
    text-align: center;
`;

export default function DatePickerDropdown({
    value,
    label,
    onChange,
    useTimestamp,
    disabledDays,
    fromMonth,
    toMonth,
    formatter,
    disabled,
    clearable,
    ...rest
}) {
    const [manualDate, setManualDate] = useState();
    let dateValue = null;
    if (value) {
        if (useTimestamp) {
            dateValue = epoch_to_date(value);
        } else {
            dateValue = value;
        }
    }

    function isValidDate(date) {
        return date instanceof Date && !isNaN(date);
    }

    let formattedValue = null;
    if (dateValue && isValidDate(dateValue)) {
        formattedValue = dateValue.toLocaleDateString();
    }
    if (formatter) {
        formattedValue = formatter(formattedValue);
    }

    const onEnterDateManually = useCallback(input => {
        const date = new Date(input);
        if (!date.isValid()) {
            return;
        }
        setManualDate(date);
    }, []);

    const onDropdownClosed = useCallback(() => {
        if (!manualDate) {
            setManualDate(undefined);
            return;
        }

        onChange(useTimestamp ? date_to_epoch(manualDate) : manualDate);
        setManualDate(undefined);
    }, [manualDate, onChange, useTimestamp]);

    const onInputKeyPress = useCallback(
        event => {
            if (event.key !== 'Enter') {
                return;
            }
            event.preventDefault();
            onChange(useTimestamp ? date_to_epoch(manualDate) : manualDate);
            setManualDate(undefined);
        },
        [manualDate, onChange, useTimestamp],
    );

    const onClickClear = useCallback(
        event => {
            event.stopPropagation();
            onChange(undefined);
        },
        [onChange],
    );

    return (
        <Dropdown
            disabled={disabled}
            render={({togglePopover}) => (
                <DatePickerDropdownContent>
                    <SingleDatePicker
                        onChange={day => {
                            const value = useTimestamp ? date_to_epoch(day) : day;
                            onChange(value);
                            togglePopover();
                        }}
                        selectedDay={dateValue}
                        disabledDays={disabledDays}
                        fromMonth={fromMonth}
                        toMonth={toMonth}
                    />
                </DatePickerDropdownContent>
            )}
            onClosed={onDropdownClosed}
            {...rest}
        >
            {rest.children || (
                <TextInput
                    {...rest}
                    disabled={disabled}
                    rightRender={() => (
                        <Flex>
                            {clearable && <Link onClick={onClickClear}>Clear</Link>}
                            <Icon name='down-dir' right />
                        </Flex>
                    )}
                    leftLabel={label}
                    value={formattedValue}
                    onValueChanged={onEnterDateManually}
                    debounceValueChange={false}
                    onKeyPress={onInputKeyPress}
                />
            )}
        </Dropdown>
    );
}
