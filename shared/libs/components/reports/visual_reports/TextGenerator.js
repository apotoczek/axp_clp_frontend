/* Automatically transformed from AMD to ES6. Beware of code smell. */
/**
 * A generator for constructing the descriptions used for the different graphs in the FBR
 * report. Generally, this things works as such that it takes a set of events, listens
 * to these events and whenever the they are triggered, the new value is stored locally.
 * This local value is used to construct a pureComputed that thus updates whenever the
 * locally stored values do.
 *
 * We need to store the active filter values locally since the text in different parts
 * of the descriptions can depend on the other active filters. This would make it
 * impossible to generate a perfect text simply upon an event, since at the time of the
 * event we don't have access to the other filters.
 *
 * # Guidelines:
 *      Try to keep the actual text generators as pure as possible, i.e. separate the
 *      text generation logic and the listening for events and caching the active filter
 *      values. This will allow us to refactor this thing easier at a later time.
 */
// TODO This thing could be improved significantly by removing the event listening from
//      it. This thing should really only be responsible for generating actual
//      descriptions. At the time of writing, this is not possible since FBRReport.js
//      does not store the state of the current filters.
import ko from 'knockout';
import Observer from 'src/libs/Observer';
import * as Formatters from 'src/libs/Formatters';
import * as Utils from 'src/libs/Utils';
import * as Constants from 'src/libs/Constants';

let self = {};

/**
 * Generates a description of the close peers cohort table in a FBR report. The
 * description generated depends on the currently selected filters in the FBR report,
 * and thus this method requires the events that are triggered for the dependent
 * filters.
 *
 * @param  options.enum_event         An event that fires on filter changes in
 *                                    Geography, Sector and Style / Focus.
 * @param  options.vintage_year_event An event that fires on filter change in vintage
 *                                    years.
 * @param  options.fund_size_event    An event that fires on filter change in fund
 *                                    size.
 * @param  options.attribute_map      A mapping that can be used to go from
 *                                    attribute uids (which the filters are
 *                                    represented as) to actual filter names.
 *
 * @return                            An observable that can be called to get the
 *                                    value of the description given the active
 *                                    filters.
 */
self.close_peer_set = function(
    enum_event,
    vintage_year_event,
    fund_size_event,
    attribute_map,
    lists_event,
    lists_map,
    vehicle_data,
) {
    return ko.pureComputed(() => {
        let base_text = 'The cohort is comprised of {fund_description}';

        if (!vehicle_data || !vehicle_data()) {
            return 'Waiting for data...';
        }

        let {base_currency} = vehicle_data();
        if (!Utils.is_set(base_currency)) {
            base_currency = 'USD';
        }

        let close_peer_funds_description = fund_filter_description({
            attribute_map,
            lists_map,
            lists_event,
            enum_event,
            vintage_year_event,
            fund_size_event,
            base_currency,
        })();

        if (!Utils.is_set(close_peer_funds_description)) {
            return undefined;
        }

        return base_text.replace('{fund_description}', close_peer_funds_description);
    });
};

self.net_performance = function(meta_data, vehicle_data) {
    let generate_irr_tvpi_text = (irr, prev_irr, tvpi, prev_tvpi, quarter) => {
        if (
            !Utils.is_set(irr) ||
            !Utils.is_set(prev_irr) ||
            !Utils.is_set(tvpi) ||
            !Utils.is_set(prev_tvpi) ||
            !Utils.is_set(quarter)
        ) {
            return undefined;
        }
        let result = '';

        // Format irr and tvpi for later use
        let formatted_prev_irr = Formatters.irr(prev_irr);
        let formatted_prev_tvpi = Formatters.multiple(prev_tvpi);

        irr = irr.round(2);
        prev_irr = prev_irr.round(2);
        tvpi = tvpi.round(2);
        prev_tvpi = prev_tvpi.round(2);

        if ((irr > prev_irr && tvpi > prev_tvpi) || (irr < prev_irr && tvpi < prev_tvpi)) {
            // Note we only have to check for either IRR or TVPI here
            let direction = irr > prev_irr ? 'increased' : 'decreased';

            result +=
                `IRR and TVPI ${direction} in ${quarter} from ` +
                `${formatted_prev_irr} and ${formatted_prev_tvpi} in the ` +
                'previous quarter';
        } else if (irr == prev_irr && tvpi == prev_tvpi) {
            result +=
                `IRR and TVPI both stayed the same in ${quarter} as in the ` + 'previous quarter';
        } else {
            if (irr > prev_irr) {
                result +=
                    `IRR increased in ${quarter} from ` +
                    `${formatted_prev_irr} in the previous quarter, `;
            } else if (irr < prev_irr) {
                result +=
                    `IRR decreased in ${quarter} from ` +
                    `${formatted_prev_irr} in the previous quarter, `;
            } else {
                result += `IRR stayed the same in ${quarter} as in the ` + 'previous quarter, ';
            }

            if (tvpi > prev_tvpi) {
                result += `while TVPI increased from ${formatted_prev_tvpi}`;
            } else if (tvpi < prev_tvpi) {
                result += `while TVPI decreased from ${formatted_prev_tvpi}`;
            } else {
                result += 'while TVPI stayed the same as in the previous quarter';
            }
        }

        return result;
    };

    let generate_dpi_text = (dpi, prev_dpi) => {
        let result = '';

        let formatted_prev_dpi = Formatters.multiple(prev_dpi);

        dpi = dpi.round(2);
        prev_dpi = prev_dpi.round(2);

        if (dpi < prev_dpi) {
            result += `The DPI ratio decreased from ${formatted_prev_dpi} in the previous quarter`;
        } else if (dpi > prev_dpi) {
            result += `The DPI ratio increased from ${formatted_prev_dpi} in the previous quarter`;
        } else {
            result += 'The DPI ratio stayed the same as in the previous quarter';
        }

        return result;
    };

    let generate_contr_distr_text = (distributions, contributions, base_currency) => {
        let result = 'During the quarter, ';

        let deminimis_contributions = contributions && contributions < 1000000;
        let deminimis_distributions = distributions && distributions < 1000000;

        if (deminimis_contributions && deminimis_distributions) {
            result += 'the funds capital calls and distributions were de minimis';
            return result;
        }

        if (contributions > 0) {
            if (deminimis_contributions) {
                result += 'the funds capital calls were de minimis, ';
            } else {
                result += `the fund made ${Formatters.money(contributions, false, {
                    render_currency: base_currency,
                    abbreviate: true,
                })} in capital calls, `;
            }
        } else {
            result += 'the fund made no capital calls';
        }

        if (contributions > 0) {
            if (deminimis_distributions) {
                result += 'and the funds distributions were de minimis';
            } else if (distributions) {
                result += `and ${Formatters.money(distributions, false, {
                    render_currency: base_currency,
                    abbreviate: true,
                })} in distributions`;

                if (deminimis_contributions) {
                    result += ' were made';
                }
            } else {
                result += 'and no distributions';

                if (deminimis_contributions) {
                    result += ' were made';
                }
            }
        } else {
            if (deminimis_distributions) {
                result += ' and the funds distributions were de minimis';
            } else if (distributions) {
                result += `, and a total of ${Formatters.money(distributions, false, {
                    render_currency: base_currency,
                    abbreviate: true,
                })} in distributions`;
            } else {
                result += ' nor distributions';
            }
        }

        return result;
    };

    let for_this_quarter = (as_of_date, data) => {
        if (!Utils.is_set(as_of_date) || !Utils.is_set(data)) {
            return undefined;
        }

        let prev_q_end = Utils.previous_quarter_end_date(as_of_date * 1000);
        let curr_q_end = Utils.quarter_end_date(as_of_date * 1000);

        return data.reduce(
            (sum, [time, val, ..._]) =>
                time > prev_q_end && time <= curr_q_end ? Math.abs(val) + sum : sum,
            0,
        );
    };

    return ko.pureComputed(() => {
        let base = "{fund_name}'s {irr_tvpi}. {contr_distr}. {dpi}.";

        if (!meta_data || !meta_data() || !vehicle_data || !vehicle_data()) {
            return 'Waiting for data...';
        }

        let {
            as_of_date,
            irr,
            prev_quarter_irr,
            tvpi,
            prev_quarter_tvpi,
            dpi,
            prev_quarter_dpi,
            chart_data,
            base_currency,
        } = vehicle_data();

        if (
            !Utils.is_set(prev_quarter_irr) ||
            !Utils.is_set(prev_quarter_tvpi) ||
            !Utils.is_set(prev_quarter_dpi) ||
            !Utils.is_set(as_of_date) ||
            !Utils.is_set(chart_data) ||
            !Utils.is_set(irr) ||
            !Utils.is_set(tvpi) ||
            !Utils.is_set(dpi)
        ) {
            return undefined;
        }

        if (!Utils.is_set(base_currency)) {
            base_currency = 'USD';
        }

        let {name} = meta_data();
        if (!Utils.is_set(name)) {
            return undefined;
        }

        let quarter_number = Utils.timestamp_to_quarter(as_of_date * 1000);
        if (!Utils.is_set(quarter_number)) {
            return undefined;
        }
        let quarter = `Q${quarter_number}`;
        let irr_tvpi_text = generate_irr_tvpi_text(
            irr,
            prev_quarter_irr,
            tvpi,
            prev_quarter_tvpi,
            quarter,
        );
        let dpi_text = generate_dpi_text(dpi, prev_quarter_dpi);

        let contributions = for_this_quarter(as_of_date, chart_data.contributions);
        let distributions = for_this_quarter(as_of_date, chart_data.distributions);
        let contr_distr_text = generate_contr_distr_text(
            distributions,
            contributions,
            base_currency,
        );

        if (
            !Utils.is_set(irr_tvpi_text) ||
            !Utils.is_set(dpi_text) ||
            !Utils.is_set(contr_distr_text)
        ) {
            return undefined;
        }

        return base
            .replace('{fund_name}', name)
            .replace('{irr_tvpi}', irr_tvpi_text)
            .replace('{contr_distr}', contr_distr_text)
            .replace('{dpi}', dpi_text);
    });
};

