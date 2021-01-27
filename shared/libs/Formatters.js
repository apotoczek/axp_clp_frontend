import $ from 'jquery';
import ko from 'knockout';
import * as Utils from 'src/libs/Utils';
import * as Constants from 'src/libs/Constants';
import {EntityMetaScope} from 'src/libs/Enums';
import * as self from 'src/libs/Formatters';

export function abs_abbreviated_number(val, abbreviate = true) {
    let abs = Math.abs(val);

    if (abs < 100000) {
        val = abs.round(2).format(2);
    } else if (abs < 1000000000) {
        let denom = abbreviate ? 'M' : 'million';
        val = `${(abs / 1000000).round(2).format(2)} ${denom}`;
    } else {
        let denom = abbreviate ? 'B' : 'billion';
        val = `${(abs / 1000000000).round(2).format(2)} ${denom}`;
    }

    return val;
}

export function abbreviated_number(val) {
    const sign = val / Math.abs(val);
    return `${sign > 0 ? '' : '-'}${abs_abbreviated_number(val)}`;
}

export function quartile(value, force_text, args) {
    let inverse = args.inverse || false;
    let zero_indexed = args.zero_indexed || false;

    let n = Math.round(value);

    if (zero_indexed) {
        if (inverse) {
            n = Math.abs(n - 4) - 1;
        }

        return `Q${n + 1}`;
    }
    if (inverse) {
        n = Math.abs(n - 5);
    }

    return `Q${n}`;
}

export function enumeration(value, force_text, args) {
    let mapping = args.mapping || {};

    if (value in mapping) {
        return mapping[value];
    }

    return value.titleize();
}

export function percent(value, force_text, args) {
    args = args || {};
    let force_decimals = args.force_decimals === undefined ? true : args.force_decimals;
    let decimals = args.decimals === undefined ? 2 : args.decimals;

    if (force_decimals) {
        return `${(100 * value).round(decimals).format(decimals)}%`;
    }

    return `${(100 * value).round(decimals)}%`;
}

export function multiple(value, force_text, args) {
    args = args || {};

    let decimals = args.decimals === undefined ? 2 : args.decimals;
    return `${value.round(decimals).format(decimals)}x`;
}

export function usd_delta(value, force_text) {
    if (force_text) {
        return round_cents(value);
    }

    let abs = Math.abs(value);

    let val = '$';

    if (abs < 10000) {
        val = val + abs.round(2).format(2);
    } else if (abs < 1000000000) {
        val = `${val + (abs / 1000000).round(2).format(2)} M`;
    } else {
        val = `${val + (abs / 1000000000).round(2).format(2)} B`;
    }

    if (value < 0) {
        return `-${val}`;
    }

    return `+${val}`;
}

export function inverse_quartile(value) {
    if (value <= 4 && value >= 1) {
        return Math.abs(value - 5);
    }
}

export function score(value) {
    let color = 'text-danger';

    if (value > 40) {
        color = 'text-warning';
    }

    if (value > 75) {
        color = 'text-success';
    }

    return value != null
        ? `<span class='${color}'>${value}</span>`
        : "<span class='text-muted'>N/A</span>";
}

export function money(data, force_text, args) {
    let empty = force_text ? '' : '<span class="text-muted">N/A</span>';
    let abbreviate = args.abbreviate === undefined ? true : args.abbreviate;

    // The value can be passed in as a first-level property
    // of an object. ex: data = {render_currency: "USD", ...}

    let symbol, value;

    if (Object.isObject(data) && data) {
        symbol = data[args.currency_key] || 'USD';
        value = data[args.value_key];
    } else {
        symbol = ko.unwrap(args.render_currency) || 'USD';
        value = data;
    }

    if (!Utils.is_set(value)) {
        return empty;
    }

    if (force_text) {
        return value.round(2);
    }

    let formatted;

    if (abbreviate) {
        formatted = `${symbol} ${abs_abbreviated_number(value, true)}`;
    } else {
        formatted = `${symbol} ${Math.abs(value)
            .round(2)
            .format(2)}`;
    }

    if (value < 0) {
        return `(${formatted})`;
    }

    return formatted;
}

