/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    let _dfd = self.new_deferred();

    self.define_default_template(`
            <div data-bind="css: { scrollable: scrollable }, style: { 'max-height': max_height }">
                <table style="text-align:left" class="table table-compact table-bordered table-sheet">
                    <tbody data-bind="foreach: grid">
                        <tr data-bind="foreach: $data">
                            <td data-bind="text: $data.value, click: $parents[1].toggle_selection, css: {
                                selected: $data.selected,
                                column: $data.col_header,
                                row: $data.row_header
                            }"></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `);

    self.max_height = opts.max_height || undefined;
    self.scrollable = opts.scrollable || false;

    self.alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.chars();

    self.select_modes = ['column', 'row', 'cell'];
    self.default_select_mode = opts.select_mode || 'cell';

    self.select_mode = ko.observable(self.default_select_mode);

    self.single_selection = opts.single_selection || false;

    self.grid = ko.observable();

    self._selected = ko.observable({});

    self.get_selected = function() {
        let selected = Object.values(self._selected());
        if (self.single_selection && selected.length > 0) {
            return selected[0];
        }
        return selected;
    };

    self.has_selection = ko.computed(() => {
        return Object.size(self._selected()) > 0;
    });

    self.clear_selection = function() {
        self._selected({});
    };

    self.selected_coords = function(col, row, mode) {
        switch (mode) {
            case 'cell':
                if (col !== undefined && row !== undefined) {
                    return {col: col, row: row};
                }
                return undefined;
            case 'column':
                if (col !== undefined) {
                    return {col: col};
                }
                return undefined;
            case 'row':
                if (row !== undefined) {
                    return {row: row};
                }
                return undefined;
        }
    };

    self.selected_key = function(col, row, mode) {
        let coords = self.selected_coords(col, row, mode);

        if (coords !== undefined) {
            col = coords.col !== undefined ? coords.col : 'col';
            row = coords.row !== undefined ? coords.row : 'row';

            if (coords.row === undefined) {
                return ['col', coords.col];
            }

            if (coords.col === undefined) {
                return ['row', coords.row];
            }

            return [row, col].join(':');
        }

        // switch(mode) {
        //     case 'cell':
        //         if(x !== undefined && y !== undefined) {
        //             return [x, y].join(':');
        //         }
        //         return undefined;
        //     case 'column':
        //         if(x !== undefined) {
        //             return ['x', x].join(':');
        //         }
        //         return undefined;
        //     case 'row':
        //         if(y !== undefined) {
        //             return ['y', y].join(':');
        //         }
        //         return undefined;
        // }
    };

    self.toggle_selection = function(item) {
        let select_mode = self.select_mode() || 'cell';

        let allow_row = select_mode === 'cell' || select_mode === 'row';
        let allow_column = select_mode === 'cell' || select_mode === 'column';

        let key, coords, selected;

        if (item.row && item.column) {
            key = undefined;
            coords = undefined;
        } else if (item.row && allow_row) {
            key = self.selected_key(item.col, item.row, 'row');
            coords = self.selected_coords(item.col, item.row, 'row');
        } else if (item.column && allow_column) {
            key = self.selected_key(item.col, item.row, 'column');
            coords = self.selected_coords(item.col, item.row, 'column');
        } else {
            key = self.selected_key(item.col, item.row, select_mode);
            coords = self.selected_coords(item.col, item.row, select_mode);
        }

        if (self.single_selection) {
            selected = {};
        } else {
            selected = self._selected();
        }

        if (key !== undefined && coords !== undefined) {
            if (selected[key] === undefined) {
                selected[key] = coords;
            } else {
                delete selected[key];
            }
        }

        self._selected(selected);
    };

    self.is_selected = function(col, row) {
        return function() {
            let selected = self._selected();
            if (selected) {
                return (
                    selected[self.selected_key(col, row, 'column')] ||
                    selected[self.selected_key(col, row, 'row')] ||
                    selected[self.selected_key(col, row, 'cell')]
                );
            }
            return false;
        };
    };

    self.generate_grid = function(data) {
        if (data && data.length > 0 && data[0].length > 0) {
            let rows = data.length;
            let columns = data[0].length;

            let grid = [];

            for (let row = 0; row < rows; row++) {
                let generated_row = [];
                for (let col = 0; col < columns; col++) {
                    generated_row.push({
                        col: col,
                        row: row,
                        value: data[row][col],
                        selected: ko.computed(self.is_selected(col, row)),
                    });
                }

                grid.push(generated_row);
            }

            for (let row = 0; row < rows; row++) {
                grid[row].insert({value: row + 1, row_header: true, row: row}, 0);
            }

            let header = [{row_header: true, col_header: true}];

            for (let col = 0; col < columns; col++) {
                header.push({
                    value: self.alphabet[col],
                    col_header: true,
                    col: col,
                });
            }

            grid.insert([header], 0);

            self.grid(grid);
        }
    };

    self.data.subscribe(data => {
        self.generate_grid(data);
    });

    self.generate_grid(self.data());

    _dfd.resolve();

    return self;
}
