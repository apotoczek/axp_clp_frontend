/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import MetricTable from 'src/libs/components/MetricTable';
import Observer from 'src/libs/Observer';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    self.expanded = ko.observable(false);

    self.define_default_template(`
            <div class="full-width" data-bind="click: toggle_expand, css:css" style="overflow:hidden;">
                    <!-- ko renderComponent: metric_table --><!-- /ko -->
            </div>
        `);

    self.css = ko.computed(() => {
        return {expanded: self.expanded()};
    });

    self.toggle_expand = function() {
        self.expanded(!self.expanded());
    };

    if (opts.toggle_event) {
        Observer.register(opts.toggle_event, () => {
            self.toggle_expand();
        });
    }

    self.label = ko.computed(() => {
        return self.expanded() ? 'Hide details' : 'Show details';
    });

    if (opts.metrics) {
        self.metric_table = new MetricTable({
            template: 'tpl_expandable_metric_table',
            metrics: opts.metrics,
            columns: 4,
            data: self.data,
            css: {'table-light': true, 'table-sm': true},
        });

        self.add_dependency(self.metric_table);
    } else if (opts.html) {
        self.html = opts.html;
    }

    return self;
}
