/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import Observer from 'src/libs/Observer';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    self.define_default_template(`
            <div class="upload-status upload-status-success">
                <!--ko if: loading -->
                    <!-- ko template: {
                        name: 'tpl_pcw_crunching_numbers',
                        data: {
                            callout_css: 'callout-success'
                        },
                    } --><!-- /ko -->
                <!-- /ko -->
                <!-- ko ifnot:loading -->
                <div class="row">
                    <table class="callout-table callout-success">
                        <tr>
                            <td class="callout-icon">
                                <span class="glyphicon glyphicon-ok">
                            </td>
                            <td>
                                <table class="new-world-form" style="table-layout: fixed; width: 50%;">
                                    <tr>
                                        <td>
                                            <input type="text" placeholder="Name" class="form-control input-sm" data-bind="textInput: entity_name"/>
                                        </td>
                                    </tr>
                                </table>
                                <table style="width: 100%;">
                                    <tr>
                                        <td>
                                            <p class="lead">
                                                <span data-bind="text: prompt_text"></span>
                                            </p>
                                        </td>
                                        <td>
                                            <button class="btn btn-confirm btn-sm pull-right" data-bind="click: finish, disable: loading() || !valid()">
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

    self.entity_name = ko.observable('');

    self.prompt_text = opts.prompt || 'Please provide a name';

    self.loading = ko.observable(false);

    self.valid = ko.pureComputed(() => {
        let entity_name = self.entity_name();
        return entity_name && entity_name.length;
    });

    self.finish = function() {
        let name = self.entity_name();

        if (name && name.length) {
            self.loading(true);
            let data = {
                data: {
                    name: name,
                },
                identifier: opts.sheet.identifier,
                action: opts.sheet.required_action,
            };

            Observer.broadcast_for_id(self.get_id(), 'resolve_spreadsheet_action', data);
        } else {
            return;
            // TODO: Form validation
        }
    };

    _dfd.resolve();

    return self;
}
