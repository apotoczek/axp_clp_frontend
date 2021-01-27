/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import BaseModal from 'src/libs/components/basic/BaseModal';
import DataThing from 'src/libs/DataThing';
import Dropdown from 'src/libs/components/basic/NewDropdown';
import EventRegistry from 'src/libs/components/basic/EventRegistry';

export default function(opts, components) {
    let self = new BaseModal(opts, components);

    self.define_default_template(`
            <div class="modal fade" tabindex="-1" role="dialog" aria-hidden="true">
                <div class="modal-dialog modal-md">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h4>Transfer Assets</h4>
                            </div>
                            <div class="modal-body">
                                <p data-bind="text: share_text"></p>
                                <!-- ko renderComponent: dropdown --><!-- /ko -->
                                <div style="height: 34px; margin-top: 10px;">
                                    <button class="btn btn-success pull-right" data-bind="click: transfer">Transfer</button>
                                    <button class="btn btn-default pull-right" style="margin-right:10px;" data-bind="click: cancel">Cancel</button>
                                </div>
                            </div>
                        </div>
                </div>
            </div>
        `);

    self.events = self.new_instance(EventRegistry, {});

    self._user = undefined;

    self.share_text = ko.pureComputed(() => {
        if (self._user && self._user.name) {
            return `Select a user to transfer assets associated with ${self._user.name} to`;
        }
        return '';
    });
    self.selected = function(user) {
        self._user = user;
        self.show();
    };

    self.dropdown = self.new_instance(Dropdown, {
        id: 'dropdown',
        label_key: 'first_name',
        sublabel_key: 'last_name',
        value_key: 'uid',
        datasource: {
            type: 'dynamic',
            key: 'results',
            query: {
                target: 'account:users_for_client',
                results_per_page: 'all',
            },
        },
    });

    self._transfer_assets = DataThing.backends.useractionhandler({
        url: 'transfer_assets',
    });

    self.transfer = function() {
        if (self.dropdown.selected_value() != undefined) {
            let from_uid = self._user.uid;
            let to_uid = self.dropdown.selected_value();
            if (from_uid != undefined) {
                let data = {
                    from: from_uid,
                    to: to_uid,
                };
                self._transfer_assets({
                    data: data,
                    success: DataThing.api.XHRSuccess(() => {
                        DataThing.status_check();
                        self.reset();
                    }),
                    error: DataThing.api.XHRSuccess(() => {
                        self.reset();
                    }),
                });
            }
        }
    };
    self.cancel = function() {
        self.reset();
    };

    return self;
}