export function usd(value, force_text, abbreviate = true) {
    if (force_text) {
        return round_cents(value);
    }

    let val = `$${abs_abbreviated_number(value, abbreviate)}`;

    if (value < 0) {
        return `(${val})`;
    }

    return val;
}

export function usd_full(value, force_text) {
    if (force_text) {
        return round_cents(value);
    }

    let abs = Math.abs(value);

    let val = '$';

    val = val + abs.round(2).format(2);

    if (value < 0) {
        return `(${val})`;
    }

    return val;
}
export function round_cents(value) {
    return value.round(2);
}

export function boolean(value, force_text, args) {
    args = args || {};
    let yes = args.yes || 'Yes';
    let no = args.no || 'No';

    return value ? yes : no;
}

export function boolean_highlight(value, force_text, args) {
    args = args || {};

    args.css = args.css || {};

    args.css.yes = args.css.yes || 'text-success';
    args.css.no = args.css.no || 'text-danger';

    if (force_text) {
        return boolean(value, force_text, args);
    }

    if (value) {
        return `<span class="${args.css.yes}">Yes</span>`;
    }

    return `<span class="${args.css.no}">No</span>`;
}

export function warning_count(value) {
    let values = value.split('/');
    let fails = values[0];
    let result = fails > 0;
    if (result) {
        return `<span class="text-warning">${value}</span>`;
    }

    return value;
}

export function failed_count(value) {
    let values = value.split('/');
    let fails = values[0];
    let result = fails > 0;
    if (result) {
        return `<span class="text-danger">${value}</span>`;
    }

    return value;
}

export function object_to_string(value, force_text, args) {
    args = args || {};

    let components = [];

    for (let [key, val] of Object.entries(value)) {
        val = val || '<span class="text-muted">N/A</span>';
        components.push(`<strong>${key}</strong>: ${val}`);
    }

    if (args.newline_interval) {
        return components
            .inGroupsOf(args.newline_interval)
            .map(g => {
                return g.compact().join(', ');
            })
            .join('<br />');
    }

    return components.join(', ');
}

export function visible_count(value) {
    return [number(value['visible_count']), 'of', number(value['count'])].join(' ');
}

export function delimited(array, force_text, args) {
    let delimiter = args.delimiter || ', ';
    return array.join(delimiter);
}

export function actions(value) {
    let actions = {
        view_market_data_lists: 'Browsed Lists',
        view_market_data_firms: 'Browsed Firms',
        view_market_data_historic_funds: 'Browsed Historic Funds',
        view_market_data_benchmark: 'Browsed Benchmarks',
        view_market_data_funds_in_market: 'Browsed Funds in Market',
        view_market_data_investors: 'Browsed Investors',
        view_market_data_investments: 'Browsed Investments',
        view_diligence_families: 'Diligence - Browsed Families',
        view_diligence_projects: 'Diligence - Browsed Projects',
        view_visual_reports: 'Browsed Visual Reports',
        view_lp_scoring: 'Browsed LP Scoring',
    };

    if (value in actions) {
        return actions[value];
    }

    return value.titleize();
}

export const irr = percent;

export function highlight_css(value, opts) {
    opts = opts || {};

    opts.css = opts.css || {};

    opts.css.good = opts.css.good || 'text-success';
    opts.css.bad = opts.css.bad || 'text-danger';
    opts.css.mediocre = opts.css.mediocre || 'text-halfmuted';
    opts.css.unavailable = opts.css.unavailable || 'text-muted';

    if (opts.threshold === undefined) {
        opts.threshold = 0;
    }

    if (value === null || value === undefined) {
        return opts.css.unavailable;
    }

    if (opts.multiplier !== undefined) {
        value = value * opts.multiplier;
    }

    if (opts.decimals !== undefined) {
        value = value.round(opts.decimals);
    }

    if (value > opts.threshold) {
        return opts.css.good;
    } else if (value == opts.threshold) {
        return opts.css.mediocre;
    }
    return opts.css.bad;
}

export function irr_highlight(value, force_text) {
    let css = highlight_css(value, {
        threshold: 0,
        decimals: 2,
        multiplier: 100,
    });

    if (force_text) {
        return percent(value);
    }

    return `<span class="${css}">${percent(value)}</span>`;
}

