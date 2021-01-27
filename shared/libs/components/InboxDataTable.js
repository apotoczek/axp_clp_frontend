/* Automatically transformed from AMD to ES6. Beware of code smell. */
import $ from 'jquery';
import DataTable from 'src/libs/components/basic/DataTable';
import Observer from 'src/libs/Observer';

export default function(opts, components) {
    let self = new DataTable(opts, components);

    let _dfd = $.Deferred();
    self.dfds.push(_dfd);

    self.row_css = opts.row_css;
    self.template = 'tpl_inbox_data_table';

    self.row_click = function(row) {
        Observer.broadcast_for_id(self.get_id(), 'DataTable.click_row', row);
    };

    _dfd.resolve();

    return self;
}
