/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import bison from 'bison';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import DataThing from 'src/libs/DataThing';
import DataTable from 'src/libs/components/basic/DataTable';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    self.define_template(`
            <div class="modal fade" tabindex="-1" role="dialog" aria-hidden="true">
                <div class="modal-dialog modal-xl">
                    <div class="modal-content">
                        <div class="modal-header">
                            <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                            <h4 class="modal-title">Following values will be updated</h4>
                            <div class="modal-body">
                                <span class="text-warning">Warnings:</span>
                                <span class="text-warning" data-bind="text: nbr_of_warnings"></span>
                                <hr class="transparent hr-small">
                                <!-- ko renderComponent: to_confirm --><!-- /ko -->
                                <hr class="transparent hr-small">
                                <button type="button" class="btn btn-cpanel-success" data-bind="click: confirm">
                                    <!-- ko if: loading -->
                                        <span class="glyphicon glyphicon-cog animate-spin"></span> Loading...
                                    <!-- /ko -->
                                    <!-- ko ifnot: loading -->
                                        <span data-bind="text: btn_text"></span>
                                    <!-- /ko -->
                                </button>
                                <button type="button" class="btn btn-default" data-dismiss="modal" data-bind="click: cancel, css: { disabled: loading }">Cancel</button>
                                <input type="checkbox" data-bind="checked: include_names,
                                visible: allow_include_names" />
                                <span data-bind="visible: allow_include_names">Include changes to names</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `);

    self.btn_text = 'Confirm';

    self.success_keys = opts.success_keys || [];

    self.confirm_endpoint = opts.confirm_endpoint;

    self.cancel_endpoint = opts.cancel_endpoint;

    self.allow_include_names = ko.observable(opts.allow_include_names || false);

    self.include_names = ko.observable(false);

    self.data_to_confirm = ko.computed(() => {
        let data = self.data();

        if (data && data.uploads) {
            return data.uploads;
        }

        return [];
    });

    self.nbr_of_warnings = ko.computed(() => {
        let data = self.data();

        if (data && data.warnings) {
            return data.warnings;
        }
        return 0;
    });

    self.to_confirm = new DataTable({
        parent_id: self.get_id(),
        id: 'to_confirm',
        results_per_page: 10,
        inline_data: true,
        css: 'table-light table-sm',
        data: self.data_to_confirm,
        columns: self.success_keys,
    });

    /********************************************************************
     * Modal functionality
     *******************************************************************/
    self.show = function() {
        bison.helpers.modal(self.template, self, self.get_id());
    };

    self.reset = function() {
        self.data(undefined);
    };

    self._confirm = DataThing.backends.commander({
        url: self.confirm_endpoint,
    });

    self._cancel = DataThing.backends.commander({
        url: self.cancel_endpoint,
    });

    self.cancel = function() {
        let data = self.data();

        let upload_data = {
            key: data.key,
        };

        self._cancel({
            data: upload_data,
            success: DataThing.api.XHRSuccess(() => {
                self.reset();
                bison.helpers.close_modal(self.get_id());
            }),
            error: DataThing.api.XHRError(() => {
                self.loading(false);
            }),
        });
    };

    self.confirm = function() {
        self.loading(true);
        let data = self.data();
        let upload_data = {
            key: data.key,
            include_names: self.include_names(),
        };
        self._confirm({
            data: upload_data,
            success: DataThing.api.XHRSuccess(() => {
                bison.helpers.close_modal(self.get_id());
                self.reset();
                DataThing.status_check();
                self.loading(false);
            }),
            error: DataThing.api.XHRError(() => {
                self.loading(false);
            }),
        });
    };

    return self;
}
