/* Automatically transformed from AMD to ES6. Beware of code smell. */
import bison from 'bison';
import ko from 'knockout';
import config from 'config';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import DataTable from 'src/libs/components/basic/DataTable';
import DataThing from 'src/libs/DataThing';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    let _dfd = self.new_deferred();

    self.loading = ko.observable(false);

    let manage_attributes_image = require('src/img/manage_attributes_image.png');
    self.define_template(`
            <div class="modal fade" tabindex="-1" role="dialog" aria-hidden="true">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                            <h4 class="modal-title">Manage Attributes for Selected Entities</h4>
                        </div>
                        <div class="modal-body">
                            <div class="row">
                                <div class="col-sm-8">
                                    To help you edit multiple entities' attributes at once, download a spreadsheet of this information, edit it, and upload
                                    it in our uploader. We'll update your entities accordingly.
                                </div>
                                <div class="col-sm-4">
                                    <img width=250px src="${manage_attributes_image}"/>
                                </div>
                            </div>
                            <div class="row" style="margin-top: 10px">
                            <!-- ko renderComponent: entities_table --><!-- /ko -->
                            </div>
                            <hr class="transparent hr-small" />
                            <p>
                               <strong>
                                This template will include:
                               </strong><br>
                               <ul>
                               <li>
                               Funds within selected portfolios
                               </li>
                               <li>
                               Companies for funds within the selected portfolios
                               </li>
                               </ul>

                               <em>Note: If you select individual funds, the template will not include the companies for those funds.</em>
                            </p>
                            <button type="button" class="btn btn-cpanel-success" data-bind="click: download, html: download_text, disable: loading"/>
                        </div>
                    </div>
                </div>
            </div>
        `);

    self.download_text = ko.pureComputed(() => {
        if (self.loading()) {
            return '<span class="glyphicon glyphicon-cog animate-spin"/> Preparing Document';
        }
        return 'Download Spreadsheet';
    });

    self.entities_table = self.new_instance(DataTable, {
        id: 'entities_table',
        inline_data: true,
        title: 'Selected entities',
        css: 'table-light table-sm',
        results_per_page: 15,
        columns: [
            {
                key: 'name',
                label: 'Name',
            },
        ],
        data: self.data,
    });

    /************************
     *   Modal functionality *
     *************************/
    self.show = () => {
        bison.helpers.modal(self.template, self, self.get_id());
    };

    self.download = () => {
        let entities = self.data();
        self.loading(true);
        DataThing.get({
            params: {
                target: 'prepare_attribute_spreadsheet',
                entities: entities.map(({entity_type, entity_uid}) => ({entity_type, entity_uid})),
            },
            success: key => {
                DataThing.form_post(config.download_file_base + key);
                self.loading(false);
                bison.helpers.close_modal(self.get_id());
            },
            error: () => {
                self.loading(false);
            },
            force: true,
        });
    };

    _dfd.resolve();
    return self;
}
