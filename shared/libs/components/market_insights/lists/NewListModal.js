/* Automatically transformed from AMD to ES6. Beware of code smell. */
import DataThing from 'src/libs/DataThing';
import ListModalBase from 'src/libs/components/market_insights/lists/ListModalBase';

export default function(opts, components) {
    opts.modal_title = 'Create new list';
    opts.submit_label = 'Create';

    let self = new ListModalBase(opts, components);

    let _save_list = DataThing.backends.useractionhandler({
        url: 'save_list',
    });

    self.on_submit = function() {
        _save_list({
            data: {
                list: {
                    entities: [],
                    name: self.name(),
                    description: self.description(),
                    monitoring: false,
                },
            },
            success: DataThing.api.XHRSuccess(() => {
                DataThing.status_check();
                self.reset();
            }),
            error: DataThing.api.XHRError(() => {}),
        });
    };

    return self;
}