self.peer_snapshot = function(
    vehicle_data,
    vehicle_meta_data,
    peer_benchmark_data,
    enum_event,
    vintage_year_event,
    fund_size_event,
    attribute_map,
    lists_event,
    lists_map,
) {
    let generate_irr_tvpi_dpi_text = function(
        irr,
        irr_quartile,
        tvpi,
        tvpi_quartile,
        dpi,
        dpi_quartile,
    ) {
        let result = '';
        // We figure out if any of the three metrics are in the same quartile. If
        // they are, we want to group them together in the text. If they are all in
        // different quartiles, simply generate the text independently of eachother
        if (irr_quartile == tvpi_quartile && tvpi_quartile == dpi_quartile) {
            // All in the same quartile.
            result += `${irr_quartile} quartile for IRR, TVPI and DPI`;
        } else if (irr_quartile == tvpi_quartile) {
            result +=
                `${irr_quartile} quartile for IRR and TVPI, while DPI is in ` +
                `the ${dpi_quartile} quartile`;
        } else if (tvpi_quartile == dpi_quartile) {
            result +=
                `${tvpi_quartile} quartile for the TVPI and DPI, while the ` +
                `IRR is in the ${irr_quartile}`;
        } else if (irr_quartile == dpi_quartile) {
            result +=
                `${irr_quartile} quartile for the IRR and DPI, while the ` +
                `TVPI is in the ${tvpi_quartile}`;
        } else {
            result +=
                `${irr_quartile} quartile for the IRR, ` +
                `${tvpi_quartile} quartile for the TVPI, and ` +
                `${dpi_quartile} quartile for the DPI`;
        }

        return result;
    };

    let find_quartile = function(val, quartiles) {
        if (quartiles[2] && val > quartiles[2]) {
            return 'first';
        } else if (quartiles[1] && val > quartiles[1]) {
            return 'second';
        } else if (quartiles[0] && val > quartiles[0]) {
            return 'third';
        }

        return 'fourth';
    };

    return ko.pureComputed(() => {
        let base_text =
            'The benchmarking peer set selected includes ' +
            '{benchmark_funds_description} Against the composite, ' +
            '{fund_name} is located in the {irr_tvpi_dpi}.';

        if (!self.defined_observables(vehicle_meta_data, vehicle_data, peer_benchmark_data)) {
            return undefined;
        }

        let {name} = vehicle_meta_data();
        let {irr, tvpi, dpi, base_currency} = vehicle_data();
        if (
            !Utils.is_set(name) ||
            !Utils.is_set(irr) ||
            !Utils.is_set(tvpi) ||
            !Utils.is_set(dpi)
        ) {
            return undefined;
        }

        if (!Utils.is_set(base_currency)) {
            base_currency = 'USD';
        }

        let peer_irr = peer_benchmark_data().irr;
        let peer_tvpi = peer_benchmark_data().tvpi;
        let peer_dpi = peer_benchmark_data().dpi;
        if (!Utils.is_set(peer_irr) || !Utils.is_set(peer_tvpi) || !Utils.is_set(peer_dpi)) {
            return undefined;
        }

        let irr_quartile = find_quartile(irr, peer_irr.quartiles);
        let tvpi_quartile = find_quartile(tvpi, peer_tvpi.quartiles);
        let dpi_quartile = find_quartile(dpi, peer_dpi.quartiles);
        let irr_tvpi_dpi_text = generate_irr_tvpi_dpi_text(
            irr,
            irr_quartile,
            tvpi,
            tvpi_quartile,
            dpi,
            dpi_quartile,
        );

        let benchmark_funds_desc = fund_filter_description({
            vintage_year_event,
            enum_event,
            fund_size_event,
            attribute_map,
            lists_event,
            lists_map,
            base_currency,
        })();

        if (!Utils.is_set(irr_tvpi_dpi_text) || !Utils.is_set(benchmark_funds_desc)) {
            return undefined;
        }

        return base_text
            .replace('{benchmark_funds_description}', benchmark_funds_desc)
            .replace('{fund_name}', name)
            .replace('{irr_tvpi_dpi}', irr_tvpi_dpi_text);
    });
};

self.peer_trend = function(
    quartile_progression,
    vehicle_meta_data,
    vintage_year_event,
    horizon_year_event,
) {
    let vintage_years = ko.observable();
    let horizon_years = ko.observable();

    Observer.register(vintage_year_event, vintage_years);
    Observer.register(horizon_year_event, horizon_years);

    let generate_irr_tvpi_dpi_text = (irr_trend, tvpi_trend, dpi_trend, horizon_year_text) => {
        let result = "The fund's ";

        let describe = (name, data, remained = false) => {
            if (!Utils.is_set(name) || !Utils.is_set(data)) {
                return '';
            }

            let result =
                `${name} ranking has ` +
                `${remained ? 'remained' : 'been'} ` +
                `${data.trend} the median `;

            if (data.since_start) {
                result += `${horizon_year_text}`;
            } else {
                result += `since ${data.quarter} ${data.year}`;
            }

            return result;
        };

        // Figure out groupings of all trends based on whether they are
        // equal to eachother or not (equal trends in the same group).
        let trends = [
            Object.assign({}, irr_trend, {label: 'IRR'}),
            Object.assign({}, tvpi_trend, {label: 'TVPI'}),
            Object.assign({}, dpi_trend, {label: 'DPI'}),
        ].filter(({trend}) => Utils.is_set(trend));
        let grouped_trends = Object.values(
            trends.groupBy(({year, quarter, trend}) => `${year}:${quarter}:${trend}`),
        ).sortBy('length');

        // Describe each group since combining equal trends makes for nicer
        // sentences
        let descriptions = grouped_trends.map((group, i) => {
            let labels = group.map(({label}) => label);

            return (
                (i > 0 ? 'the ' : '') +
                describe(
                    Formatters.formatted_listing(labels),
                    group[0],
                    i == grouped_trends.length - 1,
                )
            );
        });
        result += Formatters.formatted_listing(descriptions);

        return result;
    };

    let generate_vintage_year_text = years =>
        Utils.is_set(years) ? Formatters.year_listing(years.map(y => y.value)) : undefined;

    let extract_sorted_metric = (metric_name, metrics) => {
        if (!Utils.is_set(metric_name) || !Utils.is_set(metrics)) {
            return undefined;
        }

        // Find the appropriate metric that we want to extract and sort
        let metric = metrics.find(d => d.key === metric_name);

        if (!Utils.is_set(metric) || !Utils.is_set(metric.data)) {
            return undefined;
        }

        // Format the metric to allow for easier sorting below
        let formatted_metric = Object.keys(metric.data).map(key => {
            let splitted_key = key.split(' ');
            return {
                year: splitted_key[1],
                quarter: splitted_key[0],
                value: metric.data[key],
            };
        });

        // This thing is a little bit weird, but it works just fine! It utilises
        // the fact that "Q3" < "Q2" == false, "Q1" < "Q4" == true, etc...
        // We first sort by year, but if the year is equal we sort by the quarter
        // instead. Meaning that we get a result like so;
        // 2017 Q1
        // 2017 Q3
        // 2018 Q2
        // ...
        formatted_metric.sort((left, right) => {
            if (left.year == right.year) {
                // Sort by the quarter, utilises "Q3" > "Q2" == true
                if (left.quarter < right.quarter) {
                    return -1;
                } else if (left.quarter > right.quarter) {
                    return 1;
                }

                // Quarter and year are equal
                return 0;
            }

            // We can simply differentiate by the year, quarter not relevant
            // since year is not equal
            return left.year - right.year;
        });

        return formatted_metric;
    };

    return ko.pureComputed(() => {
        let base =
            "The graph above shows how {fund_name}'s peer benchmark " +
            'ranking has compared to the {vintage_year} composite ' +
            '{horizon_year}. {irr_tvpi_dpi}.';

        if (
            !self.defined_observables(
                vehicle_meta_data,
                quartile_progression,
                vintage_years,
                horizon_years,
            )
        ) {
            return undefined;
        }

        let {name} = vehicle_meta_data();
        let {metrics} = quartile_progression();
        if (!Utils.is_set(name) || !Utils.is_set(metrics)) {
            return undefined;
        }

        let vintage_year_text = generate_vintage_year_text(vintage_years());
        let horizon_year_text = horizon_year_description(horizon_years());

        let irrs = extract_sorted_metric('irr', metrics);
        let tvpis = extract_sorted_metric('tvpi', metrics);
        let dpis = extract_sorted_metric('dpi', metrics);

        let irr_trend = Utils.find_first_in_current_trend(
            irrs,
            (irrs || []).map(() => ({value: 2.5})),
        );

        let tvpi_trend = Utils.find_first_in_current_trend(
            tvpis,
            (tvpis || []).map(() => ({value: 2.5})),
        );

        let dpi_trend = Utils.find_first_in_current_trend(
            dpis,
            (dpis || []).map(() => ({value: 2.5})),
        );

        let irr_tvpi_dpi_text = generate_irr_tvpi_dpi_text(
            irr_trend,
            tvpi_trend,
            dpi_trend,
            horizon_year_text,
        );

        if (
            !Utils.is_set(irr_tvpi_dpi_text) ||
            !Utils.is_set(vintage_year_text) ||
            !Utils.is_set(horizon_year_text)
        ) {
            return undefined;
        }

        return base
            .replace('{fund_name}', name)
            .replace('{vintage_year}', vintage_year_text)
            .replace('{horizon_year}', horizon_year_text)
            .replace('{irr_tvpi_dpi}', irr_tvpi_dpi_text);
    });
};

