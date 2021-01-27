/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    self.define_default_template(`
            <div class="row">
                <!-- ko foreach: layout.row -->
                    <div data-bind="css: $parent.column_css">
                        <!-- ko renderComponent: $data --><!-- /ko -->
                    </div>
                <!-- /ko -->
            </div>
        `);

    self.column_css = ko.computed(() => {
        if (opts.layout.row) {
            let nbr_of_cols = opts.layout.row.length;

            return `col-xs-${12 / nbr_of_cols}`;
        }
        return 'col-xs-12';
    });

    return self;
}
