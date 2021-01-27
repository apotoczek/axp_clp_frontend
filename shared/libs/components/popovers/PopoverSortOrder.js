/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import SortHeader from 'src/libs/components/basic/SortHeader';

export default function(opts, components) {
    let self = new SortHeader(opts, components);

    self.css = opts.css || 'popover-cpanel';

    let _dfd = self.new_deferred();

    self.placement = opts.placement;
    self.match_width = opts.match_width;
    self.title = opts.title;

    self.selected = ko.computed(() => {
        return self.order();
    });

    self.get_value = ko.computed(() => {
        return self.order();
    });

    self.modified = ko.computed(() => {
        return self.order().length > 0;
    });

    self.clear = function() {
        self.clear_order();
    };

    self.selected_string = ko.computed(() => {
        let selected = self.selected();
        if (selected && selected.length > 0) {
            return self
                .selected()
                .map(option => {
                    let column = self.raw_columns.find(column => {
                        return column.key == option.name;
                    });
                    if (column) {
                        let sort = option.sort == 'desc' ? 'Desc' : 'Asc';
                        return `${ko.unwrap(column.label)} ${sort}`;
                    }
                })
                .compact()
                .join(', ');
        }

        return 'No selection';
    });

    _dfd.resolve();

    return self;
}
