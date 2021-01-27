/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import DeleteModalBase from 'src/libs/components/modals/DeleteModalBase';
import DataThing from 'src/libs/DataThing';

export default function(opts, components) {
    let self = new DeleteModalBase(opts, components);

    let _dfd = self.new_deferred();

    self.endpoint = opts.endpoint;

    self.template = opts.template || 'tpl_delete_modal';
    self.warning_text = ko.computed(() => {
        let data = self.data();
        if (data && data.length > 0) {
            return (
                opts.warning_text ||
                "<span class='text-danger'><strong>Note: </strong>This action will delete all the selected entries and cannot be undone.</span>"
            );
        }
        return 'You have to select one or multiple entities to be able to use this functionality';
    });

    self.btn_text = opts.button_text || 'Delete';

    self._delete_multiple = DataThing.backends.commander({
        url: self.endpoint,
    });

    self.delete_entities = function() {
        let grants = self.data_to_delete();

        if (grants) {
            self._delete_multiple({
                data: {
                    uids: grants.map('uid'),
                },
                success: DataThing.api.XHRSuccess(() => {
                    DataThing.status_check();
                    self.reset();
                }),
                error: DataThing.api.XHRSuccess(response => {
                    alert(response);
                }),
            });
        }
    };

    _dfd.resolve();

    return self;
}
