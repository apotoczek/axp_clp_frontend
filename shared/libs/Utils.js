import $ from 'jquery';
import ko from 'knockout';
import md5 from 'spark-md5';
import * as Constants from 'src/libs/Constants';
import Sugar from 'sugar';

let id_seq = 0;
const seen_objects = [];

export function objectId(newObj) {
    for (let [obj, id] of seen_objects) {
        if (obj === newObj) {
            return id;
        }
    }

    let newId = id_seq++;

    seen_objects.push([newObj, newId]);

    return newId;
}

export function getOptionLabel(options, value, valueKey = 'value', labelKey = 'label') {
    const option = options.find(o => o[valueKey] === value);

    return option && option[labelKey];
}

export function array_move(arr, from, to) {
    const new_arr = arr.slice();
    new_arr.splice(to < 0 ? new_arr.length + to : to, 0, new_arr.splice(from, 1)[0]);
    return new_arr;
}

export function set_intersection(setA, setB) {
    const _intersection = new Set();

    for (const elem of setB) {
        if (!setA.has(elem)) {
            continue;
        }

        _intersection.add(elem);
    }

    return _intersection;
}

export function set_difference(setA, setB) {
    const _difference = new Set(setA);

    for (const elem of setB) {
        _difference.delete(elem);
    }

    return _difference;
}

export function set_union(setA, setB) {
    const _union = new Set(setA);

    for (const elem of setB) {
        _union.add(elem);
    }

    return _union;
}

export function joinUrl(...parts) {
    if (!parts) {
        return '';
    } else if (parts.length < 2) {
        return parts.join('');
    }
    return parts.reduce((cur, next) => {
        if (cur.endsWith('/') && next.startsWith('/')) {
            return `${cur}${next.substring(1)}`;
        } else if (cur.endsWith('/') || next.startsWith('/')) {
            return `${cur}${next}`;
        }
        return `${cur}/${next}`;
    });
}

export function partition(items, numGroups = 2) {
    const arrayItems = Array.from(items);

    const groups = [];

    for (let i = 0; i < numGroups; i++) {
        groups.push([]);
    }

    for (let i = 0; i < arrayItems.length; i++) {
        const j = i % numGroups;

        groups[j].append(arrayItems[i]);
    }

    return groups;
}

export function filterObject(obj = {}, filter_fn = () => true) {
    const newObj = {};

    for (const [key, value] of Object.entries(obj)) {
        if (filter_fn(key, value)) {
            newObj[key] = value;
        }
    }

    return newObj;
}

export const is_numeric = n => !isNaN(parseFloat(n)) && isFinite(n);

export function is_any_set(values, ignore_empty = false) {
    return values.some(val => is_set(val, ignore_empty));
}

export function is_set(value, ignore_empty = false) {
    let is_set = value !== undefined && value !== null;

    if (ignore_empty && is_set) {
        if (Object.isArray(value) && value.length === 0) {
            return false;
        }
        if (Object.isObject(value) && Object.size(value) == 0) {
            return false;
        }
        if (Object.isString(value) && value.length === 0) {
            return false;
        }
    }

    return is_set;
}

export function serialize(subject) {
    if (!is_set(subject, true)) {
        return '';
    }

    if (Object.isObject(subject)) {
        let keys = Object.keys(subject).mergeSort();
        let values = [];
        for (let i = 0, l = keys.length; i < l; i++) {
            let value = subject[keys[i]];
            if (is_set(value, true)) {
                values.push([keys[i], serialize(value)].join(':'));
            }
        }
        return `{${values.join(',')}}`;
    }

    if (Object.isArray(subject)) {
        let array = subject.mergeSort();
        let values = [];
        for (let i = 0, l = array.length; i < l; i++) {
            values.push(serialize(array[i]));
        }
        return `[${values.join(',')}]`;
    }

    return String(subject);
}

export function hashed(params) {
    return md5.hash(serialize(params));
}

export function deep_merge(...objects) {
    /*
        Will merge objects in objects into a new object, recursively.
        Will not merge properties of different types, and ignores
        undefined.
    */

    let options = {
        deep: true,
        resolve: (key, targetValue, sourceValue) => {
            if (targetValue === undefined) {
                return sourceValue;
            } else if (sourceValue === undefined) {
                return targetValue;
            } else if (
                is_set(targetValue) &&
                is_set(sourceValue) &&
                targetValue.constructor !== sourceValue.constructor
            ) {
                // Don't merge things of different types
                return sourceValue;
            }

            return Sugar;
        },
    };

    return Object.addAll({}, objects, options);
}

export function parse_integer(value) {
    let intval = parseInt(value);

    if (isNaN(intval)) {
        return undefined;
    }

    return intval;
}

export function default_value(value, default_value) {
    return value === undefined ? default_value : value;
}

export function ensure_array(value) {
    if (is_set(value)) {
        if (!Array.isArray(value)) {
            return [value];
        }

        return value;
    }

    return [];
}

export function is_str(value) {
    return typeof value === typeof '';
}

export function is_regex(value) {
    return value instanceof RegExp;
}

export function unescape_html(value) {
    if (value && is_str(value)) {
        return value.unescapeHTML();
    }

    return value;
}

