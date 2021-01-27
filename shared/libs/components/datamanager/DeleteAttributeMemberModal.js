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
    ];

    let self = new DeleteModalBase(opts, components);

    self.warning_text =
        'Are you sure you want to delete these attribute values? If the values have any children or are attached to any entities, that information will also be deleted. This action can not be undone.';

    self.dfd = $.Deferred();

    self.dfds.push(self.dfd);

    self.attribute_uid_event = opts.attribute_uid_event;
    self.attribute_uid = ko.observable();

    if (self.attribute_uid_event) {
        Observer.register(self.attribute_uid_event, uid => {
            self.attribute_uid(uid);
        });
    }

    self._delete_attribute_members = DataThing.backends.useractionhandler({
        url: 'delete_attribute_members',
    });

    self.delete_entities = function() {
        let data = self.data_to_delete();

        if (data && data.length > 0) {
            self.loading(true);

            self._delete_attribute_members({
                data: {
                    attribute_member_uids: data.map(member => {
                        return member.uid;
                    }),
                    attribute_uid: self.attribute_uid(),
                },
                success: DataThing.api.XHRSuccess(() => {
                    self.reset();

                    Observer.broadcast_for_id(self.get_id(), 'DeleteAttributeMemberModal.success');

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