export function picc_highlight(value, force_text) {
    let css = highlight_css(value, {
        threshold: 100,
        decimals: 2,
        multiplier: 100,
        css: {
            bad: 'text-info',
        },
    });

    if (force_text) {
        return percent(value);
    }

    return `<span class="${css}">${percent(value)}</span>`;
}

export function percent_highlight_delta(value, force_text) {
    let css = highlight_css(value, {
        threshold: 0,
        decimals: 2,
        multiplier: 100,
        css: {
            good: 'overperform',
        },
    });

    if (force_text) {
        return percent(value);
    }

    return `<span class="${css}">${percent(value)}</span>`;
}

export function time_frame(value) {
    const text = Constants.time_frame_options.find(obj => {
        return value == obj.value;
    });

    if (text) {
        return text.label;
    }

    return '<span class="text-muted">N/A</span>';
}

export const irr_highlight_delta = percent_highlight_delta;

export function irr_neutral(value, force_text) {
    if (force_text) {
        return percent(value);
    }

    return `<span class="text-info">${percent(value)}</span>`;
}

export function irr_neutral_delta(value, force_text) {
    let css = highlight_css(value, {
        threshold: 0,
        decimals: 2,
        multiplier: 100,
        css: {
            good: 'overperform_neutral',
            bad: 'text-info',
        },
    });

    if (force_text) {
        return percent(value);
    }

    return `<span class="${css}">${percent(value)}</span>`;
}

export function multiple_highlight_delta(value, force_text) {
    let css = highlight_css(value, {
        threshold: 0,
        decimals: 2,
        css: {
            good: 'overperform',
        },
    });

    if (force_text) {
        return multiple(value);
    }

    return `<span class="${css}">${multiple(value)}</span>`;
}

export function multiple_highlight(value, force_text) {
    let css = highlight_css(value, {
        threshold: 1,
        decimals: 2,
    });

    if (force_text) {
        return multiple(value);
    }

    return `<span class="${css}">${multiple(value)}</span>`;
}

export function multiple_neutral(value, force_text) {
    if (force_text) {
        return multiple(value);
    }

    return `<span class="text-info">${multiple(value)}</span>`;
}

export function multiple_neutral_delta(value, force_text) {
    let css = highlight_css(value, {
        threshold: 0,
        decimals: 2,
        css: {
            good: 'overperform_neutral',
            bad: 'text-info',
        },
    });

    if (force_text) {
        return multiple(value);
    }

    return `<span class="${css}">${multiple(value)}</span>`;
}

export function deal_benchmark_metric_formatter(metric) {
    let _metric = 'multiple';

    switch (metric) {
        case 'irr':
        case 'acq_ebitda_margin':
        case 'acq_avg_ownership':
        case 'gross_irr':
        case 'exit_ebitda_margin':
            _metric = 'irr';
            break;
        case 'acq_ebitda':
        case 'acq_enterprise_value':
        case 'acq_equity_value':
        case 'acq_revenue':
            _metric = 'money';
            break;
    }

    return gen_formatter(_metric);
}

export function format_for_key(key) {
    return Constants.FORMAT_MAP[key];
}

export function gen_date_formatter(format, offset, multiplier, utc = true) {
    return function(timestamps) {
        if (!Object.isArray(timestamps)) {
            timestamps = [timestamps];
        }

        let _strings = timestamps.map(timestamp => {
            if (offset) {
                timestamp = timestamp + offset;
            }
            if (multiplier) {
                timestamp = timestamp * multiplier;
            }

            if (format === 'quarters') {
                let date = Date.create(timestamp).setUTC(true);
                let formatted = date.format('{yyyy}');
                let month = parseInt(date.format('{M}'));
                let quarter = 'Q1';

                if (month > 3) {
                    quarter = 'Q2';
                }
                if (month > 6) {
                    quarter = 'Q3';
                }
                if (month > 9) {
                    quarter = 'Q4';
                }

                return `${quarter} ${formatted}`;
            }

            if (utc) {
                return Date.create(timestamp)
                    .setUTC(true)
                    .format(format);
            }
            return Date.create(timestamp).format(format);
        });

        return strings(_strings, false, {});
    };
}