self.pme_trend = function(vehicle_meta_data, vehicle_data, pme_progression, horizon_years_event) {
    let horizon_years = ko.observable();

    Observer.register(horizon_years_event, horizon_years);

    let generate_as_of_date_text = as_of_date => {
        if (!Utils.is_set(as_of_date)) {
            return undefined;
        }

        let date = new Date(as_of_date);
        if (!date.isValid()) {
            return undefined;
        }
        let quarter = Utils.month_to_quarter(date.getMonth() + 1);
        return `Q${quarter} ${date.getFullYear()}`;
    };

    let generate_per_index_as_of_now_text = index_diffs => {
        if (!Utils.is_set(index_diffs, true)) {
            return undefined;
        }

        let result = '';

        // We group the indices into groups on whether or not our fund
        // under/out-performed the index. This allows us to construct a better
        // structured sentence.
        let performance_groups = {outperformed: [], underperformed: []};
        for (let index of Object.keys(index_diffs)) {
            if (!Utils.is_set(index_diffs[index])) {
                continue;
            }

            let group = index_diffs[index] > 0 ? 'outperformed' : 'underperformed';
            performance_groups[group].push(index);
        }

        // First add the sentence that enumerates the indices our fund outperformed
        if (performance_groups.outperformed.length) {
            result += 'outperformed ';
            result += Formatters.formatted_listing(
                performance_groups.outperformed.map(
                    index => `${index} by ${Formatters.percent(index_diffs[index])}`,
                ),
            );
        }

        // Now add the sentence that enumerates the indices out fund underperformed
        if (performance_groups.underperformed.length) {
            result += performance_groups.outperformed.length ? ', while it ' : '';
            result += 'underperformed ';
            result += Formatters.formatted_listing(
                performance_groups.underperformed.map(
                    index => `${index} by ${Formatters.percent(index_diffs[index])}`,
                ),
            );
        }

        return result;
    };

    let generate_per_index_average_text = index_diffs => {
        if (!Utils.is_set(index_diffs, true)) {
            return undefined;
        }

        let formatted_diffs = [];

        for (let name of Object.keys(index_diffs)) {
            if (!Utils.is_set(index_diffs[name])) {
                continue;
            }

            formatted_diffs.push(oneLine`
                    ${Formatters.percent(index_diffs[name])}
                    ${index_diffs[name] > 0 ? 'outperformance' : 'underperformance'}
                    against the ${name}
                `);
        }

        return Formatters.formatted_listing(formatted_diffs);
    };

    return ko.pureComputed(() => {
        let base =
            'As of {as_of_date}, {fund_name} has {per_index_as_of_now}. ' +
            '{horizon_years}, the fund has averaged ' +
            '{per_index_average}.';

        if (
            !self.defined_observables(
                pme_progression,
                vehicle_meta_data,
                vehicle_data,
                horizon_years,
            )
        ) {
            return undefined;
        }

        let {name} = vehicle_meta_data();
        let {as_of_date} = vehicle_data();
        let {diffs} = pme_progression();
        if (!Utils.is_set(name) || !Utils.is_set(as_of_date) || !Utils.is_set(diffs)) {
            return undefined;
        }

        let as_of_date_text = generate_as_of_date_text(as_of_date * 1000);

        let diff_as_of_date = {};

        for (let [key, val] of Object.entries(diffs)) {
            if (val[val.length - 1]) {
                diff_as_of_date[key] = val[val.length - 1][1];
            } else {
                diff_as_of_date[key] = undefined;
            }
        }

        let per_index_as_of_now_text = generate_per_index_as_of_now_text(diff_as_of_date);

        let diff_average = {};

        for (let [key, arr] of Object.entries(diffs)) {
            diff_average[key] = arr.sum(item => item[1]) / arr.length;
        }

        let per_index_average_text = generate_per_index_average_text(diff_average);

        let horizon_years_text = horizon_year_description(horizon_years(), true);

        if (
            !Utils.is_set(as_of_date_text) ||
            !Utils.is_set(per_index_as_of_now_text) ||
            !Utils.is_set(per_index_average_text) ||
            !Utils.is_set(horizon_years_text)
        ) {
            return undefined;
        }

        return base
            .replace('{as_of_date}', as_of_date_text)
            .replace('{fund_name}', name)
            .replace('{per_index_as_of_now}', per_index_as_of_now_text)
            .replace('{horizon_years}', horizon_years_text)
            .replace('{per_index_average}', per_index_average_text);
    });
};

self.horizon_overview = function(vehicle_meta_data, time_weighted_breakdown) {
    let generate_irr_text = irr => (Utils.is_set(irr) ? Formatters.irr(irr) : undefined);

    let generate_irr_time_weighted_text = time_weighted_irr =>
        Utils.is_set(time_weighted_irr) ? Formatters.irr(time_weighted_irr) : undefined;

    let generate_progress_during_horizon_text = (
        one_year_irr,
        three_year_irr,
        five_year_irr,
        ten_year_irr,
    ) => {
        // We cannot create any meaningful text if we dont have a one year IRR,
        // or neither of the three, five or ten year IRRs. Thus return empty if thats
        // the case.
        if (
            !Utils.is_set(one_year_irr) ||
            (!Utils.is_set(three_year_irr) &&
                !Utils.is_set(five_year_irr) &&
                !Utils.is_set(ten_year_irr))
        ) {
            return undefined;
        }

        // Compare the one-year period to the defined horizon periods in order to
        // determine the direction of the trend, and for how long this trend has
        // been going on
        let default_irr_periods = [
            {label: 'three-', value: three_year_irr},
            {label: 'five-', value: five_year_irr},
            {label: 'ten-', value: ten_year_irr},
        ].filter(period => Utils.is_set(period.value));
        let direction = one_year_irr < default_irr_periods[0].value ? 'lower' : 'higher';
        let compare = (a, b) => (one_year_irr < default_irr_periods[0] ? a < b : a > b);

        let irr_periods = [];
        for (let [i, period] of default_irr_periods.entries()) {
            if (i == 0) {
                irr_periods.push(period.label);
            } else {
                let previous_period = default_irr_periods[i - 1];
                if (
                    previous_period &&
                    previous_period.value &&
                    compare(one_year_irr, period.value)
                ) {
                    irr_periods.push(period.label);
                } else {
                    break;
                }
            }
        }

        return (
            `The one-year returns are ${direction} than the ` +
            `${Formatters.formatted_listing(irr_periods)}year returns, meaning ` +
            `that growth has ${direction == 'lower' ? 'slowed' : 'accelerated'}` +
            ' over the last year.'
        );
    };

    return ko.pureComputed(() => {
        let base =
            'Over the past year, {fund_name} has generated an IRR of {irr}. ' +
            'On a time-weighted basis the fund has generated a ' +
            '{irr_time_weighted} return. {progress_during_horizon}\n\n' +
            'Note: The time-weighted return serves as a proxy for the ' +
            'total value growth, while the horizon IRR accounts for cash ' +
            'flow timing. Time-weighted is best used for an individual ' +
            "fund after the fund's investment period has ended.";

        if (!self.defined_observables(vehicle_meta_data, time_weighted_breakdown)) {
            return undefined;
        }

        let {name} = vehicle_meta_data();
        let {metrics} = time_weighted_breakdown();
        if (!Utils.is_set(name) || !Utils.is_set(metrics)) {
            return undefined;
        }

        let irr = metrics.find(m => m.name == 'IRR');
        let twrr = metrics.find(m => m.name == 'TWRR');
        if (
            !Utils.is_set(irr) ||
            !Utils.is_set(irr.data) ||
            !Utils.is_set(twrr) ||
            !Utils.is_set(twrr.data)
        ) {
            return undefined;
        }

        let irr_text = generate_irr_text(irr.data['1 year']);
        let irr_time_weighted_text = generate_irr_time_weighted_text(twrr.data['1 year']);
        let progress_during_horizon_text =
            generate_progress_during_horizon_text(
                twrr.data['1 year'],
                twrr.data['3 years'],
                twrr.data['5 years'],
                twrr.data['10 years'],
            ) || '';

        if (
            !Utils.is_set(irr_text) ||
            !Utils.is_set(irr_time_weighted_text) ||
            !Utils.is_set(progress_during_horizon_text)
        ) {
            return undefined;
        }

        return base
            .replace('{fund_name}', name)
            .replace('{irr}', irr_text)
            .replace('{irr_time_weighted}', irr_time_weighted_text)
            .replace('{progress_during_horizon}', progress_during_horizon_text);
    });
};

