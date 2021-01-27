/* Automatically transformed from AMD to ES6. Beware of code smell. */
/**
 *   Basic Modal for searching a set of data and selecting items in that set
 */
import ko from 'knockout';
import bison from 'bison';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import SelectionDataTable from 'src/libs/components/basic/SelectionDataTable';
import StringFilter from 'src/libs/components/basic/StringFilter';
import TableToolbarGen from 'src/libs/components/basic/TableToolbarGen';
import Observer from 'src/libs/Observer';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    let _dfd = self.new_deferred();

    self.accept_event = opts.accept_event;

    self.define_default_template(`
            <div class="modal fade" tabindex="-1" role="dialog" aria-hidden="true">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h2 class="modal-title" data-bind="html: title"></h2>
                        </div>
                        <div class="modal-body">
                            <!-- ko renderComponent: toolbar --><!-- /ko -->
                            <!-- ko renderComponent: table --><!-- /ko -->
                            <hr class="transparent hr-small" />
                            <button type="button" class="btn btn-success" data-dismiss="modal" data-bind="click: accept, enable: has_selected">Accept</button>
                            <button type="button" class="btn btn-default" data-dismiss="modal">Cancel</button>
                        </div>
                    </div>
                </div>
            </div>
        `);

    self.title = opts.title || 'Missing title';

    self.search_placeholder = opts.search_placeholder || 'Search for entity...';
    self.search_endpoint = opts.search_endpoint;

    if (!opts.table_datasource) {
        throw 'Invalid table datasource';
    }

    self.table_columns = opts.table_columns || [];
    self.table_datasource = opts.table_datasource;
    self.table_row_key = opts.table_row_key;

    /********************************************************************
     * Components
     ********************************************************************/

    self.search_field = self.new_instance(StringFilter, {
        id: 'name',
        template: 'tpl_string_filter',
        clear_event: self.clear_event,
        enable_localstorage: true,
        placeholder: self.search_placeholder,
    });

    self.filters = opts.filters || [];

    self.toolbar = self.new_instance(TableToolbarGen, {
        id: 'table_toolbar',
        buttons: [self.search_field].concat(self.filters),
    });

    self.table = self.new_instance(SelectionDataTable, {
        id: 'table',
        row_key: self.table_row_key,
        results_per_page: 20,
        enable_selection: true,
        title: 'This is the table',
        css: {'table-light': true, 'table-sm': true},
        columns: self.table_columns,
        datasource: self.table_datasource,
    });

    self.accept = () => {
        Observer.broadcast(self.accept_event, self.table.get_selected());
    };

    self.has_selected = ko.pureComputed(() => {
        return self.table.has_selected();
    });

    /********************************************************************
     * Modal functionality
     *******************************************************************/
    self.show = function() {
        bison.helpers.modal(self.template, self, self.get_id());
    };

    self.reset = function() {
        bison.helpers.close_modal(self.get_id());

        self.toolbar.clear();
        self.table.reset_selected();
        self.table.clear_order();
    };

    self.when(self.search_field, self.table, self.filters).done(() => {
        _dfd.resolve();
    });

    return self;
}
