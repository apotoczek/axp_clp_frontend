/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import Observer from 'src/libs/Observer';
import BarChart from 'src/libs/components/charts/BarChart';
import BenchmarkChart from 'src/libs/components/charts/BenchmarkChart';
import PointInTimeChart from 'src/libs/components/charts/PointInTimeChart';
import ColorPicker from 'src/libs/components/basic/ColorPicker';
import ActionButton from 'src/libs/components/basic/ActionButton';
import EventRegistry from 'src/libs/components/basic/EventRegistry';
import ConfirmDeleteModal from 'src/libs/components/modals/ConfirmDeleteModal';
import ConfirmModal from 'src/libs/components/modals/ConfirmModal';
import Customizations from 'src/libs/Customizations';

export default function(opts, components) {
    opts = opts || {};

    opts.get_user = true;

    let self = new BaseComponent(opts, components);

    self.dfd = self.new_deferred();

    self.define_template(`
            <div class="settings-chart-colors">
                <div class="row row-margins">
                    <div class="col-xs-12">
                        <h3 style="border-bottom:1px solid #ddd;padding:10px;">
                            My Chart Colors
                            <a href="#!/account" data-bind='if:use_custom_colors, click: confirm_reset_colors_modal.show'>
                        <span class="glyphicon glyphicon-remove-circle"> </span> Restore default colors</a>
                        </h3>

                        <ul data-bind="foreach: { data: color_picker_arr.to(8), as: 'color_picker' }"><li><!-- ko renderComponent: color_picker --><!-- /ko --></li></ul>

                        <h5 class="text-info" style="margin-left:15px;"><!-- ko if:unsaved_changes -->You currently have unsaved changes<!-- /ko -->&nbsp;</h5>
                        <!-- ko renderComponent: save_colors_button --><!-- /ko -->
                        <!-- ko renderComponent: undo_pending_colors_button --><!-- /ko -->

                        <h4>Chart Previews</h4>

                        <div class="col-xs-3">
                            <!-- ko renderComponent: example_charts.vendela_chart --><!-- /ko -->
                        </div>
                        <div class="col-xs-4">
                            <!-- ko renderComponent: example_charts.bar_chart --><!-- /ko -->
                        </div>
                        <div class="col-xs-5">
                            <!-- ko renderComponent: example_charts.point_in_time_chart --><!-- /ko -->
                        </div>
                    </div>
                </div>
            </div>
        `);

    self.events = self.new_instance(EventRegistry, {});
    self.events.new('save_color_selection');
    self.events.new('undo_pending_color_selection');
    self.events.new('delete_custom_colors');

    // modal 'display' is called by an <a> tag inside the template
    self.confirm_reset_colors_modal = self.new_instance(ConfirmDeleteModal, {
        id: 'confirm_reset_colors_modal',
        text:
            'Are you sure you want to delete your chart color customizations?\nChart colors will return to defaults.',
        confirm_delete_event: self.events.get('delete_custom_colors'),
    });

    self.confirm_save_colors_modal = self.new_instance(ConfirmModal, {
        id: 'confirm_save_colors_modal',
        text: 'Are you sure you want to update your chart color customizations?',
        confirm_event: self.events.get('save_color_selection'),
    });
    self.confirm_undo_pending_colors_modal = self.new_instance(ConfirmModal, {
        id: 'confirm_undo_pending_colors_modal',
        text: 'Discard new changes to color selection?',
        confirm_event: self.events.get('undo_pending_color_selection'),
    });

    self.example_charts = {
        bar_chart: self.new_instance(BarChart, {
            id: 'bar_chart',
            template: 'tpl_chart',
            vertical_bars: false,
            format: 'multiple',
            value_key: 'value',
            label_key: 'label',
            colors: [
                Customizations.get_color('first'),
                Customizations.get_color('second'),
                Customizations.get_color('third'),
                Customizations.get_color('fourth'),
            ],
            data: [
                {
                    label: 'A',
                    value: 5,
                },
                {
                    label: 'B',
                    value: 4,
                },
                {
                    label: 'C',
                    value: 3,
                },
                {
                    label: 'D',
                    value: 2,
                },
            ],
        }),

        vendela_chart: self.new_instance(BenchmarkChart, {
            format: 'irr',
            label: 'IRR',
            label_in_chart: true,
            data: {
                average: 0.06536,
                count: 69,
                fences: {
                    inner: {
                        lower: 0.01458,
                        upper: 0.152648,
                    },
                    outer: {
                        lower: 0.01458,
                        upper: 0.155342,
                    },
                },
                max: 0.1503420195439739,
                min: 0.0145757875096038,
                quartiles: [-0.034154829636392, 0.05388663667439, 0.097108377529762],
            },
            height: self.chart_height,
            legend: true,
        }),

        point_in_time_chart: self.new_instance(PointInTimeChart, {
            label: 'Total Value across Rate of Return',
            label_in_chart: true,
            data: {
                annualized: 1.0291830939453965,
                cashflows: 0,
                compounded: 1.0291830939453965,
                contrib: 0,
                distrib: 0,
                end: 1388448000,
                end_nav: 770782039.0,
                end_value: 2125179839.5700002,
                money_weighted_annualized_irr: 1.0291829415068021,
                money_weighted_sub_year_irr: 1.0291829415068021,
                periods: [
                    {
                        cashflows: 0,
                        contrib: 0,
                        distrib: 0,
                        end: 1364688000,
                        end_nav: 417833287.41,
                        end_value: 1772231087.9800003,
                        hpr: 0.1,
                        start: 1356912000,
                        start_nav: 379848443.1,
                        start_value: 1734246243.67,
                        total_value: 1772231087.9800003,
                    },
                    {
                        cashflows: 0,
                        contrib: 0,
                        distrib: 0,
                        end: 1372550400,
                        end_nav: 501399944.89,
                        end_value: 1855797745.46,
                        hpr: 0.19999999999521328,
                        start: 1364688000,
                        start_nav: 417833287.41,
                        start_value: 1772231087.9800003,
                        total_value: 1855797745.46,
                    },
                    {
                        cashflows: 0,
                        contrib: 0,
                        distrib: 0,
                        end: 1380499200,
                        end_nav: 750551021.0,
                        end_value: 2104948821.5700002,
                        hpr: 0.4969108565910597,
                        start: 1372550400,
                        start_nav: 501399944.89,
                        start_value: 1855797745.46,
                        total_value: 2104948821.5700002,
                    },
                    {
                        cashflows: 0,
                        contrib: 0,
                        distrib: 0,
                        end: 1388448000,
                        end_nav: 770782039.0,
                        end_value: 2125179839.5700002,
                        hpr: -0.126954887054906826,
                        start: 1380499200,
                        start_nav: 750551021.0,
                        start_value: 2104948821.5700002,
                        total_value: 2125179839.5700002,
                    },
                ],
                render_currency: 'USD',
                start: 1356912000,
                start_nav: 379848443.1,
                start_value: 1734246243.67,
                total_time: 31536000.0,
                total_years: 1.0,
            },
            loading: self.loading,
        }),
    };

    self.unsaved_changes = ko.observable(false);
    self.use_custom_colors = Customizations.use_custom_colors;

    self.color_picker_arr = [];
    for (let color_name of Customizations.color_names) {
        let picker = self.new_instance(ColorPicker, {
            color_name: color_name,
            color_value: Customizations.get_color(color_name),
            change_callback: function(data) {
                // temp session storage for colors
                self.temp_user_colors[data.color_name] = data.new_color_val;

                let temp_user_colors = self.temp_user_colors;
                let colors = Customizations.get_colors();

                self.unsaved_changes(false);
                for (let key in temp_user_colors) {
                    if (temp_user_colors[key] !== colors[key]) {
                        self.unsaved_changes(true);
                    }
                }
                // updates chart previews
                Observer.broadcast('UpdateChartColors.global', data);
            },
        });

        self.color_picker_arr.push(picker);
    }

    self.save_colors_button = self.new_instance(ActionButton, {
        id: 'save_colors_button',
        label: 'Save custom values',
        css: {
            'btn-success': true,
            disabled: ko.pureComputed(() => {
                return !self.unsaved_changes();
            }),
        },
        broadcast_event: function() {
            if (self.unsaved_changes()) {
                self.confirm_save_colors_modal.show();
            }
        },
    });
    self.undo_pending_colors_button = self.new_instance(ActionButton, {
        id: 'undo_pending_colors_button',
        label: 'Discard edits',
        css: {
            'btn-success': true,
            disabled: ko.pureComputed(() => {
                return !self.unsaved_changes();
            }),
        },
        broadcast_event: function() {
            if (self.unsaved_changes()) {
                self.confirm_undo_pending_colors_modal.show();
            }
        },
    });

    self.my_dfds = self.color_picker_arr.concat([
        Customizations,
        self.example_charts.bar_chart,
        self.example_charts.vendela_chart,
        self.example_charts.point_in_time_chart,
        self.save_colors_button,
    ]);

    self.temp_user_colors = {};
    self.init = function() {
        self.temp_user_colors = Object.assign({}, Customizations.get_colors());
    };

    self.when.apply(null, self.my_dfds).done(() => {
        Observer.register(self.events.get('save_color_selection'), () => {
            let color_arr = Customizations.color_names.map(color_name => {
                return self.temp_user_colors[color_name];
            });

            let color_data = {
                custom_colors: color_arr,
            };
            Customizations.update_color_settings(color_data);
        });
        Observer.register(self.events.get('undo_pending_color_selection'), () => {
            location.reload();
        });

        Observer.register(self.events.get('delete_custom_colors'), () => {
            Customizations.reset_color_settings();
        });
        self.init();
        self.dfd.resolve();
    });

    return self;
}
