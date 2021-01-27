/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    let _dfd = self.new_deferred();

    self.define_default_template(`
            <div class="row row-margins" data-bind="foreach: columns">
                <div data-bind="css: $parent.column_css">
                    <!-- ko renderComponent: $data --><!-- /ko -->
                </div>
            </div>
        `);

    // This can be a observable/computed or straight up array of component ids
    self.column_layout = opts.columns || [];

    self.columns = ko.pureComputed(() => {
        if (self._components_initialized()) {
            let layout = ko.unwrap(self.column_layout);
            let columns = [];

            for (let item of layout) {
                if (!self.components[item]) {
                    throw `${item} not in components (Row.js)`;
                }

                columns.push(self.components[item]);
            }

            return columns;
        }

        return [];
    });

    self.extract_dynamic_data = () => {
        let columns = self.columns();
        let data = {};
        for (let column of columns) {
            if (typeof column.extract_dynamic_data === 'function') {
                data[column.id] = column.extract_dynamic_data();
            } else {
                data[column.id] = column.data();
            }
        }
        return data;
    };

    self.restore_dynamic_data = data => {
        let columns = self.columns();
        for (let column of columns) {
            if (typeof column.restore_dynamic_data === 'function') {
                column.restore_dynamic_data(data[column.id]);
            } else {
                column.data(data[column.id]);
            }
        }
    };

    self.column_css = ko.pureComputed(() => {
        let num_columns = self.columns().length;

        return `col-md-${12 / num_columns || 1}`;
    });

    _dfd.resolve();

    return self;
}
