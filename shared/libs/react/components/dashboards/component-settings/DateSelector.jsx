import React, {useMemo} from 'react';
import PropTypes from 'prop-types';
import {Flex, Box} from '@rebass/grid';

import {DASHBOARDS_DATE_FORMATS as DATE_FORMATS} from 'src/libs/Constants';
import DateParameter from 'components/dashboards/component-settings/DateParameter';
import DropdownList from 'components/basic/forms/dropdowns/DropdownList';
import {DateParamType} from 'src/libs/Enums';
import {is_set} from 'src/libs/Utils';
import {gen_date_formatter} from 'src/libs/Formatters';

DateSelector.propTypes = {
    formattedValue: PropTypes.string,
    date: PropTypes.shape({
        years: PropTypes.number,
        quarters: PropTypes.number,
        months: PropTypes.number,
        type: PropTypes.oneOf(Object.values(DateParamType)),
        staticDate: PropTypes.number,
    }),
    onDateValueChanged: PropTypes.func,
    onFormatChanged: PropTypes.func,
};

export default function DateSelector({
    formattedValue,
    timestamp,
    date,
    onDateValueChanged,
    onFormatChanged,
    formatError,
}) {
    const formattedDates = useMemo(
        () =>
            timestamp
                ? DATE_FORMATS.map(o => ({
                      ...o,
                      label: gen_date_formatter(o.value, 0, 1000)(timestamp),
                  }))
                : [],
        [timestamp],
    );

    return (
        <Flex flexDirection='column'>
            <Box mb={2}>
                <DateParameter
                    formattedValue={formattedValue}
                    value={date}
                    onValueChanged={onDateValueChanged}
                />
            </Box>
            <DropdownList
                label='format'
                keyKey='value'
                manualValue={formattedValue}
                options={formattedDates}
                onValueChanged={onFormatChanged}
                error={formatError}
                disabled={!is_set(timestamp)}
            />
        </Flex>
    );
}