export const date_quarterly = gen_date_formatter('quarters');
export const date = gen_date_formatter('{Mon} {d}, {yyyy}');
export const date_short = gen_date_formatter('{Mon} {d}, {yy}');
export const datetime = gen_date_formatter('{Mon} {d}, {yyyy} - {HH}:{mm}:{ss}');
export const local_datetime = gen_date_formatter('{Mon} {d}, {yyyy} - {HH}:{mm}:{ss}', 0, 1, false);
export const date_month = gen_date_formatter('{Mon} {yyyy}');
export const date_year = gen_date_formatter('{yyyy}');

export const backend_date_short = gen_date_formatter('{Mon} {d}, {yy}', 0, 1000);
export const backend_date = gen_date_formatter('{Mon} {d}, {yyyy}', 0, 1000);
export const backend_date_monthly = gen_date_formatter('{Mon} {yy}', 0, 1000);
export const backend_date_month_day = gen_date_formatter('{Mon} {d}', 0, 1000);
export const backend_date_quarterly = gen_date_formatter('quarters', 0, 1000);
export const backend_datetime = gen_date_formatter('{Mon} {d}, {yyyy} - {HH}:{mm}:{ss}', 0, 1000);
export const backend_month = gen_date_formatter('{Mon} {yyyy}', 0, 1000);
export const backend_month_short = gen_date_formatter('{Mon}-{yy}', 0, 1000);
export const backend_date_year = gen_date_formatter('{yyyy}', 0, 1000);

export const backend_local_date = gen_date_formatter('{Mon} {d}, {yyyy}', 0, 1000, false);
export const backend_local_datetime = gen_date_formatter(
    '{Mon} {d}, {yyyy} - {HH}:{mm}:{ss}',
    0,
    1000,
    false,
);

export function gen_for_time_interval(interval) {
    switch (interval) {
        case 'monthly':
            return backend_date_monthly;
        case 'quarterly':
            return backend_date_quarterly;
        case 'annual':
            return backend_date_year;
        default:
            return backend_date_short;
    }
}

export function _date_range(date_formatter) {
    return function(range, force_text) {
        if (Object.isObject(range) && range.start && range.end) {
            return [date_formatter(range.start), date_formatter(range.end)].join(' - ');
        } else if (Object.isArray(range) && range.length === 2) {
            return [date_formatter(range[0]), date_formatter(range[1])].join(' - ');
        }
        return force_text ? '' : '<span class="text-muted">N/A</span>';
    };
}

export const backend_date_range = _date_range(backend_date);
export const date_range = _date_range(date);

export function add_seconds(num) {
    return `${num.toFixed(2)}s`;
}

export function is_pending(data) {
    return data ? 'Pending' : 'Verified';
}

export function weighted_strings(maybe_pairs, force_text, format_args) {
    if (Object.isArray(maybe_pairs)) {
        return strings(
            maybe_pairs.map(maybe_pair => {
                if (Object.isArray(maybe_pair)) {
                    return [
                        percent(maybe_pair[0], force_text, {force_decimals: false}),
                        maybe_pair[1],
                    ].join(' ');
                }
                return maybe_pair;
            }),
            force_text,
            format_args,
        );
    }

    return maybe_pairs;
}

export function strings(strings, force_text, format_args) {
    let len = format_args.len || 3;

    if (Object.isArray(strings)) {
        if (strings.length == 0) {
            if (force_text) {
                return '';
            }
            return '<span class="text-muted">N/A</span>';
        }

        if (force_text) {
            return format_array(strings, len, 'other');
        }

        if (strings.length > len) {
            return `<span rel="tooltip" title="${format_array(strings)}">${format_array(
                strings,
                len,
                'other',
            )}</span>`;
        }

        return format_array(strings, len, 'other');
    }
    return strings;
}

export function strings_full(strings, force_text) {
    if (Object.isArray(strings)) {
        if (strings.length == 0) {
            if (force_text) {
                return '';
            }
            return '<span class="text-muted">N/A</span>';
        }

        return format_array(strings);
    }
    return strings;
}

export function titleize(string) {
    return string.titleize();
}

/**
 * Takes an array of elements and returns a string representation of their
 * enumeration. For example, given the array ['Simon', 'Pat', 'Waldron'] the returned
 * string will be Simon, Pat, and Waldron.
 *
 * @param  {[Object]} array An array of elements that can be converted into strings
 * @return {string}         A string representation of the enumerated array.
 */