export function get_cpanel_extract_keys(config) {
    if (Object.isArray(config)) {
        return config.map(get_cpanel_extract_keys).compact();
    }

    if (config.component.name.includes('PopoverButton') && config.popover_config.components) {
        // It's a popover, does it have nested components?
        // Yes it has nested components, recurse

        return {
            id: config.id,
            type: 'nested',
            component_key: 'popover',
            component: {
                id: config.popover_config.id,
                components: get_cpanel_extract_keys(config.popover_config.components),
            },
        };
    } else if (config.component.name.includes('Aside') && config.components) {
        return {
            id: config.id,
            type: 'nested',
            components: get_cpanel_extract_keys(config.components),
        };
    } else if (config.component.name.includes('PopoverButton')) {
        // Just a regular popover
        return {
            id: config.id,
            type: 'popover_button',
        };
    } else if (config.component.name.includes('BooleanButton')) {
        return {
            id: config.id,
            type: 'boolean_button',
        };
    } else if (config.component.name.includes('AttributeFilters')) {
        return {
            id: config.id,
            type: 'enum_attributes',
        };
    }
}

export function html_id(id) {
    return md5.hash(id);
}

export function contextual_url(obj, args) {
    let url_parts = args.url.startsWith('/') ? args.url.slice(1).split('/') : args.url.split('/');
    let url = args.base || '#!';

    for (let i = 0, l = url_parts.length; i < l; i++) {
        url += '/';

        if (url_parts[i].startsWith('<') && url_parts[i].endsWith('>')) {
            url += extract_data(url_parts[i].remove('<').remove('>'), obj);
        } else {
            url += url_parts[i];
        }
    }

    return url;
}

export function build_tiered_checklist_tree(options, opts) {
    let parent_key = opts.parent_key || 'parent_uid';
    let value_key = opts.value_key || 'uid';
    let label_key = opts.label_key || 'name';

    let additional_keys = opts.additional_keys || [];

    let option_tree = {
        root: [],
        parent_map: {},
        names: {},
    };

    let parent_set = new Set([]);
    for (const curr_option of options) {
        if (curr_option[parent_key] != undefined) {
            parent_set.add(curr_option[parent_key]);
        }
    }

    if (options) {
        for (let i = 0, l = options.length; i < l; i++) {
            let option = {};

            option[value_key] = options[i][value_key];
            option[parent_key] = options[i][parent_key];
            option[label_key] = options[i][label_key];

            if (parent_set.has(options[i][value_key])) {
                option['icon'] = {'glyphicon-plus': true};
            }

            for (let key of additional_keys) {
                option[key] = options[i][key];
            }

            option_tree['names'][options[i][value_key]] = options[i][label_key];

            if (option[parent_key]) {
                option_tree[option[parent_key]] = option_tree[option[parent_key]] || [];
                option_tree[option[parent_key]].push(option);
                option_tree['parent_map'][option[value_key]] = option[parent_key];
            } else {
                option_tree['root'].push(option);
            }
        }
    }

    return option_tree;
}

export function find_relative_idx(search_set, config) {
    /*
        Expects a config: {
            position: 'right' or 'left' of the found value
            key: The key used to get the value we want to be relative to.
            value: The value we want to be relative to.
        }
    */
    if (!config.position || !config.key || !config.value) {
        throw 'Invalid config passed to Utils.relative_idx';
    }

    let offset = config.position == 'right' ? 1 : 0;

    let idx = search_set.findIndex(item => {
        return item[config.key] == config.value;
    });

    if (idx > -1) {
        return idx + offset;
    }
    return undefined;
}

export function mode(arr, key_fn) {
    key_fn = key_fn || identity;

    if (!arr || arr.length == 0) {
        return null;
    }

    let map = {};
    let max_item = key_fn(arr[0]);
    let max_count = 1;

    for (let i = 0, l = arr.length; i < l; i++) {
        let item = key_fn(arr[i]);

        if (map[item] === undefined) {
            map[item] = 1;
        } else {
            map[item]++;
        }

        if (map[item] > max_count) {
            max_item = item;
            max_count = map[item];
        }
    }

    return max_item;
}

export function gen_comp_fn(comparator) {
    return function(a, b) {
        switch (comparator) {
            case '==':
                return a == b;
            case '>':
                return a > b;
            case '>=':
                return a >= b;
            case '<':
                return a < b;
            case '<=':
                return a <= b;
            default:
                throw `Unknown comparator ${comparator} in Utils.gen_comp_fn`;
        }
    };
}

export function ensure_css_object(css) {
    if (Object.isString(css)) {
        let _css = {};

        css.split(' ').forEach(cls => {
            _css[cls] = true;
        });

        return _css;
    }

    return {...css};
}

/**
 * Calculates a float representing the number of years between the two
 * given timestamps/dates.
 *
 * @example
 * start: 0
 * end: 1507211664
 * returns: 47.76037673858285
 *
 * @param {Int/Date} start   A timestamp/date used for start of the interval
 * @param {Int/Date} end     A timestamp/date used for end of the interval
 *
 * @returns {Float} A float value representing the number of years between
 *                  start and end.
 */
export function years_diff(start, end = new Date()) {
    let start_date = new Date(start);
    let end_date = new Date(end);
    if (!start_date.isValid() || !end_date.isValid()) {
        return undefined;
    }

    // Divide by 365.242 to get the number of years in a float value, e.g.
    // 444/365.242 = 1.215639032
    return end_date.daysSince(start_date) / Constants.days_per_year;
}

