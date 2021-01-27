/* Automatically transformed from AMD to ES6. Beware of code smell. */
import PMEBox from 'src/libs/components/PMEBox';
import PopoverInfo from 'src/libs/components/popovers/PopoverInfo';
import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import * as Formatters from 'src/libs/Formatters';
import NewPopoverButton from 'src/libs/components/popovers/NewPopoverButton';
import * as Utils from 'src/libs/Utils';
import BarChart from 'src/libs/components/charts/BarChart';
import CompTable from 'src/libs/components/CompTable';
import NewDropdown from 'src/libs/components/basic/NewDropdown';

let _component = function(opts, components) {
    let self = new BaseComponent(opts, components);

    let _dfd = self.new_deferred();

    self.dynamic = opts.dynamic;
    self.show_dropdown = true;

    if (opts.hide_dropdown === true) {
        self.show_dropdown = false;
    }

    self.css_style = opts.css_style;

    self.info_texts = {
        'Kaplan Schoar':
            "<div style='font-size:12px;padding: 0 5px;'>\
                Kaplan Schoar looks at the future value of the fund's contributions and distributions against a selected market index.\
                <br><br>\
                Each cash flow discounts the private equity fund's cash flows against the market's change during the time period from when each cash flow occurred to the period end date.\
                <br><br>\
                If the future value of distributions + NAV is greater than the FV of contributions (Kaplan Schoar > 1), the fund has outperformed the index. \
                <br><br>\
                You can calculate the public market multiple by dividing the fund's multiple by the Kaplan Schoar ratio.\
                <br><br></div>",
        'Cobalt PME': oneLine`
                <div style="font-size:12px; padding: 0 5px;">
                    Creates a set of actual market cash flows, while replicating the timing and size of the fund’s cash flows.
                    <br><br>
                    Establishes a realization ratio based on PV of distributions as a proportion of the sum of PV of distributions.
                    <br><br>
                    By multiplying the realization ratio by the sum of PV of contributions, we get the amount distributed from the market at each of the fund’s distribution dates.
                    <br><br>
                    Alternatively, you can generate the market’s distributions by dividing the fund’s distribution by the Kaplan Schoar ratio.
                    <br><br>
                    <img src="${require('src/img/bison_pme_formula.png')}" width="280px" />
                    <br><br>
                </div>
            `,
        'Direct Alpha':
            "<div style='font-size:12px;padding: 0 5px;'>\
                Direct Alpha runs an IRR calculation on the net cash flows of the future value of contributions and the future value of distributions (Kaplan Schoar cash flows).\
                <br><br>\
                The result indicates the differential between the fund's IRR and the index's IRR.\
                <br><br>\
                In Direct Alpha, Fund IRR - Direct Alpha = Index IRR.\
                <br><br></div>",
        'GEM IPP':
            "<div style='font-size:12px;padding: 0 5px;'>\
                The Implied Private Premium (“IPP”) uses the goals seek function to find the difference between the fund’s IRR and the market’s IRR.\
                <br><br>\
                IPP looks at the future values of the fund’s distributions and contributions and establishes the Kaplan Schoar ratio.\
                <br><br>\
                Using the goal seek function, they then identify what annual rate of return needs to be inserted into the future value discounting equation to make the Kaplan Schoar ratio equal 1 (FV of contributions = FV of distributions).\
                <br><br></div>",
        'Long Nickels':
            "<div style='font-size:12px;padding: 0 5px;'>\
                First methodology that creates a hypothetical public market portfolio.\
                <br><br>\
                Uses private equity fund’s cash flows to buy and sell into the public markets.\
                <br><br>\
                Assumes that you can distribute the same amount of returns from the public markets as from the fund.\
                <br><br>\
                <span class='text-danger'>Calculation “breaks” ~30% of the time</span>\
                <br><br></div>",
    };

    if (self.dynamic) {
        self.template = opts.template || 'tpl_dynamic_pme_box';

        self.methodology_dropdown = self.new_instance(NewDropdown, {
            data: ko.pureComputed(() => {
                let data = self.data();

                if (data) {
                    return Object.keys(data).map(key => ({
                        value: key,
                        label: data[key].methodology,
                    }));
                }

                return [];
            }),
            selected: {
                datasource: opts.default_methodology,
            },
            default_selected_index: 0,
            inline: true,
            btn_css: {'btn-ghost-default': true},
            btn_style: {'min-width': '200px'},
        });

        self.methodology = ko.computed(() => {
            let selected = self.methodology_dropdown.selected();
            let data = self.data();
            if (data && selected) {
                if (selected.value && data[selected.value]) {
                    return data[selected.value];
                }
            }
        });
    } else {
        self.template = opts.template || 'tpl_pme_box';
        self.methodology = self.data;
    }

    self.info_text = ko.computed(() => {
        let data = self.methodology();
        if (data) {
            return self.info_texts[data.methodology];
        }
    });

    self.info_title = ko.computed(() => {
        let data = self.methodology();
        if (data) {
            return `What is ${data.methodology}?`;
        }
    });

    self.info_popover = self.new_instance(NewPopoverButton, {
        label: self.info_title,
        id: 'info_popover',
        template: 'tpl_text_popover_button',
        css: {},
        popover_options: {
            title: self.info_title,
            placement: 'bottom',
        },
        popover_config: {
            component: PopoverInfo,
            html: self.info_text,
        },
    });

    self.label = ko.computed(() => {
        let data = self.methodology();
        if (data) {
            return data.methodology;
        }
    });

    self.pme_error = ko.computed(() => {
        if (self.methodology() && self.methodology().error) {
            return self.methodology().error;
        }

        return false;
    });

    self.description = ko.computed(() => {
        let data = self.methodology();
        if (data && data.delta && Utils.is_set(data.delta.value)) {
            let keyword = data.delta.value > 0 ? 'outperformed' : 'underperformed';

            return [data.vehicle_name, keyword, '<br />', data.index_name, 'by'].join(' ');
        }
    });

    self.delta = ko.computed(() => {
        let data = self.methodology();

        if (data && data.vehicle) {
            let format;

            if (opts.neutral) {
                format = `${data.vehicle.type}_neutral_delta`;
            } else {
                format = `${data.vehicle.type}_highlight_delta`;
            }

            let formatter = Formatters.gen_formatter(format);

            return formatter(data.delta.value);
        }

        return '<span class="text-muted">N/A</span>';
    });

    // self.delta_css = ko.computed(function() {
    //     var data = self.methodology();

    //     if(data && Utils.is_set(data.delta.value)) {
    //         var overperform = data.delta.value > 0;
    //         return { overperform: overperform, underperform: !overperform }
    //     }

    //     return {};
    // });

    if (!opts.hide_chart) {
        self.chart = self.new_instance(BarChart, {
            formatter: function(value) {
                let data = self.methodology();

                if (data && data.vehicle) {
                    let formatter = Formatters.gen_formatter(data.vehicle.type);
                    return formatter(value);
                }

                return '<span class="text-muted">N/A</span>';
            },
            colors: ['first', '#4D4D4D'],
            credits: false,
            exporting: false,
            height: 110,
            value_key: 'value',
            label_key: 'label',
            compset: {
                data: ko.computed(() => {
                    let data = self.methodology();
                    if (data) {
                        if (data.methodology == 'Cobalt PME') {
                            data.vehicle.color = self.chart.use_custom_colors()
                                ? 'first'
                                : '#FF7C00';
                            data.index.color = '#4D4D4D';
                        }
                        return [data.vehicle, data.index];
                    }
                }),
            },
        });
    } else {
        self.chart = false;
    }

    if (!opts.hide_table) {
        self.table = self.new_instance(CompTable, {
            formatter: function(value) {
                let data = self.methodology();

                if (data && data.vehicle) {
                    let formatter = Formatters.gen_formatter(data.vehicle.type);
                    return formatter(value);
                }

                return '<span class="text-muted">N/A</span>';
            },
            value_key: 'value',
            label_key: 'label',
            compset: {
                data: ko.computed(() => {
                    let data = self.methodology();
                    if (data) {
                        return [
                            data.vehicle,
                            data.index,
                            data.methodology === 'Kaplan Schoar' ? data.result : data.delta,
                        ];
                    }
                }),
            },
        });
    } else {
        self.table = false;
    }

    self.when(self.info_popover).done(() => {
        _dfd.resolve();
    });

    return self;
};

_component.config = {
    id: '',
    component: PMEBox,
    template: 'tpl_pme_box',
    format: '',
    datasource: {
        type: 'dynamic',
        key: '',
        query: {
            target: '',
            as_of_date: 0,
            new_format: true,
            market_id: 0,
        },
    },
};

export default _component;