export function formatted_listing(array, _force_text, args = {}) {
    const {separator = ','} = args;
    if (array.length == 1) {
        return `${array.first()}`;
    } else if (array.length <= 2) {
        return array.join(' and ');
    }

    let initial = array.first(array.length - 1).join(`${separator} `);
    return `${initial}${separator} and ${array.last()}`;
}

export function year_listing(years) {
    if (years.length == 0) {
        return '';
    }

    let sorted_years = years.sort((l, r) => l - r);

    // Check if we have a continuous set of years, i.e. there is no missing year
    // in a range. If there is only one year selected, we can skip.
    let is_continuous =
        sorted_years.length > 1 &&
        sorted_years.every((year, i, years) => i == years.length - 1 || year == years[i + 1] - 1);

    let result = '';
    if (is_continuous) {
        result += `${sorted_years.first()} - ${sorted_years.last()}`;
    } else {
        result += formatted_listing(sorted_years);
    }

    return result;
}

/**
 * Returns the titleized version of input param if no case is provided.
 * @param {string} entity_type string from backend
 * @returns {string} humanized version of entity_type
 */
export function entity_type(entity_type) {
    switch (entity_type) {
        case 'user_fund':
            return 'Fund';
        case 'lp_insider_report':
        case 'lp_report':
            return 'LP Report';
        default:
            return titleize(entity_type);
    }
}

export function market_entity_url(entity) {
    let base_url = '#!';

    switch (entity.entity_type) {
        case 'fund':
            return [base_url, 'funds', entity.uid].join('/');
        case 'investor':
            return [base_url, 'investors', entity.uid].join('/');
        case 'firm':
            return [base_url, 'firms', entity.uid].join('/');
    }
}

export function entity_url(entity, force_text, args) {
    args = args || {};
    let base_url = args.base_url || '#!/analytics';

    switch (entity.entity_type) {
        case 'user_fund':
            return [base_url, 'fund', entity.cashflow_type, entity.user_fund_uid].join('/');
        case 'portfolio':
            return [base_url, 'portfolio', entity.cashflow_type, entity.portfolio_uid].join('/');
        case 'bison_fund':
            return [base_url, 'bison', entity.user_fund_uid].join('/');
        case 'index':
            return [base_url, entity.id].join('/');
        case 'attributes':
            return [base_url, entity.uid].join('/');
        case 'report':
            if (entity.report_type == 'visual_report') {
                if (entity.frozen_date) {
                    return [base_url, entity.sub_type, 'view', entity.uid].join('/');
                }
                return [base_url, entity.sub_type, 'edit', entity.uid].join('/');
            }
            break;
        case 'company':
        case 'deal':
            return [base_url, 'deal', entity.company_uid].join('/');
    }
}

export function entity_analytics_url(entity) {
    // Determine an aggregated entity type. For example analytics doesn't user `user_fund`
    // it only has `fund` in the url instead.
    let aggregated_entity_type;
    if (entity.entity_type === 'user_fund') {
        aggregated_entity_type = 'fund';
    } else {
        aggregated_entity_type = entity.entity_type;
    }

    // Now construct the final url using this aggregated entity type.
    const base_url = `#!/${aggregated_entity_type}-analytics`;
    return entity_url(entity, false, {base_url});
}

export function entity_edit_url(entity) {
    const entity_type = entity.entity_type;
    const remote_entity = entity.is_remote_entity;

    if (entity_type === 'portfolio') {
        if (remote_entity) {
            return `#!/data-manager/vehicles/remote/portfolio/${entity.cashflow_type}/${entity.portfolio_uid}`;
        }
        return `#!/data-manager/vehicles/portfolio/${entity.cashflow_type}/${entity.portfolio_uid}`;
    } else if (entity_type === 'user_fund') {
        if (remote_entity) {
            return `#!/data-manager/vehicles/remote/fund/${entity.cashflow_type}/${entity.user_fund_uid}`;
        }
        return `#!/data-manager/vehicles/fund/${entity.cashflow_type}/${entity.user_fund_uid}`;
    } else if (entity_type === 'index') {
        return `#!/data-manager/indexes/${entity.market_id}`;
    } else if (entity_type === 'company') {
        return `#!/data-manager/vehicles/company/${entity.company_uid}`;
    }
}

export function url(data, force_text, args) {
    return `${args.base_url}/${data[args.url_key]}`;
}