/**
 * Takes a date and calculates the timestamp of the last date on the previous
 * quarter relative to the given date.
 * @param  {Int} timestamp   A date to base the relative previous quarter on.
 *                           Defaults to today.
 * @return {Int}             A timestamp representing the end date of the previous
 *                           quarter relative to the given date.
 */
export function previous_quarter_end_date(timestamp) {
    let date = new Date(timestamp);
    if (!date.isValid()) {
        date = new Date();
    }

    // If we have Jan/Feb/Mar, we need to manually swap to the previous year
    if (date.getMonth() < 3) {
        // Simply set a date in december, since any date will result in the same
        // quarter end date
        date.setFullYear(date.getFullYear() - 1, 11, 24);
    } else {
        date.setFullYear(date.getFullYear(), date.getMonth() - 3, 24);
    }

    return quarter_end_date(date);
}

/**
 * Takes a date calculates the timestamp of the last date on the quarter this date
 * is in. Thus the given quarter end date is relative to the given base date.
 * @param  {Int}   timestamp  The timestamp to base the quarter end date on. Defaults
 *                            to now.
 * @return {Date}             A timestamp representing the end date of the quarter
 *                            that the given base date is within.
 */
export function quarter_end_date(timestamp) {
    let date = new Date(timestamp);
    if (!date.isValid()) {
        date = new Date();
    }

    let quarter = month_to_quarter(date.getMonth() + 1);

    if (quarter == 1) {
        date.setMonth(2, 31);
    } else if (quarter == 2) {
        date.setMonth(5, 30);
    } else if (quarter == 3) {
        date.setMonth(8, 30);
    } else if (quarter == 4) {
        date.setMonth(11, 31);
    }

    return date_to_epoch(date) * 1000;
}

export function year_end_date(timestamp) {
    let date = new Date(timestamp);
    if (!date.isValid()) {
        date = new Date();
    }

    date.setMonth(11, 31);

    return date_to_epoch(date) * 1000;
}

export function date_or_today(timestamp) {
    if (!is_set(timestamp)) {
        return date_to_epoch(new Date()) * 1000;
    }
    return timestamp;
}

export function month_end_date(timestamp) {
    let date = new Date(timestamp);
    if (!date.isValid()) {
        date = new Date();
    }
    const month = date.getMonth();
    const year = date.getFullYear();

    month != 11 ? date.setFullYear(year, month + 1, 0) : date.setFullYear(year + 1, 0, 0);

    return date_to_epoch(date) * 1000;
}

/**
 * Takes two dates, converts them into years and a quarter for that year, and
 * calculates a float reprensenting the difference between those two year/quarter
 * pairs.
 *
 * Example; Given left_date = Q1 2015 and right_date Q4 2016, the resulting float
 * will be 1.75. Since the two pairs differ by 1 year and 3 quarters.
 *
 * @param  {Date}   left_date    The first date to use in the comparison.
 * @param  {Date}   right_date   The second date to use in the comparison.
 * @return {float}               A float representing the number of years and
 *                               quarters difference between the two given dates.
 */
export function by_quarter_time_diff(left_date, right_date) {
    try {
        let left_date_quarter = month_to_quarter(left_date.getMonth() + 1);
        let right_date_quarter = month_to_quarter(right_date.getMonth() + 1);

        // Calculate the difference in years and quarter fractions between the two
        // above dates, i.e. if we have first cashflow date as: Q1 2015 and positive
        // date as Q4 2016 we get; 1.75 delta.
        let year_delta = Math.abs(left_date.yearsSince(right_date));
        let quarter_delta_fraction = Math.abs(left_date_quarter - right_date_quarter) / 4;
        return year_delta + quarter_delta_fraction;
    } catch (e) {
        return undefined;
    }
}

/**
 * Takes a timestamp and calculates the quarter that timestamp is in.
 * @param  {Int} timestamp The timestamp to use as a base for the quarter.
 * @return {Int}           A number representing the quarter the fgiven timestamp is
 *                         in.
 */
export function timestamp_to_quarter(timestamp) {
    let date = new Date(timestamp);
    if (!date.isValid()) {
        return undefined;
    }

    return month_to_quarter(date.getMonth() + 1);
}

export function month_to_quarter(month) {
    switch (month) {
        case 1:
        case 2:
        case 3:
            return 1;
        case 4:
        case 5:
        case 6:
            return 2;
        case 7:
        case 8:
        case 9:
            return 3;
        case 10:
        case 11:
        case 12:
            return 4;
        default:
            throw `Invalid month ${month}`;
    }
}

export function valid_vintage_years(padding = 5) {
    return Number.range(Date.create().getFullYear() + padding, 1972).every();
}

export function current_year() {
    return Date.create()
        .setUTC(true)
        .getFullYear();
}

export function current_month() {
    return Date.create()
        .setUTC(true)
        .getMonth();
}

export function deep_copy_object(object) {
    return JSON.parse(JSON.stringify(object));
}

