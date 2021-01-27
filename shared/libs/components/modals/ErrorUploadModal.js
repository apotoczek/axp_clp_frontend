/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import bison from 'bison';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import DataTable from 'src/libs/components/basic/DataTable';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    self.define_template(`
            <div class="modal fade" tabindex="-1" role="dialog" aria-hidden="true">
                <div class="modal-dialog modal-xl">
                    <div class="modal-content">
                        <div class="modal-header">
                            <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                            <h4 class="modal-title">Errors</h4>
                            <hr class="transparent hr-small">
                            <div class="modal-body">
                            <!-- ko renderComponent: errors_table --><!-- /ko -->
                            <hr class="transparent hr-small">
                            <button type="button" class="btn btn-default" data-dismiss="modal" data-bind="css: { disabled: loading }">Cancel</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `);

    /********************************************************************
     * Components
     ********************************************************************/

    self.errors = ko.computed(() => {
        let data = self.data();

        if (data && data.errors) {
            return data.errors;
        }

        return [];
    });

    self.errors_table = new DataTable({
        parent_id: self.get_id(),
        id: 'to_confirm',
        results_per_page: 10,
        inline_data: true,
        css: 'table-light table-sm',
        data: self.errors,
        columns: [
            {
                label: 'Sheet',
                key: 'sheet',
            },
            {
                label: 'Row',
                key: 'index',
            },
            {
                label: 'Errors',
                key: 'errors',
                format: 'strings_full',
                css: {
                    'text-danger': true,
                },
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
        return;
    };

    return self;
}
