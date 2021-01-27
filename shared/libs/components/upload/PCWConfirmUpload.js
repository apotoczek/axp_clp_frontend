/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import Observer from 'src/libs/Observer';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    self.body_text = opts.body_text;

    self.define_default_template(`
            <div class="upload-status upload-status-warning">
                <!--ko if: loading -->
                    <!-- ko template: {
                        name: 'tpl_pcw_crunching_numbers',
                        data: {
                            callout_css: 'callout-warning'
                        },
                    } --><!-- /ko -->
                <!-- /ko -->
                <!-- ko ifnot:loading -->
                <div class="row">
                    <table class="callout-table callout-warning">
                        <tr>
                            <td class="callout-icon">
                                <span class="icon-attention-1">
                            </td>
                            <td>
                                <table style="width: 100%;">
                                    <tr>
                                        <td data-bind="text: body_text">

                                        <td>
                                        <td>
                                            <button class="btn btn-confirm btn-sm pull-right" data-bind="click: finish, disable: loading()">
                                                Finish
                                                <span class="glyphicon glyphicon-ok pull-left" style="color:#fff;"></span>
                                            </button>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                </div>
                <!-- /ko -->
            </div>
        `);

    let _dfd = self.new_deferred();

    self.sheet = opts.sheet;

    self.loading = ko.observable(false);

    self.finish = function() {
        self.loading(true);
        let data = {
            identifier: self.sheet.identifier,
            action: self.sheet.required_action,
            data: true,
        };

        Observer.broadcast_for_id(self.get_id(), 'resolve_spreadsheet_action', data);
    };

    _dfd.resolve();

    return self;
}
