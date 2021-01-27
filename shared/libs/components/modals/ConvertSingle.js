/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import bison from 'bison';
import pager from 'pager';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import DataTable from 'src/libs/components/basic/DataTable';
import DataThing from 'src/libs/DataThing';
import * as Utils from 'src/libs/Utils';

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
                            <!-- ko renderComponent: to_convert --><!-- /ko -->
                            <hr class="transparent hr-small">
                            <p data-bind="html: warning_text"></p>
                            <hr class="transparent hr-small">
                            <button type="button" class="btn btn-danger" data-bind="click: convert_entities, visible: data_to_convert().length > 0, css: { disabled: loading }">
                                <!-- ko if: loading -->
                                    <span class="glyphicon glyphicon-cog animate-spin"></span> Loading...
                                <!-- /ko -->
                                <!-- ko ifnot: loading -->
                                    <span data-bind="text: btn_text"></span>
                                <!-- /ko -->
                            </button>
                            <button type="button" class="btn btn-default" data-dismiss="modal" data-bind="css: { disabled: loading }">Cancel</button>
                        </div>
                    </div>
                </div>
            </div>
        `);

    let _dfd = self.new_deferred();

    self.endpoint = opts.endpoint;
    self.table_columns = opts.table_columns;

    self.warning_text = ko.computed(() => {
        let data = self.data();
        if (data) {
            return "<span class='text-danger'><strong>Note: </strong>This action will convert the entity and cannot be undone.</span>";
        }
        return 'Something went wrong!';
    });

    self.btn_text = 'Convert';

    self._convert = DataThing.backends.commander({
        url: self.endpoint,
    });

    self.data_to_convert = ko.computed(() => {
        let data = self.data();

        if (data) {
            if (Object.isArray(data)) {
                return data;
            }

            return [data];
        }

        return [];
    });

    self.to_convert = self.new_instance(DataTable, {
        id: 'to_convert',
        results_per_page: 10,
        inline_data: true,
        css: 'table-light table-sm',
        data: self.data_to_convert,
        columns: self.table_columns,
    });

    self.convert_entities = function() {
        let data = self.data();

        if (data && typeof data === 'object') {
            self._convert({
                data: {
                    uid: data['uid'],
                },
                success: DataThing.api.XHRSuccess(response => {
                    DataThing.status_check();
                    self.reset();

                    let fund_uid = Utils.get(response.result, 'uid');

                    if (fund_uid) {
                        pager.navigate(`#!/funds/${fund_uid}/edit`);
                    }
                }),
                error: DataThing.api.XHRSuccess(response => {
                    alert(response);
                }),
            });
        }
    };

    self.show = function() {
        bison.helpers.modal(self.template, self, self.get_id());
    };

    self.reset = function() {
        bison.helpers.close_modal(self.get_id());
        self.loading(false);
    };

    _dfd.resolve();

    return self;
}
