/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import bison from 'bison';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import DataTable from 'src/libs/components/basic/DataTable';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    self.define_template(`
            <div class="modal fade" tabindex="-1" role="dialog" aria-hidden="true">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                            <h4 class="modal-title">Please confirm..</h4>
                        </div>
                        <div class="modal-body">
                            <!-- ko renderComponent: to_restore --><!-- /ko -->
                            <hr class="transparent hr-small">
                            <p data-bind="text: warning_text"></p>
                            <hr class="transparent hr-small">
                            <button type="button" class="btn btn-danger" data-bind="click: unarchive_entities, css: { disabled: loading }">
                                <!-- ko if: loading -->
                                    <span class="glyphicon glyphicon-cog animate-spin"></span> Loading...
                                <!-- /ko -->
                                <!-- ko ifnot: loading -->
                                    <span data-bind="text: btn_text"></span>
                                <!-- /ko -->
                            </button>
                            <button type="button" class="btn btn-ghost-default" data-dismiss="modal" data-bind="css: { disabled: loading }">Cancel</button>
                        </div>
                    </div>
                </div>
            </div>
        `);

    self.origin_url = opts.origin_url;

    self.list_uid_event = opts.list_uid_event;

    self.warning_text = 'Are you sure you want to restore these entities?';
    self.btn_text = 'Restore';

    /********************************************************************
     * Table of stuff to be archived
     *******************************************************************/

    self.data_to_restore = ko.computed(() => {
        let data = self.data();
        if (data) {
            if (Object.isArray(data)) {
                return data;
            }

            return [data];
        }

        return [];
    });

    self.to_restore = new DataTable({
        parent_id: self.get_id(),
        id: 'to_restore',
        results_per_page: 10,
        inline_data: true,
        css: 'table-light table-sm',
        data: self.data_to_restore,
        columns: opts.to_restore_table_columns || [
            {
                label: 'Name',
                key: 'name',
            },
            {
                label: 'Type',
                key: 'entity_type',
                format: 'entity_type',
            },
            {
                label: 'Cashflow Type',
                key: 'cashflow_type',
                format: 'titleize',
            },
            {
                label: 'Permissions',
                key: 'permissions',
                format: 'strings',
            },
        ],
    });

    /********************************************************************
     * Modal functionality
     *******************************************************************/

    self.show = function() {
        bison.helpers.modal(self.template, self, self.get_id());
    };

    self.reset = function() {
        bison.helpers.close_modal(self.get_id());
        self.loading(false);
    };

    self.unarchive_entities = function() {
        throw 'UnArchive entities has to be implemented in subinstance of UnArchiveModalBase..';
    };

    return self;
}