export function deep_copy_references(thing) {
    if (thing) {
        if (thing.constructor === Array) {
            let copy = [];

            for (let value of thing) {
                copy.push(deep_copy_references(value));
            }

            return copy;
        } else if (typeof thing === 'object') {
            let copy = {};

            for (let [key, value] of Object.entries(thing)) {
                copy[key] = deep_copy_references(value);
            }

            return copy;
        }
    }

    return thing;
}

export function epoch_to_date(timestamp) {
    return new Date(timestamp * 1000 + new Date(timestamp * 1000).getTimezoneOffset() * 60 * 1000);
}

export function epoch() {
    return Date.create()
        .setUTC(true)
        .getTime();
}

export function date_to_epoch(date, utc = true, reset_time = true) {
    let d = Date.create(date);
    if (reset_time) {
        // Reset to day (reset hours) to get local date at midnight
        d.reset('day');
    }

    if (d.isValid() && d.getTime() > 0) {
        // Get timestamp representing local midnight
        let timestamp = d.getTime() / 1000;

        if (utc) {
            // Subtract timezone offset (minutes) to get UTC midnight
            return timestamp - d.getTimezoneOffset() * 60;
        }

        return timestamp;
    }

    return undefined;
}

export function parse_number(str) {
    let multiplier = 1;

    if (!is_set(str, true)) {
        str = '';
    }

    str = str.toString().replace('$', '');

    if (str.search(/k/i) != -1) {
        multiplier = 1000;
    } else if (str.search(/m/i) != -1) {
        multiplier = 1000000;
    } else if (str.search(/b/i) != -1 || str.search(/g/i) != -1) {
        multiplier = 1000000000;
    }

    // Check if it has parens == negative number
    let negRegExp = /\(([^)]+)\)/;
    let negMatches = negRegExp.exec(str);

    if (negMatches && negMatches.length > 0) {
        str = `-${negMatches[1]}`;
    }

    let f = parseFloat(str.toNumber());
    if (!isNaN(f)) {
        f = f * multiplier;
        return f;
    }

    return undefined;
}

export function auto_select(obj, evt) {
    let $target = $(evt.target);
    $target.focus();
    $target.select();
}

export function slugify(value) {
    return (
        value &&
        value
            .toLowerCase()
            .replace(/[^\w ]+/g, '')
            .replace(/ +/g, '-')
    );
}

export function get_vehicle_uid(vehicle) {
    if (vehicle) {
        return (
            vehicle.user_fund_uid ||
            vehicle.portfolio_uid ||
            vehicle.company_uid ||
            vehicle.instance_uid
        );
    }
}

export function return_and_callback(value, callback) {
    if (typeof callback === 'function') {
        callback(value);
    }

    return value;
}

export function maximize_window() {
    window.moveTo(0, 0);

    if (document.all) {
        top.window.resizeTo(screen.availWidth, screen.availHeight);
    } else if (document.layers || document.getElementById) {
        if (
            top.window.outerHeight < screen.availHeight ||
            top.window.outerWidth < screen.availWidth
        ) {
            top.window.outerHeight = screen.availHeight;
            top.window.outerWidth = screen.availWidth;
        }
    }
}

export function identity(x) {
    return x;
}

export function get_selected_value(selected) {
    return selected ? selected.value : undefined;
}

export function deepGet(object, path, defaultValue, notSetChecker = v => v === undefined) {
    const value = path.reduce((retValue, currentPath) => {
        return is_set(retValue, true) ? retValue[currentPath] : undefined;
    }, object);

    if (notSetChecker(value)) {
        return defaultValue;
    }

    return value;
}

export function recursive_get(data, keys, force_no_undefined = true) {
    if (keys.length > 0) {
        const new_keys = keys.slice();
        const key = new_keys.shift();

        if (data && data[key] !== undefined) {
            return recursive_get(ko.unwrap(data[key]), new_keys);
        }
    }

    return force_no_undefined ? data : undefined;
}

export function recursive_set(target, keys, value) {
    const new_keys = keys.slice();
    const key = new_keys.shift();

    if (new_keys.length > 0) {
        if (target[key] === undefined) {
            target[key] = {};
        }

        recursive_set(target[key], new_keys, value);
    } else {
        target[key] = value;
    }
}

export function recursive_delete(target, keys) {
    const new_keys = keys.slice();
    const key = new_keys.shift();

    if (new_keys.length > 0) {
        if (target[key] === undefined) {
            return;
        }

        recursive_delete(target[key], new_keys);
    } else {
        delete target[key];
    }
}

export function array_to_map(arr, key) {
    let map = {};

    for (let i = 0, l = arr.length; i < l; i++) {
        let value = extract_data(key, arr[i]);

        if (value) {
            map[value] = arr[i];
        }
    }

    return map;
}

export function map_object(obj = {}, mapFn) {
    const result = {};

    for (const [key, value] of Object.entries(obj)) {
        result[key] = mapFn(value);
    }

    return result;
}

export function object_from_array(array, mapFn) {
    const map = {};

    for (const item of array) {
        const result = mapFn(item);
        if (!result) {
            continue;
        }

        const [key, value] = result;
        map[key] = value;
    }

    return map;
}

