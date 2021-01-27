/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import bison from 'bison';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import DataThing from 'src/libs/DataThing';
import MetricTable from 'src/libs/components/MetricTable';
import * as Utils from 'src/libs/Utils';
import * as Formatters from 'src/libs/Formatters';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    self.define_template(`
            <div class="modal fade" tabindex="-1" role="dialog" aria-hidden="true">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                            <h4 class="modal-title"><span data-bind="text: token_type"></span> Token</h4>
                        </div>
                        <div class="modal-body">
                            <div class="row">
                                <div class="col-sm-12">
                                <!-- ko renderComponent: token_table --><!-- /ko -->
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-sm-8">
                                    <div class="form-group">
                                    <!-- ko with: token -->
                                    <input type="text" class="form-control" data-bind="value: link, event: { mousedown: $parent.auto_select }" readonly />
                                    <!-- /ko -->
                                    </div>
                                </div>
                                <div class="col-sm-4">
                                    <button type="button" class="btn btn-primary btn-block" data-bind="click: send_email, disable: sending">
                                        <!-- ko ifnot: sending -->
                                        Send
                                        <span data-bind="text: token_type"></span> Email
                                        <!-- /ko -->
                                        <!-- ko if: sending -->
                                        <span class="glyphicon glyphicon-cog animate-spin"></span> Sending
                                        <!-- /ko -->
                                    </button>
                                </div>
                            </div>
                            <hr class="transparent hr-small" />
                            <button type="button" class="btn btn-default" data-dismiss="modal">OK</button>
                        </div>
                    </div>
                </div>
            </div>
        `);

    self.auto_select = Utils.auto_select;

    self.sending = ko.observable(false);

    self.token = ko.pureComputed(() => {
        let data = self.data();
        if (data) {
            return data;
        }
    });

    self.token_type = ko.pureComputed(() => {
        let token = self.token();
        if (token && token.token_type) {
            return Formatters.titleize(token.token_type);
        }
    });

    self.token_table = self.new_instance(MetricTable, {
        id: 'token_table',
        data: self.token,
        css: {
            'table-light': true,
        },
        metrics: [
            {
                label: 'Token Type',
                value_key: 'token_type',
                format: 'titleize',
            },
            {
                label: 'Remaining Uses',
                value_key: 'remaining_uses',
            },
            {
                label: 'Created',
                value_key: 'created',
                format: 'backend_datetime',
            },
            {
                label: 'Expiry',
                value_key: 'expiry',
                format: 'backend_datetime',
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
        self.sending(false);
        self.loading(false);
    };

    self._send_email = DataThing.backends.commander({
        url: 'send_token_email',
    });

    self.send_email = function() {
        let token = self.token();
        if (token) {
            self.sending(true);
            self._send_email({
                data: {token_uid: token.uid},
                success: DataThing.api.XHRSuccess(() => {
                    self.reset();
                }),
                error: DataThing.api.XHRError(() => {
                    self.loading(false);
                }),
            });
        }
    };

    return self;
}
