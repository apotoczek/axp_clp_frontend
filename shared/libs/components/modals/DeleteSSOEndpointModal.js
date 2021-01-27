import ko from 'knockout';
import bison from 'bison';
import BaseModal from 'src/libs/components/basic/BaseModal';
import DataThing from 'src/libs/DataThing';
import Observer from 'src/libs/Observer';

export default class DeleteSSOEndpointModal extends BaseModal {
    constructor(opts, components) {
        super(opts, components);

        let _dfd = this.new_deferred();

        this.define_template(`
            <div class="modal fade" tabindex="-1" role="dialog" aria-hidden="true">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                            <h4 class="modal-title">Delete SSO Endpoint Config</h4>
                        </div>
                        <div class="modal-body">
                            <div class="row">
                                <div class="col-sm-12">
                                    <span class="text-danger">
                                        Are you sure you want to <strong>delete</strong> the configured endpoint?
                                    </span>
                                    <br/><br/>
                                
                                    <div>
                                        <label>Vanity Link</label>
                                        <br/>
                                        <span data-bind="text: vm.vanity_link" />
                                        <br/><br/>
                                    </div>
                                    
                                    <div>
                                        <label>User Domain</label>
                                        <br/>
                                        <span data-bind="text: vm.user_domain" />
                                        <br/><br/>
                                    </div>
                                    
                                    <div>
                                        <label>Protocol</label>
                                        <br/>
                                        <span data-bind="visible: vm.supports_saml">SAML</span>
                                        <span data-bind="visible: vm.supports_saml && vm.supports_oauth2">, </span>
                                        <span data-bind="visible: vm.supports_oauth2">OAuth</span>
                                        <br/><br/>
                                    </div>
                                    
                                    <div>
                                        <label>Auto-Create Missing Users</label>
                                        <br/>
                                        <span data-bind="text: vm.create_missing_users" />
                                        <br/><br/>
                                    </div>
                                    
                                    <div>
                                        <label>SAML IdP URL</label>
                                        <br/>
                                        <span data-bind="text: vm.idp_url" />
                                        <br/><br/>
                                    </div>
                                
                                    <div>
                                        <label>SAML IdP Entity ID</label>
                                        <br/>
                                        <span data-bind="text: vm.idp_entity_id" />
                                        <br/><br/>
                                    </div>
                                    
                                    <div>
                                        <label>OAuth Issuer</label>
                                        <br/>
                                        <span data-bind="text: vm.oauth_issuer" />
                                        <br/><br/>
                                    </div>
                                </div>
                            </div>

                            <hr class="transparent hr-small" />
                            <button type="button" class="btn btn-danger" data-bind='click: delete_sso_endpoint'>Delete</button>
                            <button type="button" class="btn btn-default" data-dismiss="modal">Cancel</button>
                        </div>
                    </div>
                </div>
            </div>
        `);

        this.vm = {
            uid: ko.observable(),
            client_uid: ko.observable(),
            idp_url: ko.observable(),
            idp_entity_id: ko.observable(),
            custom_sp_entity_id: ko.observable(),
            oauth_issuer: ko.observable(),
            vanity_link: ko.observable(),
            user_domain: ko.observable(),
            supports_saml: ko.observable(),
            supports_oauth2: ko.observable(),
            auto_redirect_vanity_link: ko.observable(true),
            auto_redirect_user_domain: ko.observable(),
            auto_redirect_ip: ko.observable(),
            create_missing_users: ko.observable(),
            idp_encrypts_saml_assertions: ko.observable(),
            name_id_format_specified: ko.observable(true),
            idp_public_key: ko.observable(),
        };

        /********************************************************************
         * Modal functionality
         *******************************************************************/
        this.show = function() {
            bison.helpers.modal(this.template, this, this.get_id());

            const data = this.data();
            for (const [k, v] of Object.entries(data)) {
                if (this.vm[k]) {
                    this.vm[k](v);
                }
            }
        };

        this._delete_sso_endpoint = DataThing.backends.commander({
            url: 'delete_sso_endpoint',
        });

        this.delete_sso_endpoint = function() {
            this._delete_sso_endpoint({
                data: {uid: this.vm.uid()},
                success: DataThing.api.XHRSuccess(() => {
                    Observer.broadcast(opts.save_event);
                    bison.helpers.close_modal(this.get_id());
                }),
                error: DataThing.api.XHRError(() => {}),
            });
        };

        _dfd.resolve();
    }
}