export function gen_sort_comp_fn(key, desc) {
    return function(a, b) {
        let comp, a_val, b_val;

        a_val = extract_data(key, a);
        b_val = extract_data(key, b);

        if (!is_set(a_val) && !is_set(b_val)) {
            return 0;
        } else if (!is_set(a_val)) {
            return 1;
        } else if (!is_set(b_val)) {
            return -1;
        }

        if (Object.isString(a_val) && Object.isString(b_val)) {
            a_val = a_val.toLowerCase();
            b_val = b_val.toLowerCase();
        }

        if (a_val < b_val) {
            comp = -1;
        } else if (a_val === b_val) {
            comp = 0;
        } else {
            comp = 1;
        }

        return desc ? comp * -1 : comp;
    };
}

export function extract_data(key, data) {
    if (data) {
        if (is_set(key)) {
            let keys = is_str(key) ? key.split(':') : [key];

            for (let i = 0, l = keys.length; i < l; i++) {
                if (data) {
                    data = data[keys[i]];
                } else {
                    return null;
                }
            }
        }

        return data;
    }

    return null;
}

export function gen_event(event_type, ...id_parts) {
    if (id_parts.length > 0) {
        return [event_type, arr_gen_id(id_parts)].join('.');
    }
    throw 'At least one id part is required for gen_event';
}

export function args_to_array(args) {
    let array = [];
    for (let i = 0, l = args.length; i < l; i++) {
        array.push(args[i]);
    }
    return array;
}

export function gen_id(...id_parts) {
    return arr_gen_id(id_parts);
}

export function arr_gen_id(args) {
    if (args.length > 0) {
        return args.join('->');
    }
    throw 'At least 1 arguments are required for gen_id';
}

export function export_rows(rows, filename) {
    let content = rows
        .map(row => {
            return row
                .map(val => {
                    return `"${String(val)}"`;
                })
                .join(',');
        })
        .join('\r\n');

    return export_content(content, filename);
}

export function export_content(content, filename, file_type = 'csv') {
    filename = filename || `export.${file_type}`;

    if (window.navigator.msSaveOrOpenBlob) {
        let blob = new Blob([decodeURIComponent(encodeURI(content))], {
            type: `text/${file_type};charset=utf-8;`,
        });
        window.navigator.msSaveBlob(blob, filename);
    } else if (window.navigator.appName === 'Microsoft Internet Explorer') {
        let iframe = document.createElement('iframe');
        iframe.style = 'display:none;';
        document.body.appendChild(iframe);

        iframe = iframe.contentWindow || iframe.contentDocument;

        iframe.document.open('text/html', 'replace');
        iframe.document.write(content);
        iframe.document.close();
        iframe.focus();
        iframe.document.execCommand('SaveAs', true, filename);
        document.body.removeChild(iframe);
    } else {
        let a = document.createElement('a');
        a.href = `data:attachment/${file_type};charset=utf-8,${encodeURI(content)}`;
        a.download = filename;
        a.style = 'visibility:hidden';

        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }
}

//Sets value after data has been loaded
export function set_dropdown_selected_value(dropdown, saved_data, key) {
    let subcription = dropdown.data.subscribe(data => {
        if (data) {
            dropdown.set_selected_value(saved_data, key, false);
            subcription.dispose();
        }
    });

    return subcription;
}

export function auto_select_compare(prop, input, default_value) {
    return function(options) {
        for (let i = 0; i < options.length; i++) {
            if (options[i][prop] === input) {
                return i;
            }
        }
        return default_value;
    };
}

//Gets attribute from selected item in dropdown
export function get_selected_attribute(dropdown, key, get_fn) {
    return ko.computed(() => {
        let selected = get_fn ? dropdown[get_fn]() : dropdown.selected();
        if (selected) {
            return get(selected, key);
        }

        return undefined;
    });
}

export function get(subject, key) {
    key = key || 'value';
    if (Object.isObject(subject)) {
        return subject[key];
    } else if (Object.isArray(subject)) {
        if (subject.length > 0) {
            return get(subject[0], key);
        }
        return undefined;
    }

    return subject;
}

//http://stackoverflow.com/a/5918791
export function browser() {
    let ua = navigator.userAgent;
    let tem;
    let M = ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];

    if (/trident/i.test(M[1])) {
        tem = /\brv[ :]+(\d+)/g.exec(ua) || [];
        return `IE ${tem[1] || ''}`;
    }
    if (M[1] === 'Chrome') {
        tem = ua.match(/\b(OPR|Edge)\/(\d+)/);
        if (tem != null) {
            return tem
                .slice(1)
                .join(' ')
                .replace('OPR', 'Opera');
        }
    }
    M = M[2] ? [M[1], M[2]] : [navigator.appName, navigator.appVersion, '-?'];
    if ((tem = ua.match(/version\/(\d+)/i)) != null) {
        M.splice(1, 1, tem[1]);
    }
    return M.join(' ');
}

