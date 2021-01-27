/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
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
                                <table style="table-layout: fixed; width: 50%;">
                                    <tr>
                                        <td>
                                            <button class="btn btn-sm btn-confirm btn-block" data-bind="click:choice_replace">Replace</button>
                                        </td>
                                        <td>
                                            <button class="btn btn-sm btn-confirm btn-block" data-bind="click:choice_append">Append</button>
                                        </td>
                                    </tr>
                                    <tr>
                                        <table style="width: 100%;">
                                            <tr>
                                                <td>
                                                    <p class="lead" data-bind="html:prompt_text"></p>
                                                </td>
                                                <td>
                                                    <!-- ko if:choice() -->
                                                        <button class="btn btn-confirm btn-sm pull-right" data-bind="click: accept, disable: loading">
                                                            Continue
                                                            <span class="glyphicon glyphicon-ok pull-left"></span>
                                                        </button>
                                                    <!-- /ko -->
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

    self.entity_name = ko.observable('');

    self.choice = ko.observable();
    self.prompt_text = ko.computed(() => {
        switch (self.choice()) {
            case 'replace_company_valuations':
                return 'All of the valuations in the Fund will be replaced with the data in the sheet.';
            case 'append_company_valuations':
                return 'The data in the sheet will be added to a Fund; existing data will not be affected.';
            default:
                return '<b>Replace</b> all existing valuations for this fund with the valuations in the spreadsheet or <b>Append</b> the data to the existing data';
        }
    });

    self.choice_replace = function() {
        self.choice('replace_company_valuations');
    };
    self.choice_append = function() {
        self.choice('append_company_valuations');
    };

    self.accept = function() {
        self.finish(self.choice());
    };

    self.loading = ko.observable(false);

    self.finish = function(choice) {
        self.loading(true);
        let data = {
            data: self.sheet.data,
            identifier: opts.sheet.identifier,
            action: choice,
        };

        Observer.broadcast_for_id(self.get_id(), 'resolve_spreadsheet_action', data);
    };

    return self;
}
