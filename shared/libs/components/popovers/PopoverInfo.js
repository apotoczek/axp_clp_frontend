/* Automatically transformed from AMD to ES6. Beware of code smell. */
import $ from 'jquery';
import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import MetricTable from 'src/libs/components/MetricTable';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    self.template = opts.template || 'tpl_popover_info';

    let _dfd = $.Deferred();
    self.dfds.push(_dfd);

    self.placement = opts.placement;
    self.match_width = opts.match_width;
    self.title = opts.title;

    if (opts.metrics) {
        self.metric_table = new MetricTable({
            template: 'tpl_dl_metric_table',
            metrics: opts.metrics,
            data: self.data,
            css: {'table-light': true, 'table-sm': true},
        });

        self.add_dependency(self.metric_table);
    } else if (opts.html) {
        self.html = opts.html;
    }

    self.set_state = function() {};

    self.get_state = function() {};

    self.get_metrics = function() {};

    self.get_value = ko.observable();

    self.modified = function() {
        return false;
    };

    self.clear = function() {};

    self.selected_string = function() {};

    _dfd.resolve();

    return self;
}
