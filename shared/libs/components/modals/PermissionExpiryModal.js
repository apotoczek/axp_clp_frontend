/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import bison from 'bison';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import DataThing from 'src/libs/DataThing';
import DateInput from 'src/libs/components/basic/DateInput';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    self.define_template(`
            <div class="modal fade" tabindex="-1" role="dialog" aria-hidden="true">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                            <h4 class="modal-title">Update Permission Expiry</h4>
                        </div>
                        <div class="modal-body">
                            <div class="row">
                                <div class="col-sm-3">
                                <!-- ko renderComponent: expiry --><!-- /ko -->
                                </div>
                            </div>
                            <hr class="transparent hr-small" />
                            <button type="button" class="btn btn-primary" data-bind='click: grant_or_update_permission'>Save</button>
                            <button type="button" class="btn btn-default" data-dismiss="modal">Cancel</button>
                        </div>
                    </div>
                </div>
            </div>
        `);

    /********************************************************************
     * Components
     ********************************************************************/

    self.expiry = self.new_instance(DateInput, {
        id: 'expiry',
        placeholder: 'Expiry Date (optional)',
        initial_value_property: 'grant:expiry',
        enable_data_updates: true,
        data: self.data(),
        use_local_time: true,
    });

    /********************************************************************
     * Modal functionality
     *******************************************************************/
    self.show = function() {
        bison.helpers.modal(self.template, self, self.get_id());
    };

    self.reset = function() {
        self.expiry.clear();
        bison.helpers.close_modal(self.get_id());
    };

    self._edit_permission = DataThing.backends.commander({
        url: 'update_permission_grant',
    });

    self.expiry_data = ko.pureComputed(() => {
        let data = self.data();

        if (data) {
            let permission_grant_uid = data.grant.uid;
            let expiry = self.expiry.value();
            return {
                permission_grant_uid,
                expiry,
            };
        }
    });

    self.grant_or_update_permission = function() {
        let data = self.expiry_data();

        self._edit_permission({
            data: data,
            success: DataThing.api.XHRSuccess(() => {
                self.reset();
                DataThing.status_check();
            }),
            error: DataThing.api.XHRError(() => {
                self.loading(false);
            }),
        });
    };

    return self;
}
