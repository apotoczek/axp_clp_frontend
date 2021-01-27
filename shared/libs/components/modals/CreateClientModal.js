/* Automatically transformed from AMD to ES6. Beware of code smell. */
import bison from 'bison';
import config from 'config';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import DataThing from 'src/libs/DataThing';
import TextInput from 'src/libs/components/basic/TextInput';
import NewDropdown from 'src/libs/components/basic/NewDropdown';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    self.define_template(`
            <div class="modal fade" tabindex="-1" role="dialog" aria-hidden="true">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                            <h4 class="modal-title">Create Client</h4>
                        </div>
                        <div class="modal-body">
                            <div class="row">
                                <div class="col-sm-6">
                                    <div class="form-group">
                                    <!-- ko renderComponent: name --><!-- /ko -->
                                    </div>
                                </div>
                                <div class="col-sm-6">
                                    <div class="form-group">
                                    <!-- ko renderComponent: client_type --><!-- /ko -->
                                    </div>
                                </div>
                            </div>
                            <hr class="transparent hr-small" />
                            <button type="button" class="btn btn-primary" data-bind='click: create_client' data-dismiss="modal">Create</button>
                            <button type="button" class="btn btn-default" data-dismiss="modal">Cancel</button>
                        </div>
                    </div>
                </div>
            </div>
        `);

    /********************************************************************
     * Components
     ********************************************************************/
    self.name = new TextInput({
        allow_empty: false,
        placeholder: 'Client Name',
    });

    self.client_type = new NewDropdown({
        label: 'Client Type',
        btn_css: {
            'btn-ghost-info': true,
        },
        datasource: {
            type: 'dynamic',
            query: {
                target: 'commander:client_types',
            },
        },
    });

    /********************************************************************
     * Modal functionality
     *******************************************************************/
    self.show = function() {
        bison.helpers.modal(self.template, self, self.get_id());
    };

    self.reset = function() {
        self.name.clear();
        bison.helpers.close_modal(self.get_id());
    };

    self._create_client = DataThing.backends.commander({
        url: 'create_client',
    });

    self.create_client = function() {
        let data = {
            name: self.name.value(),
            client_type: self.client_type.value(),
        };

        self._create_client({
            data: data,
            success: DataThing.api.XHRSuccess(data => {
                let client_uid = data.client_uid;
                self.reset();
                redirect(config.commander.clients_url + client_uid);
            }),
            error: DataThing.api.XHRError(() => {
                self.loading(false);
            }),
        });
    };

    return self;
}