//http://stackoverflow.com/a/18706818
export function os() {
    let nVer = window.navigator.appVersion;
    let nAgt = window.navigator.userAgent;
    let os = 'Unknown';
    let clientStrings = [
        {s: 'Windows 10', r: /(Windows 10.0|Windows NT 10.0)/},
        {s: 'Windows 8.1', r: /(Windows 8.1|Windows NT 6.3)/},
        {s: 'Windows 8', r: /(Windows 8|Windows NT 6.2)/},
        {s: 'Windows 7', r: /(Windows 7|Windows NT 6.1)/},
        {s: 'Windows Vista', r: /Windows NT 6.0/},
        {s: 'Windows Server 2003', r: /Windows NT 5.2/},
        {s: 'Windows XP', r: /(Windows NT 5.1|Windows XP)/},
        {s: 'Windows 2000', r: /(Windows NT 5.0|Windows 2000)/},
        {s: 'Windows ME', r: /(Win 9x 4.90|Windows ME)/},
        {s: 'Windows 98', r: /(Windows 98|Win98)/},
        {s: 'Windows 95', r: /(Windows 95|Win95|Windows_95)/},
        {s: 'Windows NT 4.0', r: /(Windows NT 4.0|WinNT4.0|WinNT|Windows NT)/},
        {s: 'Windows CE', r: /Windows CE/},
        {s: 'Windows 3.11', r: /Win16/},
        {s: 'Android', r: /Android/},
        {s: 'Open BSD', r: /OpenBSD/},
        {s: 'Sun OS', r: /SunOS/},
        {s: 'Linux', r: /(Linux|X11)/},
        {s: 'iOS', r: /(iPhone|iPad|iPod)/},
        {s: 'Mac OS X', r: /Mac OS X/},
        {s: 'Mac OS', r: /(MacPPC|MacIntel|Mac_PowerPC|Macintosh)/},
        {s: 'QNX', r: /QNX/},
        {s: 'UNIX', r: /UNIX/},
        {s: 'BeOS', r: /BeOS/},
        {s: 'OS/2', r: /OS\/2/},
        {
            s: 'Search Bot',
            r: /(nuhk|Googlebot|Yammybot|Openbot|Slurp|MSNBot|Ask Jeeves\/Teoma|ia_archiver)/,
        },
    ];
    for (let cs of clientStrings) {
        if (cs.r.test(nAgt)) {
            os = cs.s;
            break;
        }
    }

    let osVersion = 'Unknown';

    if (/Windows/.test(os)) {
        osVersion = /Windows (.*)/.exec(os)[1];
        os = 'Windows';
    }

    switch (os) {
        case 'Mac OS X':
            osVersion = /Mac OS X (10[._\d]+)/.exec(nAgt)[1];
            break;

        case 'Android':
            osVersion = /Android ([._\d]+)/.exec(nAgt)[1];
            break;

        case 'iOS':
            osVersion = /OS (\d+)_(\d+)_?(\d+)?/.exec(nVer);
            osVersion = `${osVersion[1]}.${osVersion[2]}.${osVersion[3] | 0}`;
            break;
    }
    return `${os} ${osVersion.replace(/_/g, '.')}`;
}

//http://stackoverflow.com/a/6640851
export function valid_uid(uid) {
    return /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/.test(uid);
}

export function component_id_from_event(event) {
    if (event.namespace) {
        event = event.namespace;
    }
    let split = event.split('->').last();
    return split.split('.')[0];
}

export function nl2br(str) {
    return `${str}`.replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1<br />$2');
}

/*
    match_array

    Match an array against different cases with callbacks.
    Will call the callback of the first matching pattern and
    return the return value of the callback.

    The elements not in the pattern (tail of the array) will be captured
    and sent as arguments to the callback.

    Each pattern is defined as a single array with the last element being
    the callback.

    A default callback can be supplied as a empty pattern
    (array with only the callback).

    The default case doesn't have to capture any arguments.

    # Examples (see more in tests/test_utils.js):

    ```
    let match = function(array) {
        return Utils.match_array(array,
            [1, 2, (third, fourth) => third + fourth],
            [3, 4, (third) => third],
            [(...arr) => {
                throw `Invalid array [${arr}]`;
            }]
        );
    };

    expect(match([1, 2, 3, 4])).toEqual(7); // 3 + 4
    expect(match([3, 4, 10])).toEqual(10);
    expect(() => match([6, 5])).toThrow('Invalid array [6,5]');
    ```

    # You can also capture params in the middle by using regular expressions

    ```
    let match_with_wildcards = function(array) {
        return Utils.match_array(array,
            [1, /.+/, 3, (second, fourth) => second + fourth],
            [2, /\d+/, /\d+/, 5, (second, third, sixth) => second + third + sixth],
            [() => 0]
        );
    };

    expect(match_with_wildcards([1, 2, 3, 4])).toEqual(6); // 2 + 4
    expect(match_with_wildcards([2, 3, 4, 5, 6])).toEqual(13); // 3 + 4 + 6
    expect(match_with_wildcards([6, 5])).toEqual(0);
    ```
*/
export function match_array(array, ...cases) {
    for (const [i, definition] of cases.entries()) {
        const pattern = [...definition];
        const callback = pattern.pop();

        if (typeof callback !== 'function') {
            throw oneLine`
                Invalid pattern (#${i + 1}) in Utils.match_array:
                Last element in pattern has to be a callback...
            `;
        }

        let match = true; // Match by default
        let captured = [];

        let tail_index = 0; // Keep track of what to capture at the end

        for (let [idx, value] of pattern.entries()) {
            if (idx >= array.length) {
                match = false;
                break;
            }

            // If value is regex, test for match
            if (is_regex(value)) {
                if (value.test(array[idx])) {
                    captured.push(array[idx]);
                    tail_index++;
                } else {
                    match = false;
                    break;
                }

                // If the element in the array doesn't match, this pattern failed
            } else if (array[idx] !== value) {
                match = false;
                break;
            } else {
                tail_index++;
            }
        }

        if (match) {
            captured.push(...array.slice(tail_index));
            return callback(...captured);
        }
    }

    return undefined; // Matched no pattern..
}

