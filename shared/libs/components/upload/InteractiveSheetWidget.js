/* Automatically transformed from AMD to ES6. Beware of code smell. */
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import Observer from 'src/libs/Observer';
import DataThing from 'src/libs/DataThing';
import * as Utils from 'src/libs/Utils';
import InteractiveSheetWizard from 'src/libs/components/upload/InteractiveSheetWizard';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    self.define_default_template(`
            <div class="upload-status upload-status-warning interactive-sheet-widget">
                <div class="row">
                    <div class="col-xs-12">
                        <!-- ko renderComponent: wizard--><!-- /ko -->
                    </div>
                </div>
            </div>
        `);

    let _dfd = self.new_deferred();

    self._get_raw_sheet = DataThing.backends.dataprovider({
        url: 'raw_spreadsheet',
    });

    self.prompt_text = opts.prompt || 'Spreadsheet == Bad; Please Fix.';
    self.wizard = self.new_instance(InteractiveSheetWizard, {
        prompts: opts.prompts,
    });

    self.data_to_sheet_spec = function(data) {
        /* Data is format:
                {
                    key: { col: val1, row: val2 }
                }
              We want:
                {
                    key: val (whichever is set of val1 and val2)
                }
            */

        let spec = {};

        for (let [key, coords] of Object.entries(data)) {
            spec[key] = Utils.is_set(coords.col) ? coords.col : coords.row;
        }

        return spec;
    };

    self._get_raw_sheet({
        data: {
            identifier: opts.sheet.identifier,
        },
        success: DataThing.api.XHRSuccess(data => {
            self.wizard.data(data);
            self.wizard.next();
            // Start listening to event from interactive wizard
            Observer.register_for_id(
                self.wizard.get_id(),
                'InteractiveSheetWizard.results',
                payload => {
                    // Unregister for the event
                    Observer.unregister_for_id(
                        self.wizard.get_id(),
                        'InteractiveSheetWizard.results',
                    );

                    let data = {
                        identifier: opts.sheet.identifier,
                        action: opts.sheet.required_action,
                    };

                    data.data = self.data_to_sheet_spec(payload);

                    Observer.broadcast_for_id(self.get_id(), 'resolve_spreadsheet_action', data);
                },
            );

            _dfd.resolve();
        }),
    });

    return self;
}