self.horizon_analysis = function(
    vehicle_meta_data,
    time_weighted_comparison,
    attribute_map,
    enum_event,
    vintage_year_event,
    fund_size_event,
    lists_event,
    lists_map,
    vehicle_data,
) {
    /**
     * Compares the growth between a fund and its' peers/busmi and public indices at
     * a given time by comparing the size of the growth values provided. Note
     * that the growth values provided should be a value representing how much that
     * fund/index has grown at that point in time.
     *
     * @param  {Float}       fund_growth   A value representing the growth for the
     *                                     fund.
     * @param  {Float}       peers_growth  A value representing the growth for the
     *                                     peer set.
     * @param  {Float}       busmi_growth  A value representing the growth for the
     *                                     busmi index.
     * @param  {Object[]}  indices         An array of object represnting the growth
     *                                     and name of each index.
     * @return {Object}                    An object containing the relative speed
     *                                     of the given fund compared to the peer
     *                                     set, busmi index and public indices.
     */
    let compare_growth = function(fund_growth, peer_set_growth, private_growth, indices) {
        // Describes the relation between the fund and each growth. The value is
        // the relation that the set/index has to the fund. i.e. if the fund has
        // grown faster than the BUSMI index; "private_growth" will be 'slower'
        let result = {
            private_growth: 'equal',
            peer_set_growth: 'equal',
            public_growth: [],
        };

        // Compare growth towards the BUSMI index
        if (fund_growth < private_growth) {
            result['private_growth'] = 'faster';
        } else if (fund_growth > private_growth) {
            result['private_growth'] = 'slower';
        }

        // Compare growth against the peer set
        if (fund_growth < peer_set_growth) {
            result['peer_set_growth'] = 'faster';
        } else if (fund_growth > peer_set_growth) {
            result['peer_set_growth'] = 'slower';
        }

        // Compare growth against the public index set. If our fund is faster/slower
        // than all of them, we provide 'slower' or 'faster' respectively, otherwise
        // a description of each individual index is returned
        let fund_slower_than_public = indices.every(({growth}) => fund_growth < growth);
        let fund_faster_than_public = indices.every(({growth}) => fund_growth > growth);
        let fund_matches_public_pace = indices.every(({growth}) => fund_growth == growth);
        if (fund_slower_than_public) {
            result['public_growth'] = 'faster';
        } else if (fund_faster_than_public) {
            result['public_growth'] = 'slower';
        } else if (fund_matches_public_pace) {
            result['public_growth'] = 'equal';
        } else {
            result['public_growth'] = indices.map(index => {
                let growth = 'equal';
                if (fund_growth < index.growth) {
                    growth = 'faster';
                } else if (fund_growth > index.growth) {
                    growth = 'slower';
                }
                return {name: index.name, growth: growth};
            });
        }

        return result;
    };

    /**
     * Generates a text that describess the trend of the fund compared to the peer set,
     * BUSMI index and public market index over the last year.
     *
     * @param  {Float}    fund_growth     The amount of growth that the fund has undergone
     *                                    during the last year.
     * @param  {Float}    peers_growth    The amount of growth that the peer set has undergone
     *                                    during the last year.
     * @param  {Float}    busmi_growth    The amount of growth that the BUSMI index has
     *                                    undergone during the last year.
     * @param  {Object[]} indices         The name and growth over the last year of each public
     *                                    market index that should be included in the
     *                                    description
     * @return {String}                   A description of trend that the fund follows compared
     *                                    to the given sets and indices.
     */
    let generate_one_year_growth_text = function(fund_growth, peers_growth, busmi_growth, indices) {
        let individual_index_listing = function(indices_to_list) {
            let grouped_indices = indices_to_list.groupBy('growth');

            let result = [];
            let entries = Object.entries(grouped_indices);
            for (const [key, value] of entries) {
                let part = '';
                if (key == 'equal') {
                    part += 'at a pace that matches ';
                } else if (key == 'faster') {
                    part += 'faster than ';
                } else if (key == 'slower') {
                    part += 'slower than ';
                }

                part += Formatters.formatted_listing(value.map(v => v.name));
                result.push(part);
            }

            let listing = result.first(result.length - 1).join(', ');
            return `${listing}, and ${listing.last()}`;
        };

        if (
            !Utils.is_set(fund_growth) ||
            !Utils.is_set(peers_growth) ||
            !Utils.is_set(busmi_growth) ||
            !Utils.is_set(indices)
        ) {
            return undefined;
        }

        let result = '';

        // Find the growth rate of the different data sets relative to the
        // funds data, e.g. if the peers are slower than the fund, relation
        // will be 'slower'.
        let {private_growth, peer_set_growth, public_growth} = compare_growth(
            fund_growth,
            peers_growth,
            busmi_growth,
            indices,
        );

        let include_peer_set = peer_set_growth == 'slower';

        if (private_growth == 'faster' || private_growth == 'slower') {
            result += oneLine`
                    ${private_growth == 'slower' ? 'faster' : 'slower'} than
                `;

            if (private_growth == public_growth) {
                result += ' both the public and private markets';

                if (include_peer_set) {
                    result += private_growth == 'slower' ? ' as well as' : ', but faster than';
                    result += ' its peer set';
                }
            } else {
                result += oneLine`
                        ${private_growth == 'slower' && include_peer_set ? 'its peer set and' : ''}
                        the private markets
                        ${
                            private_growth == 'faster' && include_peer_set
                                ? ', but faster than its peer set'
                                : ''
                        }.
                    `;
                // Add extra space since oneLine doesn't allow trailing space
                result += ' ';

                let index_description = indices.length > 1 ? ' indices' : 's';
                result += oneLine`
                        Compared to the public market${index_description},
                        the fund has grown
                    `;

                if (public_growth == 'equal') {
                    result += ' at a matching pace';
                } else if (Array.isArray(public_growth)) {
                    result += ` ${individual_index_listing(public_growth)}`;
                } else {
                    result += ` ${public_growth == 'slower' ? 'faster' : 'slower'}`;
                }
            }
        } else {
            result += 'at a pace that matches ';

            if (public_growth == 'equal') {
                result += 'both the public and private markets';

                if (include_peer_set) {
                    result += ' but is faster than its peer set';
                }
            } else {
                result += oneLine`
                        the private markets
                        ${include_peer_set ? 'and is faster than its peer set' : ''}.
                    `;
                // Add extra space since oneLine doesn't allow trailing space
                result += ' ';

                let index_description = indices.length > 1 ? ' indices' : 's';
                result += oneLine`
                        Compared to the public market${index_description},
                        the fund has grown
                    `;

                if (Array.isArray(public_growth)) {
                    result += individual_index_listing(public_growth);
                } else {
                    result += public_growth == 'slower' ? ' faster' : ' slower';
                }
            }
        }

        return result;
    };

    /**
     * Generates a string that describes the trend over the past three, five or ten
     * years for the fund compared to the peers, BUSMI index and public market indices.
     * The trend will be described given the values that you send to the function.
     * For example if you want to describe the trend over five and ten years, don't
     * supply the three year trend value.
     *
     * @param  {Object} fund_growth  Describes the growth over a 1,3,5, and 10 year period
     * @param  {Object} peers_growth Describes the peer growth over a 1,3,5, and 10 year period
     * @param  {Object} busmi_growth Describes the busmi growth over a 1,3,5, and 10 year period
     * @param  {Object[]} indices    Describes the growth of each index over a 1,3,5 and 10 year
     *                               period.
     * @return {String}              A description of the trend of the fund over the 3,5, and 10
     *                               year period.
     */
    let generate_period_growth_text = function(fund_growth, peers_growth, busmi_growth, indices) {
        if (
            !Utils.is_set(fund_growth) ||
            !Utils.is_set(peers_growth) ||
            !Utils.is_set(busmi_growth) ||
            !Utils.is_set(indices)
        ) {
            return undefined;
        }

        // We start by constructing an array of all available filter options for the horizon
        // periods. Then filtering for the values that actually have a growth value set,
        // we can find the first period that we can use to construct a "trend" that the
        // fund follows.
        let growth_period_filters = [
            {label: 'three-', period: '3 year'},
            {label: 'five-', period: '5 year'},
            {label: 'ten-', period: '10 year'},
        ];
        let growth_periods = growth_period_filters
            .map(({label, period}) => ({
                label: label,
                fund: fund_growth[period],
                peers: peers_growth[period],
                busmi: busmi_growth[period],
                indices: indices.map(({name, growth}) => ({
                    name,
                    growth: growth ? growth[period] : undefined,
                })),
            }))
            .filter(
                ({fund, peers, busmi, indices}) =>
                    Utils.is_set(fund) &&
                    Utils.is_set(peers) &&
                    Utils.is_set(busmi) &&
                    Utils.is_set(indices),
            );

        // If there was no trend values left after filtering, we simply return as
        // there was nothing to describe
        if (!Utils.is_set(growth_periods, true)) {
            return '';
        }

        // The first element in the remaining array of periods, will be the value
        // we use to calculate a trend. Thus we take that value and calculate the
        // trend compared to our fund
        let first_period_in_trend = growth_periods[0];
        let growth_trend = compare_growth(
            first_period_in_trend.fund,
            first_period_in_trend.peers,
            first_period_in_trend.busmi,
            first_period_in_trend.indices,
        );

        // Get the continuous periods that follow the exact same trend. If we find
        // a period that breaks the trend, we break at that point.
        let growth_periods_in_trend = [];
        for (let growth_period of growth_periods) {
            let {fund, peers, busmi, indices} = growth_period;
            if (Object.isEqual(growth_trend, compare_growth(fund, peers, busmi, indices))) {
                growth_periods_in_trend.push(growth_period);
            } else {
                break;
            }
        }

        // Finally construct the description depending on the periods that were left
        // in the array after filtering.
        let result = 'Over the ';
        result += Formatters.formatted_listing(growth_periods_in_trend.map(({label}) => label));
        result += 'year period, the fund has grown ';

        // The follow-up description after the years will be the same as describing
        // only the one-year trend.
        result += generate_one_year_growth_text(
            first_period_in_trend.fund,
            first_period_in_trend.peers,
            first_period_in_trend.busmi,
            first_period_in_trend.indices,
        );

        return `${result}.`;
    };

    let generate_peer_set_description_text = function(
        peer_count,
        attribute_map,
        enum_event,
        vintage_year_event,
        fund_size_event,
        lists_event,
        lists_map,
        vehicle_data,
    ) {
        if (!Utils.is_set(peer_count)) {
            peer_count = '';
        }

        if (!vehicle_data || !vehicle_data()) {
            return 'Waiting for data...';
        }

        let {base_currency} = vehicle_data();
        if (!Utils.is_set(base_currency)) {
            base_currency = 'USD';
        }

        let fund_description = fund_filter_description({
            attribute_map,
            enum_event,
            vintage_year_event,
            fund_size_event,
            lists_event,
            lists_map,
            base_currency,
        })();

        if (!Utils.is_set(fund_description)) {
            return undefined;
        }

        let result = `The Peer Set is a portfolio of ${peer_count}`;
        result += peer_count ? ' ' : '';
        result += fund_description;

        return result;
    };

    return ko.pureComputed(() => {
        let base =
            "Over the last year, {fund_name}'s NAV has grown " +
            '{one_year_growth}. {period_growth} \n\n' +
            'Note: BUSMI is the Bison US Market Index. It is composed of ' +
            '75 funds raised by 20 leading US buyout and venture capital ' +
            'managers since 2000. BUSMI is representative of the activity ' +
            'and performance of the North American private markets. ' +
            '{peer_set_description}';

        if (!self.defined_observables(vehicle_meta_data, time_weighted_comparison)) {
            return undefined;
        }

        let {name} = vehicle_meta_data();
        if (!Utils.is_set(name)) {
            return undefined;
        }

        let {peer_funds, metrics} = time_weighted_comparison();
        let fund_metrics = metrics.find(m => m.name == name);
        let peer_metrics = metrics.find(m => m.name == 'Peer Set');
        let busmi_metrics = metrics.find(m => m.name == 'BUSMI');
        let index_metrics = metrics.filter(
            m => m.name != name && m.name != 'Peer Set' && m.name != 'BUSMI',
        );

        if (
            !Utils.is_set(fund_metrics) ||
            !Utils.is_set(peer_metrics) ||
            !Utils.is_set(busmi_metrics) ||
            !Utils.is_set(index_metrics)
        ) {
            return undefined;
        }

        let one_year_growth_text = generate_one_year_growth_text(
            fund_metrics.data ? fund_metrics.data['1 years'] : undefined,
            peer_metrics.data ? peer_metrics.data['1 years'] : undefined,
            busmi_metrics.data ? busmi_metrics.data['1 years'] : undefined,
            index_metrics.map(({data, name}) => ({
                growth: data ? data['1 years'] : undefined,
                name: name,
            })),
        );
        let period_growth_text = generate_period_growth_text(
            fund_metrics.data,
            peer_metrics.data,
            busmi_metrics.data,
            index_metrics.map(({data, name}) => ({growth: data, name})),
        );

        let peer_set_description_text = generate_peer_set_description_text(
            peer_funds.length,
            attribute_map,
            enum_event,
            vintage_year_event,
            fund_size_event,
            lists_event,
            lists_map,
            vehicle_data,
        );

        if (
            !Utils.is_set(one_year_growth_text) ||
            !Utils.is_set(period_growth_text) ||
            !Utils.is_set(peer_set_description_text)
        ) {
            return undefined;
        }

        return base
            .replace('{fund_name}', name)
            .replace('{one_year_growth}', one_year_growth_text)
            .replace('{period_growth}', period_growth_text)
            .replace('{peer_set_description}', peer_set_description_text);
    });
};