export function link(data, force_text, args) {
    let label;

    if (data && data[args.label_key]) {
        label = data[args.label_key];
    } else if (args.label) {
        label = args.label;
    } else {
        if (force_text) {
            return '';
        }

        return '<span class="text-muted">N/A</span>';
    }

    if (force_text) {
        return label;
    }

    let link_class = args.link_class || '';

    if (label.length > 50) {
        return `<a class="${link_class}" rel="tooltip" title="${label}" href="${url(
            data,
            force_text,
            args,
        )}">${label.truncate(50)}</a>`;
    }

    return `<a class="${link_class}" href="${url(data, force_text, args)}">${label}</a>`;
}

export function list_entity_link(entity, force_text) {
    if (force_text) {
        return entity.name;
    }

    switch (entity.entity_type) {
        case 'fund':
            return `<a href="#!/funds/${entity.uid}">${entity.name}</a>`;
        case 'investor':
            return `<a href="#!/investors/${entity.uid}">${entity.name}</a>`;
        case 'firm':
            return `<a href="#!/firms/${entity.uid}">${entity.name}</a>`;
        case 'family':
            return `<a href="#!/families/${entity.uid}">${entity.name}</a>`;
        default:
            return entity.name;
    }
}

export function highlight_if_update(data, force_text, args) {
    let updated_property = args.updated_property || 'update_keys';
    let updated_keys = data[updated_property];

    let formatter = gen_formatter(args);
    let key = args.key || args.value_key;

    if (args.value_key) {
        data = Utils.extract_data(args.value_key, data);
    }

    if (key && updated_keys && updated_keys.indexOf(key) >= 0) {
        return highlighted(formatter(data));
    }

    return formatter(data);
}

export function highlighted(input) {
    return `<span style="color:#3AC376">${input}</span>`;
}

export function entity_link(entity, force_text, args) {
    let name;

    if (entity) {
        if (args.name_key) {
            name = entity[args.name_key];
        } else if (entity.name) {
            name = entity.name;
        } else {
            name = 'Untitled';
        }
    } else {
        if (force_text) {
            return '';
        }

        return '<span class="text-muted">N/A</span>';
    }

    if (force_text) {
        return name;
    }

    if (args.url) {
        return contextual_entity_link(args.url, entity, name);
    }

    if (name.length > 50) {
        return `<a rel="tooltip" title="${name}" href="${entity_url(
            entity,
            force_text,
            args,
        )}">${name.truncate(50)}</a>`;
    }

    return `<a href="${entity_url(entity, force_text, args)}">${name}</a>`;
}

/**
 *   Acts as a wrapper for contextual link with the additional ability
 *   to force text based on data in obj.
 *   @param {function} args.exclude dictates force_text and gets passed obj
 *   @returns {string} contextual_link
 */
export function contextual_link_with_exclude(obj, force_text, args) {
    return contextual_link(
        obj,
        force_text || typeof args.exclude === 'function' ? args.exclude(obj) : false,
        args,
    );
}

export function contextual_link(obj, force_text, args) {
    let label;
    let cssClass = '';

    if (args.label) {
        label = args.label;
    } else if (args.label_key) {
        label = Utils.extract_data(args.label_key, obj);
    }

    if (args.cssClass) {
        cssClass = `class="${args.cssClass}"`;
    }

    if (args.visible_toggle_property) {
        if (!obj[args.visible_toggle_property]) {
            return '';
        }
    }

    let url = Utils.contextual_url(obj, args);

    if (label) {
        if (force_text) {
            return label;
        }
        return `<a ${cssClass} href="${url}">${label}</a>`;
    }

    return force_text ? '' : '<span class="text-muted">N/A</span>';
}

export function contextual_entity_link(context, entity, name) {
    let contexts = context.split('.');
    let url = '#!/';
    for (const c of contexts) {
        switch (c) {
            case 'entity_type':
                url += `${entity.entity_type}/`;
                break;
            case 'user_fund_uid':
                url += `${entity.user_fund_uid}/`;
                break;
            case 'uid':
                url += `${entity.uid}/`;
                break;
            case 'fund_uid':
                url += `${entity.fund_uid}/`;
                break;
            case 'firm_uid':
                url += `${entity.firm_uid}/`;
                break;
            case 'investor_uid':
                url += `${entity.investor_uid}/`;
                break;
            case 'attribute_uid':
                url += `${entity.uid}/`;
                break;
            default:
                url += `${c}/`;
                break;
        }
    }

    if (url.last() === '/') {
        url = url.slice(0, -1);
    }

    return `<a href="${url}">${name}</a>`;
}