/**
 * Given a forest representing a set of active filters; Iterates each tree in the
 * forest and adds it into an object containing attributes and their filter values.
 *
 * Example output;
 * {
 *     style: [{
 *         name: 'Venture Capital',
 *         members: ['Seed/Early Stage', 'Expansion Stage']
 *    }, {
 *        name: 'Buyout',
 *        members: []
 *    }],
 *    geography: [{
 *        name: 'North America',
 *        members: []
 *    }]
 * }
 *
 * @param  {Object[]} active_filters A forest containing the active filters, that
 *                                   should be mapped into the final result.
 * @param  {Object[]} filter_map     An array containing objects that describe the
 *                                   mapping between filter uids and their
 *                                   identifier. Furthermore, each entry in the map
 *                                   should have an array called members, that holds
 *                                   a list of the valid sub-categories for each
 *                                   filter. These entries should contain a uid,
 *                                   and a name.
 * @return {Object}                  An object containing an entry for each active
 *                                   filter attribute. Each entry contains a name
 *                                   and a list of active sub-categories for that
 *                                   attribute. See example above.
 */
export function enum_filter_mapping(active_filters, filter_map) {
    let formatted_filters = {};
    if (!is_set(filter_map) || !is_set(active_filters)) {
        return formatted_filters;
    }

    // Go through each tree in the forest. One tree represents one attribute.
    for (let attribute_tree of active_filters) {
        // Find the mapping for this attribute
        let attribute_map = filter_map.find(({uid}) => uid == attribute_tree.uid);

        // Ensure our final result has an entry for this attribute in it.
        if (!formatted_filters[attribute_map.identifier]) {
            formatted_filters[attribute_map.identifier] = [];
        }

        // Go through each root in the active attribute and convert the root uid
        // into an actual filter name. We also find any children for the current root
        // and convert those children uids into actual filter names as well. The
        // final structure is an object that contains the root name and a list of
        // any children names.
        // NOTE: This only supports two levels of filters, as root and child level
        //       is the only things used in the FBR filters. Expand if you need more
        //       later.
        for (let active_root of attribute_tree.value.root) {
            formatted_filters[attribute_map.identifier].push({
                name: (attribute_map.members.find(({uid}) => uid == active_root) || {}).name,
                members: (attribute_tree.value.children[active_root] || [])
                    .map(c => (attribute_map.members.find(({uid}) => uid == c) || {}).name)
                    .filter(is_set),
            });
        }

        // Filter out any values where we couldn't find an appropriate mapping. This
        // ensures that we don't have any undefined values in the descriptions.
        formatted_filters[attribute_map.identifier].filter(
            ({name, members}) => is_set(name) && is_set(members),
        );
    }

    return formatted_filters;
}

/**
 * Finds the trend between two datasets, i.e. whether or not the base is
 * above/at or below the relative data, at this moment as well as for how long this
 * trend has been going on. The datasets provided are assumed to be in ascending
 * order by their time value.
 *
 * Example:
 * base = [{time: 0, value: 2}, {time: 1, value: 5}, {time: 2, value: 7}]
 * relative_data = [{time: 0, value: 3}, {time: 1, value: 4}, {time: 2, value: 6}]
 * returns = {trend: 'above', value: 5, time: 1}
 *
 * See tests for more examples.
 *
 * @param  {Object[]} base          The base to find the trend of. Array of object
 *                                  containing a time and value field.
 * @param  {Object[]} relative_data The relative data to find a trend with. Array of
 *                                  object containing a time and value field.
 * @return {Object}                 An object containing a trend value, as well as
 *                                  all of the data from the base object that is the
 *                                  first entry in the current trend.
 */
export function find_first_in_current_trend(base, relative_data) {
    // We need descending order by time for the following part of the algorithm
    let trend_data = filter_trend_data(base, relative_data);

    if (!is_set(trend_data, true)) {
        return undefined;
    }

    trend_data.reverse();

    let above = undefined;
    for (let [i, [data, relative]] of trend_data.entries()) {
        if (!is_set(above)) {
            above = data.value > relative.value;
        } else if (
            (above && data.value < relative.value) ||
            (!above && data.value > relative.value)
        ) {
            return Object.assign({}, trend_data[i - 1][0], {
                trend: above ? 'above' : 'at or below',
                since_start: false,
            });
        }
    }

    return Object.assign({}, trend_data[trend_data.length - 1][0], {
        trend: above ? 'above' : 'at or below',
        since_start: true,
    });
}

/**
 * Filters out and zipps together two trend-lines so that only
 * datapoints that overlaps (with respect to time) remain in the trend
 * lines and are grouped.
 *
 * Example:
 * base = [{time: 0, value: 2}, {time: 1, value: 5}, {time: 2, value: 7}]
 * relative_data = [{time: 0, value: 3}, {time: 1, value: 4}]
 * returns = [ [{time: 0, value: 2}, {time: 0, value: 3}],
 *             [{time: 1, value: 5}, {time: 1, value: 4}] ]
 *
 * @param {Object[]} base           The base trend-line.
 *
 * @param {Object[]} relative_data  The relative trend-line to the base.
 *
 * @param {Object[]} base           An array of zipped data points in both
 *                                  trend lines, each entry in the array
 *                                  consists of data from base and
 *                                  relative_data with the same time field.
 *
 */
