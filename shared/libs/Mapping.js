import * as Utils from 'src/libs/Utils';
import * as Formatters from 'src/libs/Formatters';
import * as self from 'src/libs/Mapping';
import moment from 'moment';

export function filter_object(subject, args) {
    let new_obj = {};

    for (let [key, new_key] of Object.entries(args.key_map)) {
        new_obj[new_key] = subject[key];
    }

    return new_obj;
}

export const serialize = Utils.serialize;
export const slugify = Utils.slugify;
export const underscore = str => str.underscore();

export function multiple_to_tvpi(data) {
    if (data.multiple) {
        data.tvpi = data.multiple;
    }

    return data;
}

export function vehicle_to_market_data(vehicle) {
    let market_data = {...vehicle};

    market_data.multiple = market_data.tvpi;
    market_data.target_size_usd = market_data.commitment;
    market_data.target_size_value = market_data.commitment;
    market_data.target_size_currency = market_data.base_currency;

    return market_data;
}

export function vehicle_to_benchmark_item(vehicle) {
    let item = {...vehicle};

    item.target_size = item.commitment;
    item.currency_sym = item.render_currency;

    return item;
}

export function market_data_to_vehicle(market_data, args) {
    let vehicle;

    if (args.list) {
        let tmp = [];
        for (let i = 0, l = market_data.length; i < l; i++) {
            vehicle = {...market_data[i]};
            if (vehicle.entity_type == 'fund') {
                vehicle.tvpi = market_data[i].multiple;
                vehicle.commitment = market_data[i].target_size_usd;
                tmp.push(vehicle);
            }
        }
        return tmp;
    }

    vehicle = {...market_data};
    vehicle.tvpi = market_data.multiple;
    vehicle.commitment = market_data.target_size_usd;

    return vehicle;
}

export function build_tiered_checklist_tree(options, args) {
    return Utils.build_tiered_checklist_tree(options, args);
}

export function backend_date_to_option(date) {
    return {
        value: date,
        label: Formatters.backend_date(date),
    };
}

export function backend_dates_to_options(dates, args) {
    let extra_options = args.extra_options || [];

    let options = dates.map(backend_date_to_option);

    if (extra_options) {
        for (let option of extra_options) {
            let idx = option.index || 0;
            options.splice(idx, 0, option);
        }
    }

    return options;
}

export function list_to_map(list, args) {
    args = args || {};
    let map = {};

    for (let i = 0, l = list.length; i < l; i++) {
        map[Utils.get(list[i], args.key)] = args.value || Utils.get(list[i], args.value_key);
    }

    return map;
}

export function list_to_options(subject, args) {
    let options = [];
    let formatter = Formatters.gen_formatter(args);
    for (let i = 0, l = subject.length; i < l; i++) {
        options.push({
            label: formatter(subject[i]),
            value: subject[i],
        });
    }

    return options;
}

export function list_to_string_options(subject, args) {
    return list_to_options(subject, args).map(opt => {
        return {
            label: opt.label,
            value: String(opt.value),
        };
    });
}

export function list_to_label_and_value(subject, args) {
    let options = [];
    let key = args.key || 'value';
    let data = Utils.get(subject, key);

    for (let i = 0, l = data.length; i < l; i++) {
        options.push({
            label: data[i],
            value: data[i],
        });
    }

    return options;
}

export function path_get(subject, args) {
    let path = args.path.split('.');
    for (let i = 0, l = path.length; i < l; i++) {
        subject = subject[path[i]];
    }
    return subject;
}

export function log(data) {
    /* eslint no-console: "off" */
    console.log('LOG-MAPPING', data);
    return data;
}

export function date_to_epoch(date) {
    let epoch = Utils.date_to_epoch(date);

    if (!isNaN(epoch) && epoch > 0 && epoch < 32535129600) {
        return epoch;
    }

    return undefined;
}

export function backend_datetimes_to_options(timestamps, args) {
    let options = timestamps.map(ts => {
        let label = moment(ts * 1000).format('MMM DD, YYYY - h:mm:ss A');
        return {
            label: label,
            value: ts,
        };
    });
    if (Utils.is_set(args.extra_options)) {
        options = [...args.extra_options, ...options];
    }
    return options;
}