self.side_by_side = function(
    attribute_map,
    enum_event,
    vintage_year_event,
    fund_size_event,
    lists_event,
    lists_map,
    vehicle_meta_data,
    side_by_side_comparison_target,
    side_by_side_comparison_funds,
    vehicle_data,
) {
    let generate_ranks_text = function(target_fund_uid, funds) {
        if (!Utils.is_set(target_fund_uid) || !Utils.is_set(funds)) {
            return undefined;
        }

        let funds_by_irr = funds.sortBy('irr', true);
        let irr_rank = funds_by_irr.findIndex(({uid}) => uid == target_fund_uid) + 1;

        let funds_by_tvpi = funds.sortBy('tvpi', true);
        let tvpi_rank = funds_by_tvpi.findIndex(({uid}) => uid == target_fund_uid) + 1;

        let funds_by_dpi = funds.sortBy('dpi', true);
        let dpi_rank = funds_by_dpi.findIndex(({uid}) => uid == target_fund_uid) + 1;

        if (irr_rank == 0 || tvpi_rank == 0 || dpi_rank == 0) {
            return undefined;
        }

        return (
            `TVPI ranks ${tvpi_rank.ordinalize()}, DPI ranks ${dpi_rank.ordinalize()}, ` +
            `and IRR ranks ${irr_rank.ordinalize()}`
        );
    };

    return ko.pureComputed(() => {
        let base =
            "Based on the fund's characteristics, the data set has been " +
            'narrowed down to {peer_set_description}\n\n' +
            "Among this peer set of {peer_set_size} funds, {fund_name}'s " +
            '{ranks}.';

        if (!vehicle_data || !vehicle_data()) {
            return 'Waiting for data...';
        }

        if (
            !self.defined_observables(
                vehicle_meta_data,
                side_by_side_comparison_target,
                side_by_side_comparison_funds,
                vehicle_data,
            )
        ) {
            return undefined;
        }

        let funds = side_by_side_comparison_funds();
        let target = side_by_side_comparison_target();

        let {name} = vehicle_meta_data();
        if (!Utils.is_set(name)) {
            return undefined;
        }

        let {base_currency} = vehicle_data();
        if (!Utils.is_set(base_currency)) {
            base_currency = 'USD';
        }

        let peer_set_description_text = fund_filter_description({
            attribute_map,
            enum_event,
            vintage_year_event,
            fund_size_event,
            lists_event,
            lists_map,
            base_currency,
        })();

        let ranks_text = generate_ranks_text(target.uid, [...funds, target]);

        if (!Utils.is_set(peer_set_description_text) || !Utils.is_set(ranks_text)) {
            return undefined;
        }

        return base
            .replace('{peer_set_description}', peer_set_description_text)
            .replace('{peer_set_size}', funds.length)
            .replace('{fund_name}', name)
            .replace('{ranks}', ranks_text);
    });
};

