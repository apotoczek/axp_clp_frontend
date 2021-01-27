/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import bison from 'bison';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import DataTable from 'src/libs/components/basic/DataTable';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    let _dfd = self.new_deferred();

    self.template = opts.template || 'tpl_delete_modal';

    self.origin_url = opts.origin_url;

    self.warning_text =
        opts.warning_text ||
        'Are you sure you want to delete these entities? This action can not be undone.';
    self.btn_text = opts.button_text || 'Delete';

    /********************************************************************
     * Table of stuff to be deleted
     *******************************************************************/

    self.data_to_delete = ko.computed(() => {
        let data = self.data();

        if (data) {
            if (Object.isArray(data)) {
                return data;
            }

            return [data];
        }

        return [];
    });
    self.to_delete = new DataTable({
        parent_id: self.get_id(),
        id: 'to_delete',
        results_per_page: 10,
        inline_data: true,
        css: 'table-light table-sm',
        data: self.data_to_delete,
        columns: opts.to_delete_table_columns || [
            {
                label: 'Name',
                key: 'name',
            },
            {
                label: 'Type',
                key: 'entity_type',
                format: 'entity_type',
            },
            {
                label: 'Cashflow Type',
                key: 'cashflow_type',
                format: 'titleize',
            },
            {
                label: 'Permissions',
                key: 'permissions',
                format: 'strings',
            },
            {
                label: 'Permission to delete',
                key: 'share',
                format: 'boolean_highlight',
            },
        ],
    });

    /********************************************************************
     * Modal functionality
     *******************************************************************/

    self.show = function() {
        bison.helpers.modal(self.template, self, self.get_id());
    };

    self.reset = function() {
        bison.helpers.close_modal(self.get_id());
        self.loading(false);
    };

    self.delete_entities = function() {
        throw 'Delete entities has to be implemented in subinstance of DeleteModalBase..';
    };

    _dfd.resolve();

    return self;
}
