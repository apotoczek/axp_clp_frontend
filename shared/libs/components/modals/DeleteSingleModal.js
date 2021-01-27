/* Automatically transformed from AMD to ES6. Beware of code smell. */
import bison from 'bison';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import DataThing from 'src/libs/DataThing';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    let _dfd = self.new_deferred();

    self.endpoint = opts.endpoint;

    self.url = opts.url;

    self.template = opts.template || 'tpl_delete_modal_single';
    self.warning_text =
        "<span class='text-danger'><strong>Note: </strong>This action is permanent and cannot be undone.</span>";

    self.btn_text = 'Delete';

    self._delete_single = DataThing.backends.commander({
        url: self.endpoint,
    });

    self.delete_entity = function() {
        self.data = self.data();
        self._delete_single({
            data: {
                uid: self.data.uid,
            },
            success: DataThing.api.XHRSuccess(() => {
                DataThing.status_check();
                bison.helpers.close_modal(self.get_id());
                redirect(self.url);
            }),
            error: DataThing.api.XHRSuccess(response => {
                alert(response);
            }),
        });
    };

    self.show = function() {
        bison.helpers.modal(self.template, self, self.get_id());
    };

    _dfd.resolve();

    return self;
}
