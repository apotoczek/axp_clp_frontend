/* Automatically transformed from AMD to ES6. Beware of code smell. */
/**
 * Description:
 *   A simple modal that displays a table of contents
 * Keys:
 *   - columns
 *      For the table
 *   - title
 *      Modal header title
 *   - data_handler
 *       function that takes self.data() and table as the arguments.
 *       The idea is to set the table data within this function
 *   - datasource
 *       datasource of the table
 */
import bison from 'bison';
import BaseModal from 'src/libs/components/basic/BaseModal';
import {ComponentConfigException} from 'src/libs/exceptions';
import DataTable from 'src/libs/components/basic/DataTable';

export default function(opts, components) {
    let self = new BaseModal(opts, components);

    self.define_template(`
            <div class="modal fade" tabindex="-1" role="dialog" aria-hidden="true">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                            <h4 class="modal-title" data-bind="text: title"></h4>
                        </div>
                        <div class="modal-body">
                            <!-- ko renderComponent: table --><!-- /ko -->
                            <div style="height:40px">
                            <button type="button" class="btn btn-success pull-right" data-dismiss="modal">Done</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `);

    let _dfd = self.new_deferred();

    self.title = opts.title || 'MISSING TITLE';
    self.table_datasource = opts.table_datasource;

    self.columns = opts.columns;

    if (!self.columns) {
        throw ComponentConfigException('Columns are missing!', opts);
    }

    self.table = self.new_instance(DataTable, {
        id: 'table',
        columns: self.columns,
        debug: true,
        css: {
            'table-light': true,
            'table-sm': true,
        },
        results_per_page: 15,
        datasource: self.table_datasource,
    });

    self.data_handler = opts.data_handler || (data => data);

    if (typeof self.data_handler != 'function') {
        throw ComponentConfigException('data_handler is not a function!', opts);
    }

    self.show = function() {
        self.data_handler(self.data(), self.table);

        bison.helpers.modal(self.template, self, self.get_id());
    };

    _dfd.resolve();

    return self;
}