export function external_link(data, force_text, args) {
    args = args || {};

    let url = args.url_key ? data[args.url_key] : data;
    let label = args.label_key ? data[args.label_key] : data;

    if (!url || !label) {
        return force_text ? '' : '<span class="text-muted">N/A</span>';
    }

    if (label.startsWith('http')) {
        label = label.remove('http://').remove('https://');
    }

    if (!url.startsWith('http')) {
        url = `http://${url}`;
    }

    let truncate_length = args.truncate_length || args.max_length || false;

    if (truncate_length) {
        label = label.truncate(truncate_length);
    }

    if (force_text) {
        return label;
    }

    return `<a target="_blank" href="${url}">${label}</a>`;
}

export function years(years) {
    return `${years.round(1).format()} yrs`;
}

export function colored_number(value, force_text, args) {
    let formatted = number(value, force_text, args);

    if (force_text) {
        return formatted;
    }

    if (args.color) {
        return `<span style="color: ${args.color};">${formatted}</span>`;
    }

    return formatted;
}

export function maybe_number(val, force_text, args) {
    args = args || {};

    let decimals = args.decimals || 2;

    if (isNaN(parseFloat(val))) {
        return val;
    }

    return val.round(decimals).format();
}

export function number(val, force_text, args) {
    args = args || {};
    let decimals = args.decimals || 2;
    return val.round(decimals).format();
}

export function no_format(val) {
    return val;
}

export function bold(val, force_text, args) {
    let activation_key = args.activation_key;
    let value_key = args.value_key;
    let inner_formatter = args.inner_formatter;
    let res = val;

    if (value_key) {
        res = res[value_key];
        if (res === undefined) {
            return '<span class="text-muted">N/A</span>';
        }
    }

    if (inner_formatter) {
        let formatter = gen_formatter(inner_formatter);
        if (formatter) {
            res = formatter(res);
        }
    }

    if (val[activation_key]) {
        res = `<b> ${res} </b>`;
    }
    return res;
}

export function cf_type(type, force_text) {
    if (Utils.is_set(type)) {
        switch (type) {
            case 'nav':
                return 'Net Asset Value';
            case 'contrib':
                return 'Contribution';
            case 'distrib':
                return 'Distribution';
            default:
                return type;
        }
    }

    if (force_text) {
        return '';
    }
    return '<span class="text-muted">N/A</span>';
}

export function truncate(value, force_text, args) {
    args = args || {};
    if (force_text) {
        return value;
    }
    let max_len = args.max_length || 30;
    if (value.length > max_len) {
        return `<span rel="tooltip" title="${value}">${value.truncate(max_len)}</span>`;
    }

    return value;
}

export function gen_status_formatter(colorByValue, defaultColor) {
    return value => {
        const upperValue = value.toUpperCase();

        const color = colorByValue[upperValue] || defaultColor;

        return `<span style='color: ${color};'>${upperValue}</span>`;
    };
}

export function entity_meta_scope(value) {
    for (const [name, key] of Object.entries(EntityMetaScope)) {
        if (key === value) {
            return name.titleize();
        }
    }
}

export function market_status_highlight(value) {
    if (value === 'Out of Market') {
        return ['<span class="text-muted">', value, '</span>'].join('');
    }
    if (value === 'Fundraising') {
        return ['<span class="text-primary">', value, '</span>'].join('');
    }
    if (value === 'First Close') {
        return ['<span class="text-success">', value, '</span>'].join('');
    }
}

