/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import bison from 'bison';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import DataThing from 'src/libs/DataThing';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    self.define_template(`
            <div class="modal fade" tabindex="-1" role="dialog" aria-hidden="true">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                            <h4 class="modal-title">Invite Colleagues</h4>
                        </div>
                        <div class="modal-body">
                            <!-- ko foreach: users -->
                            <div class="row row-margins">
                                <div class="col-xs-4">
                                    <input type="text" class="form-control" data-bind="textInput: email" placeholder="Email">
                                </div>
                                <div class="col-xs-4">
                                    <input type="text" class="form-control" data-bind="textInput: first_name" placeholder="First name">
                                </div>
                                <div class="col-xs-4">
                                    <input type="text" class="form-control" data-bind="textInput: last_name" placeholder="Last name">
                                </div>
                            </div>
                            <hr class="hr-tiny transparent">
                            <!-- /ko -->
                            <button class="btn btn-sm btn-cpanel-success" data-bind="click: add_user">
                                <span class="glyphicon glyphicon-plus"></span>
                            </button>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-cpanel-success" data-bind="click: invite_users, disable: loading">
                                Invite users
                            </button>
                            <button type="button" class="btn btn-ghost-default" data-dismiss="modal">Cancel</button>
                        </div>
                    </div>
                </div>
            </div>
        `);

    opts = opts || {};

    self.users = ko.observableArray([]);

    self.add_user = function() {
        self.users.push({
            first_name: ko.observable(''),
            last_name: ko.observable(''),
            email: ko.observable(''),
        });
    };

    self._invite_users = DataThing.backends.useractionhandler({
        url: 'invite_users',
    });

    self.invite_users = function() {
        let users = self.users();

        let valid_users = [];

        for (let i = 0, l = users.length; i < l; i++) {
            let first_name = users[i].first_name();
            let last_name = users[i].last_name();
            let email = users[i].email();

            if (
                first_name.length &&
                last_name.length &&
                email.length &&
                bison.helpers.is_valid_email(email)
            ) {
                valid_users.push({
                    first_name: first_name,
                    last_name: last_name,
                    email: email,
                });
            }
        }

        if (valid_users.length) {
            self.loading(true);

            self._invite_users({
                data: {
                    users: valid_users,
                },
                success: DataThing.api.XHRSuccess(data => {
                    if (data) {
                        DataThing.status_check();

                        let successful = [];
                        let failed = [];

                        for (let [email, result] of Object.entries(data)) {
                            if (result.success) {
                                successful.push(email);
                            } else {
                                failed.push(
                                    `${email} (${Object.values(result.errors).join(', ')})`,
                                );
                            }
                        }

                        let message_components = [];
                        let alert_type = 'alert-info';

                        if (successful.length) {
                            message_components.push(
                                `Successfully invited ${bison.helpers.format_array(successful)}`,
                            );
                        }

                        if (failed.length) {
                            for (let i = 0, l = failed.length; i < l; i++) {
                                message_components.push(`Failed to invite ${failed[i]}`);
                            }
                        }

                        if (!successful.length && failed.length) {
                            alert_type = 'alert-danger';
                        } else if (successful.length && !failed.length) {
                            alert_type = 'alert-success';
                        }

                        bison.utils.Notify(
                            'Heads up!<br>',
                            message_components.join('<br>'),
                            alert_type,
                            5000,
                        );
                    }
                    self.reset();
                }),
                error: DataThing.api.XHRError(() => {
                    self.loading(false);
                }),
            });
        } else {
            bison.utils.Notify(
                'Heads up!',
                'You have to provide a valid email, first and last name to invite a user.',
            );
        }
    };

    /********************************************************************
     * Modal functionality
     *******************************************************************/

    self.show = function() {
        self.add_user();

        bison.helpers.modal(self.template, self, self.get_id());
    };

    self.reset = function() {
        self.users([]);

        self.loading(false);

        bison.helpers.close_modal(self.get_id());
    };

    return self;
}
