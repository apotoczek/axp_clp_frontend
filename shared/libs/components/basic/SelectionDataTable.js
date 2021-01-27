import ko from 'knockout';

import Observer from 'src/libs/Observer';

import DataTable from 'src/libs/components/basic/DataTable';

class SelectionDataTable extends DataTable {
    constructor(opts = {}, components = {}) {
        super(opts, components);

        let _dfd = this.new_deferred();

        this._persistent_selection = ko.observable({});

        this.selected = ko.pureComputed(() => {
            return this.get_selected();
        });

        this.selected_count = ko.pureComputed(() => {
            return Object.size(this._persistent_selection());
        });

        this.has_selected = ko.pureComputed(() => {
            return this.selected_count() > 0;
        });

        this.toggle_select_visible = ko.pureComputed({
            write: value => {
                let _persistent_selection = this._persistent_selection();

                if (value) {
                    for (let row of this.rows()) {
                        _persistent_selection[this.get_row_key(row)] = row;
                    }
                } else {
                    for (let row of this.rows()) {
                        delete _persistent_selection[this.get_row_key(row)];
                    }
                }

                this._persistent_selection(_persistent_selection);
            },
            read: () => {
                let _persistent_selection = this._persistent_selection();

                for (let row of this.rows()) {
                    if (!_persistent_selection[this.get_row_key(row)]) {
                        return false;
                    }
                }

                return true;
            },
        });

        ko.computed(() => {
            this.broadcast_selected();
        });

        _dfd.resolve();
    }

    get_row_key(row) {
        return ko.unwrap(row[this.row_key]);
    }

    set_selected(rows) {
        let _persistent_selection = this._persistent_selection();

        for (let row of rows) {
            _persistent_selection[this.get_row_key(row)] = row;
        }

        this._persistent_selection(_persistent_selection);
    }

    reset_selected() {
        this._persistent_selection({});
    }

    get_selected() {
        return this._persistent_selection && Object.values(this._persistent_selection());
    }

    is_selected(row) {
        return !!this._persistent_selection()[this.get_row_key(row)];
    }

    toggle_select(row) {
        let _persistent_selection = this._persistent_selection();

        if (this.is_selected(row)) {
            delete _persistent_selection[this.get_row_key(row)];
        } else {
            _persistent_selection[this.get_row_key(row)] = row;
        }

        this._persistent_selection(_persistent_selection);

        return true;
    }

    broadcast_selected() {
        Observer.broadcast_for_id(
            this.get_id(),
            'SelectionDataTable.selected',
            this.get_selected(),
        );
    }
}

export default SelectionDataTable;
