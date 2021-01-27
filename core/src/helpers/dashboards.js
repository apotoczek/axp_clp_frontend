import * as Formatters from 'src/libs/Formatters';
import {DateParamType, DateOffsetType} from 'src/libs/Enums';

import {
    date_or_today,
    is_set,
    month_end_date,
    quarter_end_date,
    year_end_date,
} from 'src/libs/Utils';

/*
    Mapper deciding how to snap different offset types and how the quarters and months
    defined on the date should be handled.
*/
const OFFSET_TYPE_TO_SNAP = {
    [DateOffsetType.OnDate]: [date_or_today, () => {}],
    [DateOffsetType.Monthly]: [month_end_date, (_, m) => m],
    [DateOffsetType.Quarterly]: [quarter_end_date, (q, _) => 3 * q],
    [DateOffsetType.Yearly]: [year_end_date, () => {}],
};

export const timestampFromRelativeDate = (
    snapFunction,
    years = 0,
    months = 0,
    baseTimestamp = undefined,
) => {
    if (is_set(baseTimestamp)) {
        baseTimestamp *= 1000;
    }
    const snappedToEndDate = snapFunction(baseTimestamp);
    const rewindedDate = snapFunction(new Date(snappedToEndDate).rewind({years, months}));

    if (isNaN(rewindedDate)) {
        return 0;
    }

    return Math.floor(rewindedDate / 1000);
};

export const dateSelectionTimestamp = (date, globalDate) => {
    const {type, dateOffsetType, years = 0, quarters = 0, months = 0} = date;
    if (type === DateParamType.STATIC && date.staticDate && !date.sinceInception) {
        return date.staticDate;
    } else if (type === DateParamType.RELATIVE && dateOffsetType) {
        const [snapFunction, monthsMultipler] = OFFSET_TYPE_TO_SNAP[dateOffsetType];
        return timestampFromRelativeDate(snapFunction, years, monthsMultipler(quarters, months));
    } else if (type === DateParamType.RELATIVE_GLOBAL && globalDate && dateOffsetType) {
        const [snapFunction, monthsMultipler] = OFFSET_TYPE_TO_SNAP[dateOffsetType];
        return timestampFromRelativeDate(
            snapFunction,
            years,
            monthsMultipler(quarters, months),
            globalDate,
        );
    }
};

export const formattedDateSelectionValue = (dateObject, globalDate, fmtString) => {
    if (dateObject.type == DateParamType.STATIC && dateObject.sinceInception) {
        return 'Since Inception';
    }

    const timestamp = dateSelectionTimestamp(dateObject, globalDate);
    if (!is_set(timestamp)) {
        return 'N/A';
    }
    return Formatters.gen_date_formatter(fmtString, 0, 1000)(timestamp);
};
