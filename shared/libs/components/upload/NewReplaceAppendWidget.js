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
                                            <button class="btn btn-sm btn-confirm btn-block" data-bind="click:choice_new">New</button>
                                        </td>
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
                                                    <p class="lead" data-bind="text:prompt_text"></p>
                                                </td>
                                                <td>
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
            case 'new':
                return 'A new Fund, Portfolio or Index will be created from the data in the sheet.';
            case 'replace':
                return 'All of the data in a Fund, Portfolio or Index will be replaced with the data in the sheet.';
            case 'append':
                return 'The data in the sheet will be added to a Fund, Portfolio or Index; existing data will not be affected.';
            default:
                return (
                    opts.prompt ||
                    'Create a new Fund, Portfolio or Index or replace/append the data in this sheet to an existing entity.'
                );
        }
    });

    self.choice_new = function() {
        self.finish('new');
    };
    self.choice_replace = function() {
        self.finish('replace');
    };
    self.choice_append = function() {
        self.finish('append');
    };

    self.loading = ko.observable(false);

    self.finish = function(choice) {
        self.loading(true);
        let data = {
            data: choice,
            identifier: opts.sheet.identifier,
            action: opts.sheet.required_action,
        };

        Observer.broadcast_for_id(self.get_id(), 'resolve_spreadsheet_action', data);
    };

    return self;
}
