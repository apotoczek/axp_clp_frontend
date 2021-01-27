import ko from 'knockout';
import Observer from 'src/libs/Observer';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import Runoff from 'src/libs/components/analytics/horizon_model/Runoff';
import Commitments from 'src/libs/components/analytics/horizon_model/Commitments';
import RadioButtons from 'src/libs/components/basic/RadioButtons';
import EventRegistry from 'src/libs/components/basic/EventRegistry';

class HorizonModel extends BaseComponent {
    constructor(opts, components) {
        super(opts, components);

        this.define_template(`
            <!-- ko renderComponent: chart_toggle --><!-- /ko -->
            <div class="big-message" data-bind="visible: loading">
                <span class="glyphicon glyphicon-cog animate-spin"></span>
                <h1>Loading..</h1>
            </div>
            <div data-bind="attr: { id: html_id() }">
                <!-- ko if: !loading() && error() && error_template() -->
                    <!-- ko template: error_template --><!-- /ko -->
                <!-- /ko -->
                <!-- ko if: !loading() && !error()-->
                    <!-- ko with: active_mode -->
                        <!-- ko renderComponent: $data --><!-- /ko -->
                    <!-- /ko -->
                <!-- /ko -->
            </div>
        `);

        const _dfd = this.new_deferred();

        this.portfolio_uid_event = opts.portfolio_uid_event;
        this.base_query = opts.base_query || {};
        this.register_export_event = opts.register_export_event;
        this.filters = opts.filters;
        this.time_interval_event = opts.time_interval_event;
        this.currency_event = opts.currency_event;
        this.attribute_event = opts.attribute_event;
        this.group_event = opts.group_event;
        this.results_per_page_event = opts.results_per_page_event;

        const events = this.new_instance(EventRegistry, {});
        events.resolve_and_add('chart_toggle', 'RadioButtons.state');

        this.render_currency = ko.observable();

        this.mode = ko.observable('runoff');

        this.modes = {
            runoff: this.new_instance(Runoff, {
                portfolio_uid_event: this.portfolio_uid_event,
                base_query: this.base_query,
                register_export_event: this.register_export_event,
                results_per_page_event: this.results_per_page_event,
                render_currency: this.render_currency,
                filters: this.filters,
                time_interval: this.time_interval_event,
                attribute: this.attribute_event,
                group: this.group_event,
                auto_get_data: opts.auto_get_data,
            }),
            commitments: this.new_instance(Commitments, {
                portfolio_uid_event: this.portfolio_uid_event,
                base_query: this.base_query,
                register_export_event: this.register_export_event,
                results_per_page_event: this.results_per_page_event,
                render_currency: this.render_currency,
                filters: this.filters,
                time_interval: this.time_interval_event,
                attribute: this.attribute_event,
                group: this.group_event,
                auto_get_data: opts.auto_get_data,
            }),
        };

        this.chart_toggle = this.new_instance(RadioButtons, {
            id: 'chart_toggle',
            template: 'tpl_radio_buttons_tabs',
            id_callback: events.register_alias('chart_toggle'),
            default_state: 'runoff',
            button_css: {
                'btn-block': true,
                'btn-transparent': true,
            },
            buttons: [
                {
                    label: 'Cash Flow Runoff',
                    state: 'runoff',
                },
                {
                    label: 'Future Commitments',
                    state: 'commitments',
                },
            ],
        });

        Observer.register(this.currency_event, currency => {
            this.modes.commitments.reset();
            this.render_currency(currency);
        });

        Observer.register(events.get('chart_toggle'), mode => {
            this.mode(mode);
        });

        this.active_mode = ko.computed(() => {
            const mode = this.mode();

            if (mode && this.modes[mode]) {
                return this.modes[mode];
            }
        });

        this.when(this.modes.runoff, this.modes.commitments, this.chart_toggle).done(() => {
            _dfd.resolve();
        });
    }

    set_auto_get_data(value) {
        this.modes.runoff.set_auto_get_data(value);
        this.modes.commitments.set_auto_get_data(value);
    }
}
export default HorizonModel;
