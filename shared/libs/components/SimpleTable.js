/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import * as Formatters from 'src/libs/Formatters';
import * as Utils from 'src/libs/Utils';

export default function(opts, columns) {
    let self = new BaseComponent(opts, columns);

    self.template = opts.template || 'tpl_simple_table';

    self.columns = opts.columns;

    self.css = opts.css || {
        'table-bison': true,
        'metric-table': true,
        'table-light': true,
    };

    self.highlight_key = opts.highlight_key || false;

    self.rows = ko.pureComputed(() => {
        let rows = [];
        let data = self.data();

        if (data) {
            for (let item of data) {
                let row = {
                    cells: [],
                    css: {},
                };

                if (self.highlight_key) {
                    row.css.highlight = item[self.highlight_key] || false;
                }

                for (let column of self.columns) {
                    let formatter;

                    if (item.formats && item.formats[column.key]) {
                        formatter = Formatters.gen_formatter(item.formats[column.key]);
                    } else {
                        formatter = Formatters.gen_formatter({
                            format: column.format,
                            format_args: column.format_args,
                        });
                    }

                    row.cells.push({
                        value: formatter(Utils.extract_data(column.key, item)),
                        css: column.cell_css,
                    });
                }

                rows.push(row);
            }
        }

        return rows;
    });

    return self;
}
