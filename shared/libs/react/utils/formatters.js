import * as Formatters from 'src/libs/Formatters';
import * as self from 'utils/formatters';

import * as Utils from 'src/libs/Utils';
import {Format} from 'src/libs/Enums';

function _abbreviate(value, _abbreviateAs) {
    const trillions = 1000000000000;
    const billions = 1000000000;
    const millions = 1000000;
    const thousands = 1000;
    const hundreds = 100;

    let abbreviateAs = '';
    if (_abbreviateAs === 'auto') {
        if (value > trillions) {
            abbreviateAs = 'trillions';
        } else if (value > billions) {
            abbreviateAs = 'billions';
        } else if (value > millions) {
            abbreviateAs = 'millions';
        } else if (value > thousands) {
            abbreviateAs = 'thousands';
        }
        // We don't infer 'hundreds' as a suffix, that seems unreasonable
    } else {
        abbreviateAs = _abbreviateAs;
    }

    if (abbreviateAs === 'hundreds') {
        return {value: value / hundreds, suffix: ' H'};
    } else if (abbreviateAs === 'thousands') {
        return {value: value / thousands, suffix: ' K'};
    } else if (abbreviateAs === 'millions') {
        return {value: value / millions, suffix: ' M'};
    } else if (abbreviateAs === 'billions') {
        return {value: value / billions, suffix: ' B'};
    } else if (abbreviateAs === 'trillions') {
        return {value: value / trillions, suffix: ' T'};
    }

    return {value, suffix: ''};
}

export const string = value => {
    if (!Utils.is_set(value)) {
        return '';
    }

    return value;
};

export function integer(value, {abbreviate = false, abbreviateAs, showUnit} = {}) {
    if (!Utils.is_set(value)) {
        return '';
    }

    if (abbreviate) {
        let {value: newValue, suffix} = _abbreviate(value, abbreviateAs);
        suffix = showUnit ? suffix : '';

        return `${newValue.round(0)} ${suffix}`;
    }

    return `${value.round(0)}`;
}

export function float(value, {abbreviate = false, abbreviateAs, decimals, showUnit} = {}) {
    if (!Utils.is_set(value)) {
        return '';
    }

    if (abbreviate) {
        let {value: newValue, suffix} = _abbreviate(value, abbreviateAs);
        suffix = showUnit ? suffix : '';
        newValue = newValue.toFixed(decimals);

        return `${newValue} ${suffix}`;
    }

    value = value.toFixed(decimals);
    return `${value}`;
}

export function multiple(value, {abbreviate = false, abbreviateAs, decimals, showUnit} = {}) {
    if (!Utils.is_set(value)) {
        return '';
    }

    if (abbreviate) {
        ({value} = _abbreviate(value, abbreviateAs));
    }

    value = value.toFixed(decimals);

    return `${value}${showUnit ? 'x' : ''}`;
}

export function percentage(value, {abbreviate = false, abbreviateAs, decimals, showUnit} = {}) {
    if (!Utils.is_set(value)) {
        return '';
    }

    let percentValue = value * 100;

    if (abbreviate) {
        ({value: percentValue} = _abbreviate(percentValue, abbreviateAs));
    }

    percentValue = percentValue.toFixed(decimals);

    return `${percentValue}${showUnit ? '%' : ''}`;
}

export const percent = percentage;

const signWrap = (value, negative) => {
    if (negative) {
        return `(${value})`;
    }

    return value;
};

const CURRENCY_REPLACEMENTS = {
    'EUR/ECU': 'EUR',
};

export function getCurrencySymbol(renderCurrency = 'USD', locale) {
    const currency = CURRENCY_REPLACEMENTS[renderCurrency] || renderCurrency;
    const options = {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    };
    return (0)
        .toLocaleString(locale, options)
        .replace(/\d/g, '')
        .trim();
}

export function money(
    value,
    {
        render_currency: renderCurrency = 'USD', // _ to automatically conform with backend key
        locale = 'en-US',
        abbreviate = true,
        abbreviateAs,
        decimals,
        showUnit,
        currencySymbol,
    } = {},
) {
    if (!Utils.is_set(value)) {
        return '';
    }

    const options = {
        style: 'decimal',
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    };
    const negative = value < 0;
    const abs = Math.abs(value);

    currencySymbol = currencySymbol || getCurrencySymbol(renderCurrency, locale);

    if (abbreviate) {
        let {value: newVal, suffix} = _abbreviate(abs, abbreviateAs);
        suffix = showUnit ? suffix : '';

        newVal = newVal.toLocaleString(locale, options);
        return newVal && signWrap(`${currencySymbol} ${newVal} ${suffix}`, negative);
    }

    value = abs.toLocaleString(locale, options);
    return signWrap(`${currencySymbol} ${value}`, negative);
}

export function number(value, {decimals = 2} = {}) {
    if (!Utils.is_set(value) || isNaN(value)) {
        return '';
    }

    return Formatters.number(value, undefined, {decimals});
}

export const month = value => {
    if (!Utils.is_set(value) || isNaN(value)) {
        return '';
    }

    return Formatters.date_month(value);
};

export const quarter = value => {
    if (!Utils.is_set(value) || isNaN(value)) {
        return '';
    }

    return Formatters.date_quarterly(value);
};

export const year = value => {
    if (!Utils.is_set(value) || isNaN(value)) {
        return '';
    }

    return Formatters.date_year(value);
};

export const date = value => {
    if (!Utils.is_set(value) || isNaN(value)) {
        return '';
    }

    return Formatters.date(value);
};

export const years = value => {
    if (!Utils.is_set(value)) {
        return 'N/A';
    }
    return `${value} years`;
};

export const date_distance = value => {
    if (!Utils.is_set(value)) {
        return 'N/A';
    }

    // Value is number of days between two dates.
    const years = Math.abs(value / 365.25).toFixed(2);

    return `${years} years`;
};

export const backend_date = value => {
    if (!Utils.is_set(value) || isNaN(value)) {
        return '';
    }

    return Formatters.backend_date(value);
};

export const backend_datetime = value => {
    if (!Utils.is_set(value) || isNaN(value)) {
        return '';
    }

    return Formatters.backend_datetime(value);
};

export const fiscalYear = value => (value ? value.setUTC(true).format('{Month} {do}') : '');

const translateFormat = format => {
    switch (format) {
        case Format.Money:
            return money;
        case Format.Percent:
            return percentage;
        case Format.Multiple:
            return multiple;
        case Format.Integer:
            return integer;
        case Format.Float:
            return float;
    }

    return x => x;
};

const genFormatter = format => {
    if (Object.isObject(format)) {
        const {type, formatArgs = {}} = format;
        const formatter = self[type];

        if (typeof formatter !== 'function') {
            return x => x;
        }

        return value => {
            return formatter(value, formatArgs);
        };
    }

    if (typeof format === 'number') {
        return translateFormat(format);
    }

    const formatter = self[format];
    return formatter || (x => x);
};

export default genFormatter;