self.momentum_side_by_side = function(
    vehicle_meta_data,
    side_by_side_comparison_target,
    side_by_side_comparison_funds,
    metric_event,
) {
    let horizon_years = ko.observable();
    Observer.register(metric_event, m => horizon_years(m.horizon_years));

    let generate_period_text = function(years) {
        if (!Utils.is_set(years)) {
            return undefined;
        }

        switch (years) {
            case 1:
                return 'year';
            case 3:
                return 'three years';
        }
    };

    let generate_tvpi_momentum_text = function(target_fund, funds) {
        if (!Utils.is_set(target_fund) || !Utils.is_set(funds)) {
            return undefined;
        }

        let result = '';

        result += `${Formatters.percent(target_fund.momentum)}, the `;

        let funds_by_momentum = funds.sortBy('momentum', true);
        let target_rank = funds_by_momentum.findIndex(({uid}) => uid == target_fund.uid) + 1;

        // For some reason out fund was not in the list of funds that we are
        // comparing.
        if (target_rank == 0) {
            return undefined;
        }

        result += target_rank.ordinalize();

        if (target_rank != 1) {
            result += ' highest';
        }

        result += ' among its close peer set';

        return result;
    };

    let generate_comparator_funds_tvpi_momentum_text = function(target_fund, funds) {
        if (!Utils.is_set(target_fund) || !Utils.is_set(funds)) {
            return undefined;
        }

        let result = '';

        if (funds.length < 3) {
            return result;
        }

        let funds_by_momentum = funds.sortBy('momentum', true);
        let target_rank = funds_by_momentum.findIndex(({uid}) => uid == target_fund.uid) + 1;

        if (target_rank == 1) {
            result += 'The two funds with the next highest momentum were ';
            for (let i = 1; i < 3; i++) {
                let fund = funds_by_momentum[i];
                result += `${fund.name} (${Formatters.percent(fund.momentum)})`;

                if (i < 2) {
                    result += ' and ';
                }
            }
        } else if (target_rank == 2) {
            result += 'The fund with the highest momentum was ';
            let fund = funds_by_momentum[target_rank - 2];
            result += `${fund.name} (${Formatters.percent(fund.momentum)})`;
        } else {
            result += 'The two funds with the highest momentum were ';

            for (let i = 0; i < 2; i++) {
                let fund = funds_by_momentum[i];
                result += `${fund.name} (${Formatters.percent(fund.momentum)})`;

                if (i < 1) {
                    result += ' and ';
                }
            }
        }

        return result;
    };

    return ko.pureComputed(() => {
        let base =
            "Over the past {period}, {fund_name}'s TVPI momentum has been " +
            '{tvpi_momentum}. {comparator_funds_tvpi_momentum}. TVPI ' +
            "momentum measures the velocity of each fund's net multiple " +
            'over a period of time.';

        if (
            !self.defined_observables(
                vehicle_meta_data,
                side_by_side_comparison_target,
                side_by_side_comparison_funds,
                horizon_years,
            )
        ) {
            return undefined;
        }

        let {name} = vehicle_meta_data();
        let funds = side_by_side_comparison_funds();
        let target = side_by_side_comparison_target();
        if (
            !Utils.is_set(name) ||
            !Utils.is_set(funds) ||
            !Utils.is_set(target) ||
            !Utils.is_set(target.momentum)
        ) {
            return undefined;
        }

        let period_text = generate_period_text(horizon_years());

        let momentum_index = `${horizon_years()}_year`;
        let target_mapped = {uid: target.uid, momentum: target.momentum[momentum_index]};
        let funds_mapped = [...funds, target].map(f =>
            Object.assign({}, f, {momentum: f.momentum[momentum_index]}),
        );

        let tvpi_momentum_text = generate_tvpi_momentum_text(target_mapped, funds_mapped);

        let comparator_funds_tvpi_momentum_text = generate_comparator_funds_tvpi_momentum_text(
            target_mapped,
            funds_mapped,
        );

        if (
            !Utils.is_set(comparator_funds_tvpi_momentum_text) ||
            !Utils.is_set(period_text) ||
            !Utils.is_set(tvpi_momentum_text)
        ) {
            return undefined;
        }

        return base
            .replace('{period}', period_text)
            .replace('{fund_name}', name)
            .replace('{tvpi_momentum}', tvpi_momentum_text)
            .replace('{comparator_funds_tvpi_momentum}', comparator_funds_tvpi_momentum_text);
    });
};

self.irr_j_curve = function(vehicle_meta_data, irr_j_curve_data, time_zero_event) {
    let time_zero = ko.observable();
    Observer.register(time_zero_event, time_zero);

    let generate_first_cash_flow_text = function(first_date) {
        if (!Utils.is_set(first_date)) {
            return undefined;
        }

        let first_cash_flow_date = new Date(first_date);
        if (!first_cash_flow_date.isValid()) {
            return undefined;
        }

        return oneLine`
                had its first cash flow in
                Q${Utils.month_to_quarter(first_cash_flow_date.getMonth() + 1)}
                ${first_cash_flow_date.getFullYear()}
            `;
    };

    let generate_positive_territory_text = function(
        first_cashflow_timestamp,
        fund_data,
        time_zero,
    ) {
        if (!Utils.is_set(first_cashflow_timestamp) || !Utils.is_set(fund_data)) {
            return undefined;
        }

        // Check if the IRR has been positive at some point
        let fund_data_by_date = fund_data.sortBy('time', true);
        let zero_line_by_date = fund_data_by_date.map(({time}) => ({time, value: 0}));

        let fund_above_zero_idx = Utils.find_moved_above_relative(
            fund_data_by_date,
            zero_line_by_date,
        );

        if (fund_above_zero_idx < 0) {
            return 'IRR has yet to move into and stay in positive territory';
        }

        // This variable either contains a quarter number or a timestamp depending
        // on if time_zero is true or false
        let positive_irr_time = fund_data_by_date[fund_above_zero_idx]['time'];

        // If we are requested for a time zero description, we have all the data
        // we need.
        if (time_zero) {
            // Convert quarters to years
            positive_irr_time = positive_irr_time / 4;
            return oneLine`
                    IRR moved into positive territory ${positive_irr_time}
                    years after its inception
                `;
        }

        positive_irr_time = new Date(positive_irr_time);
        if (!positive_irr_time.isValid()) {
            return undefined;
        }
        let positive_irr_quarter = Utils.month_to_quarter(positive_irr_time.getMonth() + 1);

        let first_cashflow_date = new Date(first_cashflow_timestamp);
        let delta = Utils.by_quarter_time_diff(positive_irr_time, first_cashflow_date);
        if (!Utils.is_set(delta)) {
            return undefined;
        }

        return (
            'IRR moved into positive territory in ' +
            `Q${positive_irr_quarter} ${positive_irr_time.getFullYear()} which ` +
            `is ${delta} years after the first cash flow`
        );
    };

    let generate_peer_median_relation_text = function(
        fund_name,
        median_data,
        fund_data,
        time_zero,
    ) {
        if (!Utils.is_set(fund_name) || !Utils.is_set(median_data) || !Utils.is_set(fund_data)) {
            return undefined;
        }

        let result = `Compared to its' peers, the IRR of ${fund_name}'s has been `;

        let median_data_by_date = median_data.sortBy('time');
        let fund_data_by_date = fund_data.sortBy('time');

        let irr_trend = Utils.find_first_in_current_trend(fund_data_by_date, median_data_by_date);
        if (!Utils.is_set(irr_trend)) {
            return undefined;
        }
        result += `${irr_trend.trend} the median since `;

        if (time_zero) {
            if (irr_trend.time > 0) {
                result += `${irr_trend.time} quarters after `;
            }
            result += "its' inception.";
        } else {
            let first_in_trend_date = new Date(irr_trend.time);
            if (!first_in_trend_date.isValid()) {
                return undefined;
            }
            let quarter = Utils.month_to_quarter(first_in_trend_date.getMonth() + 1);

            result += `Q${quarter} ${first_in_trend_date.getFullYear()}.`;
        }

        return result;
    };

    return ko.pureComputed(() => {
        let base =
            "The IRR j-curve analysis compares {fund_name}'s IRR " +
            'progression to its close peers. The IRR j-curve highlights a ' +
            "manager's ability to mitigate the impact of fees and gauges " +
            'the ability to build a portfolio that creates value and ' +
            'generates momentum. The grey shaded area represents the first ' +
            'and third quartile break points. \n\n' +
            "{fund_name} {first_cash_flow}. {fund_name}'s {positive_territory}. " +
            '{peer_median_relation}';
        if (!self.defined_observables(vehicle_meta_data, irr_j_curve_data, time_zero)) {
            return undefined;
        }

        let {name, first_date} = vehicle_meta_data();
        if (!Utils.is_set(name) || !Utils.is_set(first_date)) {
            return undefined;
        }

        let {median, vehicle} = irr_j_curve_data();
        if (!Utils.is_set(median) || !Utils.is_set(vehicle)) {
            return undefined;
        }

        let fund_data = vehicle[name];
        if (!Utils.is_set(fund_data)) {
            return undefined;
        }

        let mapped_median = median.map(([time, value]) => ({time, value}));
        let mapped_fund_data = fund_data.map(([time, value]) => ({time, value}));

        let first_cash_flow_text = time_zero()
            ? generate_first_cash_flow_text(first_date * 1000)
            : '';

        let positive_territory_text = generate_positive_territory_text(
            first_date * 1000,
            mapped_fund_data,
            time_zero(),
        );
        if (!Utils.is_set(positive_territory_text)) {
            return undefined;
        }

        let peer_median_relation_text = time_zero()
            ? ''
            : generate_peer_median_relation_text(
                  name,
                  mapped_median,
                  mapped_fund_data,
                  time_zero(),
              );
        if (!time_zero() && !Utils.is_set(peer_median_relation_text)) {
            return undefined;
        }

        return base
            .replace(/{fund_name}/g, name)
            .replace('{first_cash_flow}', first_cash_flow_text)
            .replace('{positive_territory}', positive_territory_text)
            .replace('{peer_median_relation}', peer_median_relation_text);
    });
};

