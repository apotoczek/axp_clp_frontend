import moment from 'moment';
import {gen_formatter} from 'src/libs/Formatters';

export const genFormatter = format => {
    if (format === 1) {
        // We don't want "USD" to be shown
        return gen_formatter({
            format: 'number',
            default_value: 'N/A',
        });
    }
    return gen_formatter({
        format,
        default_value: 'N/A',
    });
};

export const formatAction = action => action.replace('_', ' ').titleize();

export const splitLocaleDatetime = dateObj => {
    return moment(dateObj)
        .format('MMMM Do YYYY, h:mm:ss A')
        .split(',');
};

export const toUtcDateString = date => {
    return moment(date)
        .utc()
        .format('MM/DD/YYYY');
};