export function filter_trend_data(base, relative_data) {
    if (!is_set(base) || !is_set(relative_data)) {
        return undefined;
    }

    // Find the part of combined dataset where the timestamps overlap. This
    // handles the both cases where the relative data is defined over a longer period
    // than the base data, as well as the other way around.
    let combined = [];
    let base_idx = 0;
    let relative_idx = 0;
    // Loop while we still have datapoints in either set
    while (base_idx < base.length && relative_idx < relative_data.length) {
        let base_time = base[base_idx].time;
        let relative_time = relative_data[relative_idx].time;

        // We found a timestamp that was defined in both sets, combine it and add to
        // final result
        if (base_time == relative_time) {
            combined.push([base[base_idx], relative_data[relative_idx]]);
            base_idx++;
            relative_idx++;
        } else if (base_time < relative_time) {
            // By values sorted ascending by time, we can take the next value, since
            // a value later in the array will never be smaller than the current one
            base_idx++;
        } else if (relative_time < base_time) {
            // By values sorted ascending by time, we can take the next value, since
            // a value later in the array will never be smaller than the current one
            relative_idx++;
        }
    }

    return combined;
}

/**
 * Given a base data set and a relative dataset to that base, this function
 * finds the index in the base dataset where it last MOVED above the relative
 * dataset and stayed there, i.e. NOT the last point where the data was above the
 * relative data.
 *
 * Example:
 * base          = [{value: 8, time: 8},
 *                  {value: 6, time: 6},
 *                  {value: 3, time: 5},
 *                  {value: 7, time: 4}]
 * relative_data = [{value: 7, time: 8},
 *                  {value: 5, time: 6},
 *                  {value: 4, time: 5},
 *                  {value: 3, time: 4}]
 * returns = 1
 *
 * @param  {Object[]} base           The base dataset to compare the relative data with.
 *                                   Each object in the array should contain a value
 *                                   field.
 *                                   Assumed to be sorted by time in descending order.
 * @param  {Object[]} relative_data  The relative dataset to use in comparison with the
 *                                   base. Each object in the array should contain a value
 *                                   field. Assumed to be sorted by time in descending
 *                                   order.
 * @return {int}                     The last index where the base dataset moved to a
 *                                   value higher than the relative dataset.
 */
export function find_moved_above_relative(base, relative_data) {
    if (!is_set(base) && !is_set(relative_data)) {
        return -1;
    }

    // Combine the data into one array for easier iterating and searching in the
    // data
    let combined = base.zip(relative_data).filter(([b, r]) => is_set(b) && is_set(r));

    // NOTE: Since base and relative data are orderered DESC by time, by finding
    //       the first index: we find the last point in time.

    // Find the first index where the base was above the relative data
    let base_above_relative = combined.findIndex(([b, r]) => b.value >= r.value);
    // Find the first index where the base was below the relative data
    let base_below_relative = combined.findIndex(([b, r]) => b.value < r.value);

    // If base was never above the relative dataset, findIndex returns -1 since
    // it couldn't find anything matching our condition.
    if (base_above_relative < 0) {
        return -1;
    }

    // If we found an index were base was above the relative data, but we also
    // found an earlier index where the base was below the relative data,
    // the base is currently below the relative data, but was previously above it
    if (base_below_relative >= 0 && base_below_relative < base_above_relative) {
        return -1;
    }

    // If we have an index of where the base was below the relative data, the
    // index before this must be the last index where the base was above the
    // relative data. (By assumption that base and relative data are ordered
    // desc by time)
    if (base_below_relative > 0) {
        return base_below_relative - 1;
    }

    // If we didn't find an index where the base was below the relative data,
    // we know that all elements in the base are above the relative data,
    // thus we return the last index.
    return combined.length - 1;
}

export function conditional_element(element, ...conditions) {
    let default_config = undefined;
    if (Object.isObject(element)) {
        default_config = {};
    } else if (Array.isArray(element)) {
        default_config = [];
    }

    return conditions.every(identity) ? element : default_config;
}

export function extractLayoutProps(props, whitelist) {
    if (!is_set(whitelist, true)) {
        whitelist = new Set([
            'flex',
            'width',
            'm',
            'mt',
            'mr',
            'mb',
            'ml',
            'mx',
            'my',
            'p',
            'pt',
            'pr',
            'pb',
            'pl',
            'px',
            'py',
            'order',
            'alignSelf',
            'css',
        ]);
    }
    const whitelistedProps = {};

    for (const [key, value] of Object.entries(props)) {
        if (!whitelist.has(key)) {
            continue;
        }

        whitelistedProps[key] = value;
    }

    return whitelistedProps;
}

export const interleave = sep => coll =>
    coll
        .map((v, i, a) => [
            v,
            ...(i >= a.length - 1 ? [] : [sep instanceof Function ? sep(v, i) : sep]),
        ])
        .flatten(1);