self.cash_flow_j_curve = function(vehicle_meta_data, scaled_net_cashflows) {
    let generate_first_cash_flow_text = function(first_date) {
        if (!Utils.is_set(first_date)) {
            return undefined;
        }

        let first_cash_flow_date = new Date(first_date);
        if (!first_cash_flow_date.isValid()) {
            return undefined;
        }

        return oneLine`
                had its first cash flow in
                Q${Utils.month_to_quarter(first_cash_flow_date.getMonth() + 1)}
                ${first_cash_flow_date.getFullYear()}
            `;
    };

    let formatted_listing_of_stats = function(stats) {
        if (!Utils.is_set(stats)) {
            return undefined;
        }

        return Formatters.formatted_listing(
            stats.map((stat, i) => {
                let date = new Date(stat.timestamp);
                let quarter = Utils.month_to_quarter(date.getMonth() + 1);
                let label = i == 0 ? 'of paid in as of' : 'as of';
                return `${stat.percent}% ${label} Q${quarter} ${date.getFullYear()}`;
            }),
            undefined,
            {separator: ';'},
        );
    };

    let generate_invested_text = function(fund_name, conts_25, conts_50, conts_75, conts_100) {
        if (!Utils.is_set(fund_name)) {
            return undefined;
        }

        let result = `${fund_name} has `;

        if (
            Utils.is_set(conts_25) ||
            Utils.is_set(conts_50) ||
            Utils.is_set(conts_75) ||
            Utils.is_set(conts_100)
        ) {
            let stats_listing = formatted_listing_of_stats(
                [
                    {percent: 25, timestamp: conts_25},
                    {percent: 50, timestamp: conts_50},
                    {percent: 75, timestamp: conts_75},
                    {percent: 100, timestamp: conts_100},
                ].filter(({timestamp}) => timestamp),
            );
            result += `invested ${stats_listing}`;
        } else {
            result += 'yet to invest 25% of the fund';
        }

        return result;
    };

    let generate_distributed_text = function(fund_name, dists_25, dists_50, dists_75, dists_100) {
        if (!Utils.is_set(fund_name)) {
            return undefined;
        }

        let result = `${fund_name} has `;

        if (
            Utils.is_set(dists_25) ||
            Utils.is_set(dists_50) ||
            Utils.is_set(dists_75) ||
            Utils.is_set(dists_100)
        ) {
            let stats_listing = formatted_listing_of_stats(
                [
                    {percent: 25, timestamp: dists_25},
                    {percent: 50, timestamp: dists_50},
                    {percent: 75, timestamp: dists_75},
                    {percent: 100, timestamp: dists_100},
                ].filter(({timestamp}) => timestamp),
            );
            result += `distributed ${stats_listing}`;
        } else {
            result += 'yet to distribute 25% of paid in';
        }

        return result;
    };

    let generate_maximum_flow_text = function(
        fund_name,
        max_outflow_timestamp,
        first_date_timestamp,
        average_years_after_max_outflow,
    ) {
        if (
            !Utils.is_set(fund_name) ||
            !Utils.is_set(max_outflow_timestamp) ||
            !Utils.is_set(first_date_timestamp) ||
            !Utils.is_set(average_years_after_max_outflow)
        ) {
            return undefined;
        }

        let result = `${fund_name} reached its maximum outflow in `;

        let max_outflow_date = new Date(max_outflow_timestamp);
        if (!max_outflow_date.isValid()) {
            return undefined;
        }
        let max_outflow_quarter = Utils.month_to_quarter(max_outflow_date.getMonth() + 1);
        result += `Q${max_outflow_quarter} ${max_outflow_date.getFullYear()}, which is `;

        let years_after_max_outflow = Utils.years_diff(first_date_timestamp, max_outflow_timestamp);
        result += `${years_after_max_outflow.format(2)} years after the first cash flow. `;

        let direction =
            average_years_after_max_outflow > years_after_max_outflow ? 'faster' : 'slower';
        let max_outflow_year_diff = Math.abs(
            years_after_max_outflow - average_years_after_max_outflow,
        );
        result += oneLine`
                This is ${max_outflow_year_diff.format(2)}
                years ${direction} than the average of its peer set
            `;

        return result;
    };

    return ko.pureComputed(() => {
        let base =
            "The cash flow j-curve analysis compares {fund_name}'s " +
            'cumulative cash flows (contributions + distributions) against ' +
            'the cash flows of its close peers. The cash flow j-curve ' +
            "analyzes the fund's investment pace as well your ability to " +
            'distribute returns back to LPs. The grey shaded area ' +
            'represents the max and min of your peers. An LP looks at this ' +
            'to analyze the length of time their capital is outstanding or ' +
            '"at risk". This information is utilized by LPs for future ' +
            'planning of commitments and allocation. \n\n' +
            '{fund_name} {first_cash_flow}. \n\n' +
            '{invested}.\n\n' +
            '{distributed}.\n\n' +
            '{maximum_flow}.';

        if (!self.defined_observables(vehicle_meta_data, scaled_net_cashflows)) {
            return undefined;
        }

        let {name, first_date} = vehicle_meta_data();
        let {funds} = scaled_net_cashflows();
        if (!Utils.is_set(name) || !Utils.is_set(funds)) {
            return undefined;
        }

        let fund_data = funds.find(f => f.name == name);
        if (!Utils.is_set(fund_data)) {
            return undefined;
        }

        let first_cash_flow_text = generate_first_cash_flow_text(first_date * 1000);

        let {
            conts_25,
            conts_50,
            conts_75,
            conts_100,
            dists_25,
            dists_50,
            dists_75,
            dists_100,
        } = fund_data.stats;

        let invested_text = generate_invested_text(
            name,
            conts_25 ? conts_25 * 1000 : null,
            conts_50 ? conts_50 * 1000 : null,
            conts_75 ? conts_75 * 1000 : null,
            conts_100 ? conts_100 * 1000 : null,
        );
        let distributed_text = generate_distributed_text(
            name,
            dists_25 ? dists_25 * 1000 : null,
            dists_50 ? dists_50 * 1000 : null,
            dists_75 ? dists_75 * 1000 : null,
            dists_100 ? dists_100 * 1000 : null,
        );

        // Calculate the average number of years between the maximum outflow date and
        // the date of the first cashflow.
        let average_years_after_max_outflow =
            funds
                .filter(
                    ({max_outflow, first_date}) =>
                        Utils.is_set(max_outflow) && Utils.is_set(first_date),
                )
                .map(({max_outflow, first_date}) =>
                    Utils.years_diff(first_date * 1000, max_outflow * 1000),
                )
                .sum() / funds.length;
        let maximum_flow_text = generate_maximum_flow_text(
            name,
            fund_data.max_outflow ? fund_data.max_outflow * 1000 : null,
            fund_data.first_date ? fund_data.first_date * 1000 : null,
            average_years_after_max_outflow,
        );

        if (
            !Utils.is_set(invested_text) ||
            !Utils.is_set(distributed_text) ||
            !Utils.is_set(maximum_flow_text)
        ) {
            return undefined;
        }

        return base
            .replace(/{fund_name}/g, name)
            .replace('{first_cash_flow}', first_cash_flow_text)
            .replace('{invested}', invested_text)
            .replace('{distributed}', distributed_text)
            .replace('{maximum_flow}', maximum_flow_text);
    });
};

