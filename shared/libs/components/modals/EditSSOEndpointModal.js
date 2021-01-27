import ko from 'knockout';
import bison from 'bison';
import BaseModal from 'src/libs/components/basic/BaseModal';
import DataThing from 'src/libs/DataThing';
import Observer from 'src/libs/Observer';

export default class EditSSOEndpointModal extends BaseModal {
    constructor(opts, components) {
        super(opts, components);

        let _dfd = this.new_deferred();

        this.define_template(`
            <div class="modal fade" tabindex="-1" role="dialog" aria-hidden="true">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                            <H3 class="modal-title">Edit SSO Endpoint Config</H3>
                        </div>
                        <div class="modal-body">                            
                            <div class="row">
                                <div class="col-sm-6">
                                    <label>Vanity Link</label>
                                    <input type="text" data-bind="value: vm.vanity_link" placeholder="clientname" />
                                </div>
                                <div class="col-sm-6">
                                    <label>User Domain</label>
                                    <input type="text" data-bind="value: vm.user_domain" placeholder="client-email.com" />
                                </div>
                            </div>

                            <div class="row">
                                <div class="col-sm-12">
                                    <br/>
                                </div>
                            </div>

                            <div class="row">
                                <div class="col-sm-6">
                                    <label>
                                        <input type="checkbox" data-bind="checked: vm.supports_saml" />
                                        Supports SAML
                                    </label>
                                </div>
                                <div class="col-sm-6">
                                    <label>
                                        <input type="checkbox" data-bind="checked: vm.supports_oauth2" />
                                        Supports OAuth2
                                    </label>
                                </div>
                            </div>
                            
                            <div class="row">
                                <div class="col-sm-12">
                                    <label>
                                        <input type="checkbox" data-bind="checked: vm.create_missing_users" />
                                        Auto-Create Missing Users
                                    </label>
                                </div>
                            </div>

                            <div class="row">
                                <div class="col-sm-12">
                                    <br/>
                                </div>
                            </div>

                            <div class="row">
                                <div class="col-sm-3">
                                    <span>Auto-Redirect: </span>
                                </div>
                                <div class="col-sm-3">
                                    <label>
                                        <input type="checkbox" data-bind="checked: vm.auto_redirect_vanity_link" />
                                        Vanity Link
                                    </label>
                                </div>
                                <div class="col-sm-3">
                                    <label>
                                        <input type="checkbox" data-bind="checked: vm.auto_redirect_user_domain" />
                                        User Domain (coming soon)
                                    </label>
                                </div>
                                <div class="col-sm-3">
                                    <label>
                                        <input type="checkbox" data-bind="checked: vm.auto_redirect_ip" />
                                        IP (coming soon)
                                    </label>
                                </div>
                            </div>
                            
                            <div class="row">
                                <div class="col-sm-12">
                                    <H4>OAuth</H4>
                                </div>
                            </div>
                            
                            <div class="row">
                                <div class="col-sm-12">
                                    <label>OAuth Issuer URL</label>
                                    <input type="text" data-bind="value: vm.oauth_issuer, event: { change: change_oauth_issuer }" style="width: 100%" placeholder="https://client-name.onelogin.com/oidc/2" />
                                    <br/><br/>
                                </div>
                            </div>
                            
                            <div class="row">
                                <div class="col-sm-4">
                                    <label>OAuth Auth (URL or Issuer Suffix)</label>
                                    <input type="text" data-bind="value: vm.oauth_issuer_auth_suffix" style="width: 100%" placeholder="/auth" />
                                </div>
                                <div class="col-sm-4">
                                    <label>OAuth Token (URL or Issuer Suffix)</label>
                                    <input type="text" data-bind="value: vm.oauth_issuer_token_suffix" style="width: 100%" placeholder="/token" />
                                </div>
                                <div class="col-sm-4">
                                    <label>OAuth User Info (URL or Issuer Suffix)</label>
                                    <input type="text" data-bind="value: vm.oauth_issuer_userinfo_suffix" style="width: 100%" placeholder="/me" />
                                </div>
                            </div>
                            
                            <div class="row">
                                <div class="col-sm-12">
                                    <br/>
                                </div>
                            </div>
                                              
                            <div class="row">
                                <div class="col-sm-4">
                                    <label>OAuth Scope</label>
                                    <input type="text" data-bind="value: vm.oauth_scope" style="width: 100%" placeholder="openid,name,email,profile" />
                                    <br/><br/>
                                </div>
                                <div class="col-sm-4">
                                    <label>OAuth Client ID</label>
                                    <input type="text" data-bind="value: vm.oauth_client_id" style="width: 100%" placeholder="0oaf0807fNyInSQrP4x6" />
                                </div>
                                <div class="col-sm-4">
                                    <label>OAuth Client Secret</label>
                                    <input type="text" data-bind="value: vm.oauth_client_secret" style="width: 100%" placeholder="8FgXHytaqVvAmZKGeZTGCqxJLNx5dC0g-RZAoqgL" />
                                </div>
                            </div>
                            
                            <div class="row">
                                <div class="col-sm-12">
                                    <H4>SAML</H4>
                                </div>
                            </div>
                            
                            <div class="row">
                                <div class="col-sm-12">
                                    <label>SAML IdP URL (aka Login URL or Endpoint URL)</label>
                                    <input type="text" data-bind="value: vm.idp_url" style="width: 100%" placeholder="https://client-name.onelogin.com/trust/saml2/http-post/sso/abc-123" />
                                    <br/><br/>
                                </div>
                            </div>
                            
                            <div class="row">
                                <div class="col-sm-12">
                                    <label>SAML IdP Entity ID (aka Issuer ID)</label>
                                    <input type="text" data-bind="value: vm.idp_entity_id" style="width: 100%" placeholder="https://app.onelogin.com/saml/metadata/abc-123" />
                                    <br/><br/>
                                </div>
                            </div>      
                            
                            <div class="row">
                                <div class="col-sm-12">
                                    <label>SP Entity ID (if provided)</label>
                                    <input type="text" data-bind="value: vm.custom_sp_entity_id" style="width: 100%" placeholder="spn:abc-123" />
                                    <br/><br/>
                                </div>
                            </div>
                            
                            <div class="row">
                                <div class="col-sm-3">
                                    <span>Advanced: </span>
                                </div>
                                <div class="col-sm-3">
                                    <label>
                                        <input type="checkbox" data-bind="checked: vm.idp_encrypts_saml_assertions" />
                                        IdP Encrypts SAML assertions
                                    </label>
                                </div>
                                <div class="col-sm-6">
                                    <label>
                                        <input type="checkbox" data-bind="checked: vm.name_id_format_specified" />
                                        NameID format specified
                                    </label>
                                </div>
                            </div>

                            <div class="row">
                                <div class="col-sm-12">
                                    <label>SAML IdP Public Key</label>
                                    <div style="font-style: italic;">
                                        The Public Key of the the keypair that the Identity Provider sends us <br/>
                                        We use this key to verify the digital signature of the SAML response they send us.
                                    </div>
                                    <textarea data-bind="value: vm.idp_public_key" style="width: 100%; font-family: 'Deja Vu Sans Mono', monospace" />
                                </div>
                            </div>
                            
                            <div class="row">
                                <div class="col-sm-12">
                                    <hr />
                                    <ul style="padding: 0em 0em 1em 1em;">
                                        <!-- ko foreach: validation_errors -->
                                            <li data-bind="text: $data" class="text-danger"></li>
                                        <!-- /ko -->
                                    </ul>
                                    <button type="button" class="btn btn-primary" data-bind='click: save_sso_endpoint, enable: enable_save'>Save</button>
                                    <button type="button" class="btn btn-default" data-dismiss="modal">Cancel</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `);

        this.client_uid = opts.client_uid;
        this.save_event = opts.save_event;

        this.vm = {
            uid: ko.observable(),
            client_uid: ko.observable(),
            idp_url: ko.observable(),
            idp_entity_id: ko.observable(),
            custom_sp_entity_id: ko.observable(),
            oauth_issuer: ko.observable(),
            oauth_issuer_auth_suffix: ko.observable(),
            oauth_issuer_token_suffix: ko.observable(),
            oauth_issuer_userinfo_suffix: ko.observable(),
            oauth_client_id: ko.observable(),
            oauth_client_secret: ko.observable(),
            oauth_scope: ko.observable(),
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

        this._save_sso_endpoint = DataThing.backends.commander({
            url: opts.create_new ? 'create_sso_endpoint' : 'update_sso_endpoint',
        });

        this.validation_errors = ko.computed(() => this.build_validation_errors(this.vm));
        this.enable_save = ko.computed(() => this.build_validation_errors(this.vm).length === 0);

        this.show = function() {
            bison.helpers.modal(this.template, this, this.get_id());
            const data = opts.create_new ? {client_uid: this.client_uid()} : this.data();

            for (const [k, v] of Object.entries(data)) {
                if (this.vm[k]) {
                    this.vm[k](v);
                }
            }
        };

        _dfd.resolve();
    }

    save_sso_endpoint() {
        if (this.build_validation_errors(this.vm).length) {
            return;
        }

        const data = {};
        for (const [k, v] of Object.entries(this.vm)) {
            if ({}.hasOwnProperty.call(this.vm, k)) {
                data[k] = v();
            }
        }

        this._save_sso_endpoint({
            data: data,
            success: DataThing.api.XHRSuccess(() => {
                Observer.broadcast(this.save_event);
                bison.helpers.close_modal(this.get_id());
            }),
            error: DataThing.api.XHRError(() => {}),
        });
    }

    change_oauth_issuer() {
        const issuer = this.vm.oauth_issuer();
        if (!issuer) {
            return;
        }

        const azureify_oauth_url = function(suffix) {
            if (issuer.indexOf('v2.0') !== -1) {
                return issuer.replace('v2.0', `oauth2/v2.0/${suffix}`);
            }
            return null;
        };

        const presets = {
            'onelogin.com': {
                oauth_issuer_auth_suffix: '/auth',
                oauth_issuer_token_suffix: '/token',
                oauth_issuer_userinfo_suffix: '/me',
                oauth_scope: 'openid,name,email,profile',
            },
            'okta.com': {
                oauth_issuer_auth_suffix: '/oauth2/v1/authorize',
                oauth_issuer_token_suffix: '/oauth2/v1/token',
                oauth_issuer_userinfo_suffix: '/oauth2/v1/userinfo',
                oauth_scope: 'openid,email,profile',
            },
            'login.microsoftonline.com': {
                oauth_issuer_auth_suffix: azureify_oauth_url('authorize'),
                oauth_issuer_token_suffix: azureify_oauth_url('token'),
                oauth_issuer_userinfo_suffix: 'https://graph.microsoft.com/oidc/userinfo',
                oauth_scope: 'openid,email,profile',
            },
            'accounts.google.com': {
                oauth_issuer_auth_suffix: 'https://accounts.google.com/o/oauth2/auth',
                oauth_issuer_token_suffix: 'https://www.googleapis.com/oauth2/v4/token',
                oauth_issuer_userinfo_suffix: 'NA',
                oauth_scope: 'openid,email,profile',
            },
        };

        for (const [provider, settings] of Object.entries(presets)) {
            if (issuer.indexOf(provider) !== -1) {
                for (const [field, value] of Object.entries(settings)) {
                    if (!this.vm[field]()) {
                        this.vm[field](value);
                    }
                }
                break;
            }
        }
    }

    build_validation_errors(vm) {
        const messages = [];

        if (!vm.supports_saml() && !vm.supports_oauth2()) {
            messages.push('Must support either SAML or OAuth');
        }

        const required_fields = {};

        if (vm.supports_saml()) {
            required_fields['SAML IdP URL'] = vm.idp_url();
            required_fields['SAML IdP Entity ID'] = vm.idp_entity_id();
            required_fields['SAML IdP Public Key'] = vm.idp_public_key();
        }
        if (vm.supports_oauth2()) {
            required_fields['OAuth Issuer'] = vm.oauth_issuer();
            required_fields['OAuth Issuer - Auth Suffix'] = vm.oauth_issuer_auth_suffix();
            required_fields['OAuth Issuer - Token Suffix'] = vm.oauth_issuer_token_suffix();
            required_fields['OAuth Issuer - User Info Suffix'] = vm.oauth_issuer_userinfo_suffix();
            required_fields['OAuth Client ID'] = vm.oauth_client_id();
            required_fields['OAuth Client Secret'] = vm.oauth_client_secret();
        }

        for (const [k, v] of Object.entries(required_fields)) {
            if (!v) {
                messages.push(`${k} is required`);
            }
        }

        return messages;
    }
}
