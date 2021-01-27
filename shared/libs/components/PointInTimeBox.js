/* Automatically transformed from AMD to ES6. Beware of code smell. */
import PopoverInfo from 'src/libs/components/popovers/PopoverInfo';
import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import NumberBox from 'src/libs/components/basic/NumberBox';
import NewPopoverButton from 'src/libs/components/popovers/NewPopoverButton';
import MetricTable from 'src/libs/components/MetricTable';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    self.metric_table = new MetricTable({
        template: opts.metric_table_template || 'tpl_metric_table',
        css: {'table-light': true},
        metrics: [
            {
                label: 'Start',
                value_key: 'start',
                format: 'backend_date',
            },
            {
                label: 'End',
                value_key: 'end',
                format: 'backend_date',
            },
            {
                label: 'Duration',
                value_key: 'total_years',
                format: 'years',
            },
            {
                label: 'Start NAV',
                format: 'money',
                format_args: {
                    value_key: 'start_nav',
                    currency_key: 'render_currency',
                },
            },
            {
                label: 'End NAV',
                format: 'money',
                format_args: {
                    value_key: 'end_nav',
                    currency_key: 'render_currency',
                },
            },
            {
                label: 'Distributed',
                format: 'money',
                format_args: {
                    value_key: 'distrib',
                    currency_key: 'render_currency',
                },
            },
            {
                label: 'Paid In',
                format: 'money',
                format_args: {
                    value_key: 'contrib',
                    currency_key: 'render_currency',
                },
            },
            {
                label: 'Compounded TWRR',
                value_key: 'compounded',
                format: 'percent_highlight_delta',
            },
        ],
        data: self.data,
        loading: self.loading,
    });

    let hpr_image = require('src/img/math/point_in_time/hpr.png');
    let ctwr_image = require('src/img/math/point_in_time/ctwr.png');
    let atwr_image = require('src/img/math/point_in_time/atwr.png');
    let def_image = require('src/img/math/point_in_time/def.png');
    self.info_popover = self.new_instance(NewPopoverButton, {
        label: 'What is Annualized Time-Weighted Rate of Return?',
        id: 'info_popover',
        template: 'tpl_text_popover_button',
        css: {},
        popover_options: {
            placement: 'bottom',
            title: 'What is Annualized Time-Weighted Rate of Return?',
        },
        popover_config: {
            component: PopoverInfo,
            html: oneLine`
                <div style="padding:5px;max-width:500px;">
                    <img src="${hpr_image}" style="width:115%;display:block;margin-bottom:15px;">
                    <img src="${ctwr_image}" style="width:65%;display:block;margin-bottom:15px;">
                    <img src="${atwr_image}" style="width:65%;display:block;margin-bottom:25px;">
                    <img src="${def_image}" style="width:100%;display:block;margin-bottom:15px;">
                </div>
            `,
        },
    });

    self.callout = new NumberBox({
        template: 'tpl_number_box',
        label: 'Annualized Time-Weighted<br />Rate of Return',
        format: 'percent_highlight_delta',
        loading: self.loading,
        data: ko.computed(() => {
            let data = self.data();
            if (data) {
                return data['annualized'];
            }
        }),
    });

    self.callout2 = new NumberBox({
        template: 'tpl_number_box',
        label: 'Annualized Money-Weighted<br />Rate of Return',
        format: 'percent_highlight_delta',
        loading: self.loading,
        data: ko.computed(() => {
            let data = self.data();
            if (data) {
                return data['money_weighted_annualized_irr'];
            }
        }),
    });

    return self;
}