export function activity_title(activity) {
    if (activity.activity_type_str == 'BENCHMARK_PUBLISHED') {
        let preliminary = activity.data.preliminary;
        let provider = activity.data.provider;
        let as_of_date = backend_date_quarterly(activity.data.as_of_date);
        let prel_str = preliminary ? 'Preliminary' : '';

        return `${as_of_date} ${prel_str} ${provider} Benchmark was published`;
    } else if (activity.activity_type_str == 'DATA_ADDED') {
        let type = entity_type(activity.data.entity_type).toLowerCase();
        let count = activity.data.count;

        if (count > 1) {
            type = `${type}s`;
        }

        return `${activity.data.count} new ${type} uploaded to our database`;
    } else if (activity.activity_type_str == 'CUSTOM') {
        if (activity.data.body) {
            return `<span title="${activity.data.body}">${activity.data.title}</span>`;
        }

        return activity.data.title;
    }
}

export function gen_formatter(opts, force_text = false) {
    let empty = force_text ? '' : '<span class="text-muted">N/A</span>';
    let format, args, default_value;

    if (Object.isObject(opts)) {
        format = opts.format;
        args = opts.format_args || {};
        default_value = opts.default_value || empty;
    } else {
        format = opts;
        args = {};
        default_value = empty;
    }

    if (typeof format === 'number') {
        format = Constants.format_options.find(format_option => {
            return format_option.value === format;
        })['format'];
    }

    return function(data) {
        if (Utils.is_set(data, true)) {
            // eslint-disable-next-line no-undef
            if (format && typeof self[format] === 'function') {
                // eslint-disable-next-line no-undef
                return self[format](data, force_text, args);
            } else if (format && typeof format === 'function') {
                return format(data, force_text, args);
            }
            return data;
        }
        return default_value;
    };
}

export function report_draft(entity, force_text, args) {
    let _entity_link = entity_link(entity, force_text, args);

    return _entity_link;
}

export function model_report_url(entity) {
    let params = entity.params;
    let base_url = '#!/fund-modeler/view';

    return `${base_url}/${params.entity_type || 'investor'}/${params.user_fund_uid}/${
        params.comp_entity_uid
    }`;
}

export function model_report_link(entity) {
    let url = model_report_url(entity);

    return `<a href="${url}">${entity.name}</a>`;
}

export function view_report_archive_link(entity) {
    let link = undefined;
    switch (entity.report_type) {
        case 'fund_modeler_report':
            return '';
        case 'visual_report':
            if (entity.is_frozen) {
                link = report_draft(entity, undefined, {
                    base_url: '#!/visual-reports',
                    label_key: 'name',
                    published_key: 'is_frozen',
                });
            }
            break;
        case 'data_report':
            link = contextual_link(entity, undefined, {
                url: 'data-reports/<sub_type>/<uid>',
                label_key: 'name',
            });
            break;
        default:
            break;
    }

    if (link) {
        let $link = $(link);
        $link.addClass('btn btn-ghost-default btn-xs report-archive-action').text('View');

        return $link[0].outerHTML;
    }

    return '';
}

export function rerun_report_archive_link(entity) {
    switch (entity.report_type) {
        case 'fund_modeler_report':
            return model_report_url(entity);
        case 'data_report':
            return `#!/data-reports/${entity.sub_type}/rerun/${entity.uid}`;
        default:
            return undefined;
    }
}

export function finished_report(entity, force_text, args) {
    let _entity_link = entity_link(entity, force_text, args);
    let href = $(_entity_link).attr('href');
    let text = $(_entity_link).html();

    return `<a href="${href}" class="btn btn-block btn-ghost-default clearfix"><span class="btn-label btn-ellipsis pull-left">${text}</span></a>`;
}

export function date_or_pending(entity) {
    if (entity.last_update_request) {
        // if last_update is null, will evaluate to false
        return entity.last_update < entity.last_update_request
            ? 'Pending'
            : backend_date(entity.last_update);
    }
    if (entity.last_update) {
        return backend_date(entity.last_update);
    }
    return 'N/A';
}

export function format_array(arr, num_show, abbrev) {
    if (arr && arr.length > 0) {
        arr = [...arr];

        if (arr.length > 1) {
            if (num_show !== undefined && num_show < arr.length) {
                let others = arr.splice(num_show, arr.length);
                if (abbrev != undefined) {
                    if (others.length > 1) {
                        arr.push(`${others.length} ${abbrev}s`);
                    } else {
                        arr.push(`${others.length} ${abbrev}`);
                    }
                }
            }
            let last = arr.splice(arr.length - 1, arr.length);
            return `${arr.join(', ')} and ${last[0]}`;
        }
        return arr[0];
    }
}
