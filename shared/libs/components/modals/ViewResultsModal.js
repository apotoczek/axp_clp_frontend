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
                            <h4 class="modal-title">Failed Instances</h4>
                            <hr class="transparent hr-small">
                            <div class="modal-body">
                            <!-- ko renderComponent: results_table --><!-- /ko -->
                            <hr class="transparent hr-small">
                            <button type="button" class="btn btn-default" data-dismiss="modal" data-bind="css: { disabled: loading }">Close</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `);

    /********************************************************************
     * Components
     ********************************************************************/

    self.results = ko.computed(() => {
        let data = self.data();

        if (data && data.results) {
            return data.results;
        }

        return [];
    });

    self.results_table = new DataTable({
        parent_id: self.get_id(),
        id: 'failed_results',
        results_per_page: 10,
        inline_data: true,
        css: 'table-light table-sm',
        data: self.data,
        columns: [
            {
                label: 'ID',
                key: 'identifier',
                format: 'strings_full',
            },
            {
                label: 'Errors',
                key: 'errors',
                format: 'strings_full',
                css: {
                    'text-danger': true,
                },
            },
            {
                label: 'Warnings',
                key: 'warnings',
                format: 'strings_full',
                css: {
                    'text-warning': true,
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
