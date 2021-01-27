/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import $ from 'jquery';
import Observer from 'src/libs/Observer';
import DataThing from 'src/libs/DataThing';
import DeleteModalBase from 'src/libs/components/modals/DeleteModalBase';

export default function(opts, components) {
    let self = new DeleteModalBase(opts, components);

    self.dfd = $.Deferred();
    self.dfds.push(self.dfd);

    self.list_uid_event = opts.list_uid_event;
    self.list_uid = ko.observable();

    Observer.register(self.list_uid_event, self.list_uid);

    self._remove_entities_from_list = DataThing.backends.useractionhandler({
        url: 'remove_entities_from_list',
    });

    self.warning_text = 'Are you sure you want to remove these entities from the list?';

    self.delete_entities = function() {
        let data = self.data_to_delete();

        if (data && data.length > 0) {
            let entities = [];

            for (let i = 0, j = data.length; i < j; i++) {
                entities.push({
                    uid: data[i].uid,
                    entity_type: data[i].entity_type,
                });
            }

            self._remove_entities_from_list({
                data: {
                    uid: self.list_uid(),
                    entities: entities,
                },
                success: DataThing.api.XHRSuccess(() => {
                    DataThing.status_check();
                    self.reset();
                }),
                error: DataThing.api.XHRError(() => {}),
            });
        }
    };

    self.dfd.resolve();

    return self;
}
