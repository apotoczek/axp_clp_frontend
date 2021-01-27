/* Automatically transformed from AMD to ES6. Beware of code smell. */
import bison from 'bison';
import DataThing from 'src/libs/DataThing';
import ListModalBase from 'src/libs/components/market_insights/lists/ListModalBase';

export default function(opts, components) {
    opts.modal_title = 'Edit list';
    opts.submit_label = 'Save';

    let self = new ListModalBase(opts, components);

    self.list_uid = opts.list_uid;

    let _edit_list = DataThing.backends.useractionhandler({
        url: 'edit_list',
    });

    self.on_submit = function() {
        _edit_list({
            data: {
                list: {
                    uid: self.list_uid(),
                    name: self.name(),
                    description: self.description(),
                },
            },
            success: DataThing.api.XHRSuccess(() => {
                DataThing.status_check();
                self.reset();
            }),
            error: DataThing.api.XHRError(() => {}),
        });
    };

    // Override show to manually fetch new information about the current list
    self.show = function() {
        self.loading(true);

        DataThing.get({
            params: {target: 'list', uid: self.list_uid()},
            success: function(data) {
                self.name(data.name);
                self.description(data.description);
                self.loading(false);
            },
            error: function() {
                bison.utils.Notify(
                    'Woops!',
                    'Something went wrong when gathering data for the list. ' + 'Please try again',
                    'alert-error',
                );
                self.reset();
            },
        });

        bison.helpers.modal(self.template, self, self.get_id());
    };

    return self;
}
