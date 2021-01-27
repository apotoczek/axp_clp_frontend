/* Automatically transformed from AMD to ES6. Beware of code smell. */
import DataTable from 'src/libs/components/basic/DataTable';
import ko from 'knockout';

export default function(opts, components) {
    let self = new DataTable(opts, components);

    let _dfd = self.new_deferred();

    self.restore_dynamic_data = function(snapshot) {
        // Handle the backwards-compatibility case, where `snapshot` has the data inline
        if (Array.isArray(snapshot) || !snapshot.data) {
            self.data(snapshot);
            self.comps = [];
        } else {
            self.data(snapshot.data);
            self.comps = snapshot.comps ?? [];
        }
    };

    self.extract_dynamic_data = function() {
        let snapshot = {
            data: self.data(),
        };
        if (self.comps) {
            snapshot.comps = ko.unwrap(self.comps);
        }
        return snapshot;
    };

    self.restore_static_data = function(snapshot) {
        self.visible_columns.set_inner_state(snapshot.visible_columns);
        self.set_state(snapshot.state);
    };

    self.extract_static_data = function() {
        return {
            visible_columns: self.visible_columns.get_inner_state(),
            state: self.get_state(),
        };
    };

    _dfd.resolve();

    return self;
}
