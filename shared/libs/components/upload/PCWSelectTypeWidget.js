/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import NewDropdown from 'src/libs/components/basic/NewDropdown';
import Observer from 'src/libs/Observer';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    self.define_default_template(`
        <div class="upload-status upload-status-warning">
        <div class="row">
            <table class="callout-table callout-warning">
                <tr>
                    <td class="callout-icon">
                        <span class="icon-attention-1">
                    </td>
                    <td>
                        <table class="new-world-form" style="table-layout: fixed; width: 50%;">
                            <tr>
                                <td>
                                    <!-- ko renderComponent: types --><!-- /ko -->
                                </td>
                            </tr>
                            <tr>
                                <table style="width: 100%;">
                                    <tr>
                                        <td>
                                            <p class="lead">
                                                Select spreadsheet type to continue.
                                            </p>
                                        </td>
                                        <td>
                                            <button class="btn btn-confirm btn-sm pull-right" data-bind="click: finish, disable: loading">
                                                Continue
                                                <span class="glyphicon glyphicon-ok pull-left"></span>
                                            </button>
                                        </td>
                                    </tr>
                                </table>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </div>
        </div>
        `);

    self.sheet = opts.sheet;
    self.options = self.sheet.data;
    self.types = new NewDropdown({
        label: 'Sheet Type',
        btn_css: {'btn-ghost-info': true, 'btn-sm': true},
        label_key: 'description',
        value_key: 'name',
        datasource: {
            type: 'static',
            data: self.options,
        },
    });

    self.loading = ko.observable(false);

    self.finish = function() {
        if (self.types.selected()) {
            self.loading(true);
            let data = {
                identifier: self.sheet.identifier,
                action: 'select_type',
                data: self.types.selected(),
            };
            Observer.broadcast_for_id(self.get_id(), 'resolve_spreadsheet_action', data);
        }
    };

    return self;
}
