/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import $ from 'jquery';
import pager from 'pager';
import Observer from 'src/libs/Observer';
import DataThing from 'src/libs/DataThing';
import DeleteModalBase from 'src/libs/components/modals/DeleteModalBase';

export default function(opts, components) {
    opts.to_delete_table_columns = [
        {
            label: 'Name',
            key: 'name',
        },
        {
            label: 'Description',
            key: 'description',
        },
        {
            label: 'Permission to delete',
            key: 'write',
            format: 'boolean_highlight',
        },
    ];

    let self = new DeleteModalBase(opts, components);

    self.warning_text =
        'Are you sure you want to delete these attributes? This action can not be undone.';

    self.dfd = $.Deferred();

    self.dfds.push(self.dfd);

    self.attribute_uid_event = opts.attribute_uid_event;
    self.attribute_uid = ko.observable();

    if (self.attribute_uid_event) {
        Observer.register(self.attribute_uid_event, uid => {
            self.attribute_uid(uid);
        });
    }

    self._delete_attributes = DataThing.backends.useractionhandler({
        url: 'delete_attributes',
    });

    self.delete_entities = function() {
        let data = self.data_to_delete();

        if (data && data.length > 0) {
            self.loading(true);

            self._delete_attributes({
                data: {
                    attribute_uids: data
                        .filter(attribute => attribute.write)
                        .map(attribute => {
                            return attribute.uid;
                        }),
                },
                success: DataThing.api.XHRSuccess(() => {
                    self.reset();

                    Observer.broadcast_for_id(self.get_id(), 'DeleteAttributeModal.success');

                    if (self.origin_url) {
                        pager.navigate(self.origin_url);
                    }

                    setTimeout(() => {
                        DataThing.status_check();
                    }, 200);
                }),
            });
        }
    };

    self.dfd.resolve();

    return self;
}
