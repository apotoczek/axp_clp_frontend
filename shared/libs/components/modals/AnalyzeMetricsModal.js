/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import bison from 'bison';
import BaseModal from 'src/libs/components/basic/BaseModal';
import DataTable from 'src/libs/components/basic/DataTable';
import DataThing from 'src/libs/DataThing';

export default function(opts, components) {
    let self = new BaseModal(opts, components);

    self.define_template(`
        <div class="modal fade" tabindex="-1" role="dialog" aria-hidden="true">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                        <h4 class="modal-title">Validate Metrics</h4>
                    </div>
                    <div class="modal-body">
                        <!-- ko renderComponent: table --><!-- /ko -->
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-success pull-right" data-dismiss="modal">OK</button>
                    </div>
                </div>
            </div>
        </div>
    `);

    self.entity_type = opts.entity_type;
    self.entity_uid = opts.entity_uid;

    self._analyze_metrics = DataThing.backends.useractionhandler({
        url: 'analyze_metrics',
    });

    self.table = self.new_instance(DataTable, {
        columns: [
            {
                key: 'company_name',
                label: 'Company',
            },
            {
                key: 'metric_name',
                label: 'Metric',
            },
            {
                key: 'time_frame',
                label: 'Reporting Period',
            },
            {
                key: 'alert',
                label: 'Alert',
            },
        ],
        css: {'table-light': true, 'table-sm': true},
        inline_data: true,
    });

    /********************************************************************
     * Modal functionality
     *******************************************************************/

    self.show = function() {
        bison.helpers.modal(self.template, self, self.get_id());
        self.table.loading(true);

        self._analyze_metrics({
            data: {
                entity_uid: ko.unwrap(self.entity_uid),
                entity_type: ko.unwrap(self.entity_type),
            },
            success: DataThing.api.XHRSuccess(data => {
                self.table.data(data);
                self.table.loading(false);
            }),
            error: DataThing.api.XHRError(() => {
                self.table.loading(false);
            }),
        });
    };

    self.reset = function() {
        bison.helpers.close_modal(self.get_id());
        self.loading(false);
    };

    return self;
}