export function to_options(subject, args) {
    let value_key = args.value_key || 'value';
    let label_key = args.label_key || 'label';
    let label_keys = args.label_keys || [];

    let additional_keys = args.additional_keys || [];

    let extra_options = args.extra_options;

    let options = [];

    for (let i = 0, l = subject.length; i < l; i++) {
        let label;
        if (label_keys && label_keys.length > 0) {
            label = label_keys
                .map(val => {
                    if (Object.isObject(val) && val.key) {
                        let formatter = Formatters.gen_formatter(val);
                        return formatter(subject[i][val.key]);
                    }
                    return subject[i][val];
                })
                .join(' - ');
        } else {
            label = subject[i][label_key];
        }

        let option = {
            label: label,
            value: subject[i][value_key],
        };

        for (let j = 0, l2 = additional_keys.length; j < l2; j++) {
            let key = additional_keys[j];
            option[key] = subject[i][key];
        }

        options.push(option);
    }

    if (extra_options) {
        for (let option of extra_options) {
            let idx = option.index || 0;
            options.splice(idx, 0, option);
        }
    }
    return options;
}

export function to_grouping_options(subject, args) {
    let options = to_options(subject, args);

    let custom_array = [];
    let default_array = [];

    options.map(option => {
        if (option.is_custom) {
            custom_array.push(option);
        } else {
            default_array.push(option);
        }
    });

    let sorter = function(a, b) {
        let textA = a.label.toLowerCase();
        let textB = b.label.toLowerCase();

        return textA < textB ? -1 : 1;
    };

    custom_array.sort(sorter);
    default_array.sort(sorter);

    let final_options = custom_array.concat(default_array);

    return final_options;
}

export function to_self_encapsulated_options(subject, args) {
    let label_key = args.label_key || 'label';
    let options = [];

    for (let i = 0, l = subject.length; i < l; i++) {
        let label = subject[i][label_key];

        let selected = false;

        if (args.selected) {
            selected = subject[i][args.selected] || false;
        }

        let option = {
            label: label,
            data: subject[i],
            selected: selected,
            value: subject[i].uid,
        };

        options.push(option);
    }

    return options;
}

export function get_value(subject) {
    return get(subject, 'value');
}

export function get_first(subject) {
    if (subject && Object.isArray(subject) && subject.length > 0) {
        return subject[0];
    }
}

export function get_values(subject, args) {
    let values = [];

    if (Object.isArray(subject)) {
        for (let i = 0, l = subject.length; i < l; i++) {
            values.push(get(subject[i], args));
        }
    }
    return values;
}

export function get(subject, args) {
    let key = args.key || 'value';
    return Utils.get(subject, key);
}

export function count(subject, args) {
    if (typeof args.transform === 'function') {
        subject = args.transform(subject);
    }

    if (Object.isArray(subject)) {
        return subject.length;
    } else if (Object.isObject(subject)) {
        return Object.size(subject);
    }

    return undefined;
}

export function list_to_label_and_index(subject, args) {
    let key = args.key || 'value';
    let reverse_list = args.reverse_list || false;

    let data = Utils.get(subject, key);
    let arr = [];

    if (Array.isArray(data)) {
        for (let i = 0, j = data.length; i < j; i++) {
            arr.push({
                label: data[i],
                value: data[i],
                index: i,
            });
        }

        return reverse_list ? arr.reverse() : arr;
    }

    return data;
}

export function benchmark_vintages_to_label_and_value(subject, args) {
    let key = args.key || 'value';
    let data = Utils.get(subject, key);
    let res = [];
    if (Array.isArray(data)) {
        for (let i = 0, j = data.length; i < j; i++) {
            let value = data[i].split(' - ');
            res.push({
                label: data[i],
                value:
                    value.length > 1
                        ? value.map(n => {
                              return parseInt(n);
                          })
                        : parseInt(value[0]),
            });
        }
    }
    return res;
}

export function recursive_get(subject, args) {
    return Utils.recursive_get(subject, args.keys || []);
}

export function market_to_data_and_inner_state(subject) {
    let ret = {
        data: subject,
    };

    if (subject.market_id) {
        ret.state = subject.market_id;
    }
    return ret;
}

export function to_grid(subject, args) {
    if (args.columns) {
        return subject.map(row => {
            return args.columns.map(column => {
                return row[column];
            });
        });
    }
}

export function to_list(subject) {
    return [subject];
}

export function filter(subject, args) {
    return subject.filter(data => {
        if (args.key && args.value) {
            return data[args.key] === args.value;
        } else if (args.filter_fn) {
            return args.filter_fn(data);
        } else if (args.key && args.values) {
            return args.values.indexOf(data[args.key]) > -1;
        }
    });
}

export function sort(subject, args) {
    if (Array.isArray(subject)) {
        return subject.sortBy(args.key || args.sort_key, args.desc);
    }
    return subject;
}

export function cf_type_to_data_and_inner_state(subject) {
    return {
        data: subject,
        state: [{value: subject.cf_type}],
    };
}

