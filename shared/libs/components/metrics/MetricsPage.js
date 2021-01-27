import BaseComponent from 'src/libs/components/basic/BaseComponent';
import Observer from 'src/libs/Observer';
import EventRegistry from 'src/libs/components/basic/EventRegistry';

class MetricsPage extends BaseComponent {
    constructor(opts = {}, components = {}) {
        super(opts, components);
        const dfd = this.new_deferred();

        this.define_template(`
            <div class="aside aside-content">
                <!-- ko if: $data.header_section -->
                    <div data-bind="renderComponent:header_section.body" class="metrics-info-header"></div>
                <!-- /ko -->
                <!-- ko if: $data.metric_filter_component -->
                    <div data-bind="renderComponent: metric_filter_component"></div>
                <!-- /ko -->
                <div data-bind="renderComponent: body"></div>
            </div>
        `);

        this.events = this.new_instance(EventRegistry, {});
        this.events.resolve_and_add('body_content', 'DynamicWrapper.active_component');
        this.events.add({name: 'user_changed', event: opts.user_changed_event, id: false});
        this.events.add({name: 'client_changed', event: opts.client_changed_event, id: false});
        this.events.add({
            name: 'time_period_changed',
            event: opts.time_period_changed_event,
            id: false,
        });
        this.events.add({name: 'metric_changed', event: opts.metric_changed_event, id: false});
        this.events.add({name: 'chart_selection', event: opts.chart_selection_event, id: false});

        this.metric_filter_component = opts.metric_filter_component;
        this.body = null;

        this.when(this.metric_filter_component).done(() => {
            // Whenever the dynamic wrapper changes page, refresh
            // the data in that page manually. (Including all of its
            // components)
            Observer.register(this.events.get('body_content'), this.refresh_data_for_components);

            dfd.resolve();
        });
    }

    refresh_data_for_components({body_components, active}) {
        /**
    Goes through the given components recursively (by iterating) and
    ask them to refresh their data. This is allows us to not request
    all of the data for all pages in the dynamic wrapper at initial
    page load. Instead we call this method whenever the dynamic
    wrapper changes page and thus update only that page.
    */
        for (let page of body_components) {
            let is_active_page = page == active;
            if (is_active_page) {
                let components = active.layout.body;
                for (let i = 0; i < components.length; i++) {
                    let component = components[i];

                    if (component.layout && component.layout.body) {
                        components = components.concat(component.layout.body);
                    }

                    component._auto_get_data = is_active_page;
                    component.refresh_data();
                }
            }
        }
    }
}

export default MetricsPage;