self.remaining_value_trend = function(
    vehicle_meta_data,
    remaining_value_trend_data,
    time_zero_event,
) {
    let time_zero = ko.observable();
    Observer.register(time_zero_event, time_zero);

    let generate_rvpi_text = function(
        fund_name,
        first_date,
        fund_rvpi,
        peer_rvpi_median,
        time_zero,
    ) {
        if (
            !Utils.is_set(fund_name) ||
            !Utils.is_set(fund_rvpi) ||
            !Utils.is_set(peer_rvpi_median)
        ) {
            return undefined;
        }
        let rvpi_trend = Utils.find_first_in_current_trend(fund_rvpi, peer_rvpi_median);
        if (!Utils.is_set(rvpi_trend)) {
            return undefined;
        }

        let result = `${fund_name}'s RVPI has been ${rvpi_trend.trend} the median since `;

        if (time_zero) {
            let inception_date = new Date(first_date * 1000);
            if (!inception_date.isValid()) {
                return undefined;
            }

            // Note all these dates below are just approximate, since the quarters in
            // rvpi_trend.time are not specific enough to be exact
            let years_above_median = rvpi_trend.time / 4;
            let days_above_median = years_above_median * Constants.days_per_year;
            let date_above_median = inception_date.addDays(days_above_median);
            if (!date_above_median.isValid()) {
                return undefined;
            }

            result += oneLine`
                    Q${Utils.month_to_quarter(date_above_median.getMonth() + 1)}
                    ${date_above_median.getFullYear()}
                `;
        } else {
            let first_in_trend_date = new Date(rvpi_trend.time);
            if (!first_in_trend_date.isValid()) {
                return undefined;
            }
            let quarter = Utils.month_to_quarter(first_in_trend_date.getMonth() + 1);
            result += `Q${quarter} ${first_in_trend_date.getFullYear()}`;
        }

        return `${result}.`;
    };

    return ko.pureComputed(() => {
        let base =
            "The RVPI trend analyzes {fund_name}'s remaining value " +
            "against the vintage year cohort. During the fund's early " +
            'years, a higher RVPI position is good. After the five year ' +
            'mark, a GP should consider the RVPI in context with the DPI. ' +
            'The grey shaded area represents the first and third quartile ' +
            'break points. \n\n{rvpi}';

        if (!self.defined_observables(vehicle_meta_data, remaining_value_trend_data, time_zero)) {
            return undefined;
        }

        let {name, first_date} = vehicle_meta_data();
        let {median, vehicle} = remaining_value_trend_data();
        if (!Utils.is_set(name) || !Utils.is_set(median) || !Utils.is_set(vehicle)) {
            return undefined;
        }

        let fund_data = vehicle[name];
        if (!Utils.is_set(fund_data)) {
            return undefined;
        }

        let mapped_median = median.map(([time, value]) => ({time, value})).sortBy('time');
        let mapped_fund_data = fund_data.map(([time, value]) => ({time, value})).sortBy('time');

        let rvpi_text = generate_rvpi_text(
            name,
            first_date,
            mapped_fund_data,
            mapped_median,
            time_zero(),
        );

        if (!Utils.is_set(rvpi_text)) {
            return undefined;
        }

        return base.replace('{fund_name}', name).replace('{rvpi}', rvpi_text);
    });
};

function horizon_year_description(horizon_years, capitalize = false) {
    if (!Utils.is_set(horizon_years)) {
        return undefined;
    }

    let result = `${capitalize ? 'Over' : 'over'} the past `;

    switch (horizon_years.value) {
        case 1:
            result += 'year';
            break;
        case 2:
            result += 'two years';
            break;
        case 3:
            result += 'three years';
            break;
        case 5:
            result += 'five years';
            break;
        case 10:
            result += 'ten years';
            break;
        case null:
            result = `${capitalize ? 'Since' : 'since'} the inception of the fund`;
            break;
        default:
            return undefined;
    }

    return result;
}

function fund_filter_description({
    attribute_map,
    lists_map,
    lists_event,
    enum_event,
    vintage_year_event,
    fund_size_event,
    base_currency,
}) {
    let vintage_year = ko.observable();
    let fund_size = ko.observable();
    let enum_filters = ko.observable();
    let lists = ko.observable();

    Observer.register(lists_event, lists);
    Observer.register(fund_size_event, fund_size);
    Observer.register(vintage_year_event, vintage_year);
    Observer.register(enum_event, enum_filters);

    let generate_geography_text = geographies => {
        if (!Utils.is_set(geographies)) {
            return '';
        }

        return `${Formatters.formatted_listing(geographies.map(g => g.name))} `;
    };

    let generate_style_text = styles => {
        if (!Utils.is_set(styles)) {
            return '';
        }

        // If we have a venture capital filter, we want to display the members.
        let mapped_styles = styles.map(s => {
            if (s.name == 'Venture Capital' && s.members.length) {
                return `${s.name} (${Formatters.formatted_listing(s.members)})`;
            }
            return s.name;
        });

        return `${Formatters.formatted_listing(mapped_styles).toLowerCase()}`;
    };

    let generate_vintage_year_text = years => {
        if (Utils.is_set(years, true)) {
            return `from ${Formatters.year_listing(years.map(y => y.value))}`;
        }
        return '';
    };

    let generate_fund_size_text = (size, has_sector_filter) => {
        if (!Utils.is_set(size) || (!Utils.is_set(size.min) && !Utils.is_set(size.max))) {
            return '';
        }

        let {min, max} = size;
        let result = has_sector_filter ? ' and a fund size ' : ' with a fund size ';
        let formatted_min = Formatters.money(min * 1000000 || 0, false, {
            render_currency: base_currency,
            abbreviate: true,
        });
        let formatted_max = Formatters.money(max * 1000000 || 0, false, {
            render_currency: base_currency,
            abbreviate: true,
        });

        if (min && max) {
            result += `between ${formatted_min} and ${formatted_max}`;
        } else if (min) {
            result += `above ${formatted_min}`;
        } else if (max) {
            result += `below ${formatted_max}`;
        }

        return result;
    };

    let generate_sector_text = sectors => {
        if (!Utils.is_set(sectors)) {
            return '';
        }

        let result = 'with a focus on the ';
        result += Formatters.formatted_listing(sectors.map(s => s.name)).toLowerCase();
        result += ` sector${sectors.length > 1 ? 's' : ''}`;

        return result;
    };

    let generate_lists_text = function(list_descriptions) {
        return Formatters.formatted_listing(list_descriptions);
    };

    let list_filter_mapping = function(lists, lists_map) {
        if (lists && lists.length && lists_map) {
            return lists
                .map(list => (lists_map.find(({uid}) => uid == list.value) || {}).description)
                .filter(Utils.is_set);
        }

        return [];
    };

    return ko.pureComputed(() => {
        let base = '';

        let list_descriptions = list_filter_mapping(lists(), lists_map());
        if (lists().length > 0) {
            if (list_descriptions.length > 0) {
                return generate_lists_text(list_descriptions);
            }

            return undefined;
        }

        // We did not find a description from the lists, we describe the funds from
        // the given filters instead.
        base = '{geography}{style} funds {vintage_year}{sector}{fund_size}.';

        let {geography, style, sector} = Utils.enum_filter_mapping(enum_filters(), attribute_map());

        let geography_text = generate_geography_text(geography);
        let style_text = generate_style_text(style);
        let vintage_year_text = generate_vintage_year_text(vintage_year());
        let sector_text = generate_sector_text(sector);
        let fund_size_text = generate_fund_size_text(fund_size(), !!sector_text);

        if (
            geography_text == '' &&
            style_text == '' &&
            vintage_year_text == '' &&
            sector_text == '' &&
            fund_size_text == ''
        ) {
            return undefined;
        }

        return base
            .replace('{geography}', geography_text)
            .replace('{style}', style_text)
            .replace('{vintage_year}', vintage_year_text)
            .replace('{sector}', sector_text)
            .replace('{fund_size}', fund_size_text);
    });
}

self.defined_observables = function() {
    for (let observable of arguments) {
        if (!(ko.isObservable(observable) && Utils.is_set(observable()))) {
            return false;
        }
    }
    return true;
};

export default self;