export function attr_to_data_and_inner_state(subject, args) {
    return {
        data: subject,
        state: [{value: subject[args]}],
    };
}

export const entity_url = Formatters.entity_url;

export function name_to_label(subject) {
    if (Array.isArray(subject)) {
        for (let i = 0, j = subject.length; i < j; i++) {
            subject[i].label = subject[i].name;
        }
    }
    return subject;
}

export function apply_parent(subject, args) {
    let parent = args.parent;
    if (parent && subject && subject.length) {
        for (let i = 0, j = subject.length; i < j; i++) {
            subject[i].parent = parent;
        }
    }
    return subject;
}

export function clean_website(subject) {
    if (subject.website) {
        if (!subject.website.includes('http')) {
            subject.website = `http://${subject.website}`;
        }
    }
    return subject;
}

//Object.isEmpty handles array aswell!
export const empty_object_to_undefined = subject => (Object.isEmpty(subject) ? undefined : subject);
export function keyed_timeseries_to_rows(keyed_timeseries, default_value = undefined) {
    /**
     * Converts a object of time series to an array of rows:
     *
     * Example:
     *
     * {
     *     irr: [[<Dec 31, 2008>, 0.11], [<Mar 31, 2009>, 0.09], ...],
     *     tvpi: [[<Dec 31, 2008>, 1.2], [<Mar 31, 2009>, 0.23], ...],
     * }
     *
     * is converted to:
     *
     * [
     *     { date: <Dec 31, 2008>, irr: 0.11, tvpi: 1.2 },
     *     { date: <Mar 31, 2009>, irr: 0.09, tvpi: 0.23 },
     *     ...
     * ]
     *
     * which would be appropriate to put in a table.
     *
     */
    let all_dates = new Set();

    let values_by_type = {};

    for (let [key, values] of Object.entries(keyed_timeseries)) {
        values_by_type[key] = new Map(values);

        for (let [date, _] of values_by_type[key]) {
            all_dates.add(date);
        }
    }

    let dates = Array.from(all_dates).sort((a, b) => a - b);

    let rows = [];

    for (let date of dates) {
        let row = {
            date: date,
        };

        for (let [key, values] of Object.entries(values_by_type)) {
            row[key] = values.get(date) || default_value;
        }

        rows.push(row);
    }

    return rows;
}

/**
 * Takes a type of entity and converts it into its singular form.
 *
 * @param {String} entityType The entity type to convert into singular form
 *
 * @memberOf module:spec-engine
 */
export function singularizeEntityType(entityType) {
    return changeEntityTypePlurality(entityType.camelize(false), {
        userFunds: 'userFund',
        companies: 'company',
        deals: 'deal',
        portfolios: 'portfolio',
    });
}

/**
 * Takes a type of entity and converts it into its pluralized form.
 *
 * @param {String} entityType The entity type to convert into pluralized form
 *
 * @memberOf module:spec-engine
 */
export function pluralizeEntityType(entityType) {
    return changeEntityTypePlurality(entityType.camelize(false), {
        userFund: 'userFunds',
        company: 'companies',
        deal: 'deals',
        portfolio: 'portfolios',
    });
}

function changeEntityTypePlurality(entityType, map) {
    if (Object.keys(map).indexOf(entityType) > -1) {
        return map[entityType];
    }

    if (Object.values(map).indexOf(entityType) > -1) {
        return entityType;
    }

    return undefined;
}

export function grouped_text_data(text_data_values) {
    const groups = {};

    for (const item of text_data_values) {
        const key = `${item.spec.group.uid}${item.as_of_date}`;

        if (!groups[key]) {
            groups[key] = {
                label: item.spec.group.label,
                subLabel: Formatters.backend_date(item.as_of_date),
                values: [],
            };
        }

        groups[key].values.push({
            label: item.spec.label,
            value: item.value,
        });
    }

    return Object.values(groups);
}

export function gen_mapping(opts) {
    let mapping, args, default_value;

    if (Object.isObject(opts)) {
        mapping = opts.mapping;
        args = opts.mapping_args || {};
        default_value = opts.mapping_default || undefined;
    } else {
        mapping = opts;
        args = {};
        default_value = undefined;
    }

    return function(data) {
        if (data !== undefined && data !== null) {
            if (typeof mapping === 'function') {
                return mapping(data, args);
                // eslint-disable-next-line no-undef
            } else if (mapping && typeof self[mapping] === 'function') {
                // eslint-disable-next-line no-undef
                return self[mapping](data, args);
            }
            return data;
        }
        return default_value;
    };
}

export function get_tiered_breakdown_key(opts) {
    return opts.leaves[0];
}
