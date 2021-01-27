/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import * as Formatters from 'src/libs/Formatters';
import Observer from 'src/libs/Observer';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    self.define_default_template(`
            <div class="btn-group selected-count" data-bind="visible: visible, css: { 'pull-left': pull_left, 'pull-right': pull_right }">
                <div class="well well-sm">
                    <!-- ko if: loading -->
                        <span class="glyphicon glyphicon-cog animate-spin">
                        </span>
                    <!-- /ko -->
                    <!-- ko ifnot: loading -->
                        <span data-bind="text: selected_count"></span> selected
                        <!-- ko if: toggle_select_all_text -->
                            &ndash;
                            <a class="clickable" data-bind="click: toggle_select_all, text: toggle_select_all_text">
                            </a>
                        <!-- /ko -->
                    <!-- /ko -->
                </div>
            </div>
        `);

    self.data_table_id = opts.data_table_id;

    self._selected_count = ko.observable(0);
    self._count = ko.observable(0);
    self._visible_count = ko.observable(0);

    self.loading(true);

    self.number_formatter = Formatters.gen_formatter('number');

    self.pull_left = opts.pull_left || false;
    self.pull_right = opts.pull_right || false;

    self.visible_without_selection = opts.visible_without_selection || false;

    self.visible = ko.computed(() => {
        if (self.visible_without_selection) {
            return true;
        }
        return self._selected_count() > 0;
    });

    Observer.register_for_id(self.data_table_id, 'DataTable.counts', counts => {
        if (counts) {
            self.loading(false);
            self._selected_count(counts.selected_count);
            self._count(counts.count);
            self._visible_count(counts.visible_count);
        }
    });

    self.toggle_select_all = function() {
        self.loading(true);
        Observer.broadcast_for_id(self.data_table_id, 'DataTable.toggle_select_all');
    };

    self.toggle_select_all_text = ko.computed(() => {
        let selected = self._selected_count();
        let visible = self._visible_count();
        let count = self._count();

        if (selected > 0 && (selected !== count || visible !== count)) {
            if (selected === visible) {
                return `Select all ${self.number_formatter(self._count())}`;
            }
            return 'Select all visible';
        }
    });

    self.selected_count = ko.computed(() => {
        return self.number_formatter(self._selected_count());
    });

    return self;
}
