import ko from 'knockout';
import bison from 'bison';
import BaseModal from 'src/libs/components/basic/BaseModal';

export default class ShowSSOEndpointClientConfigModal extends BaseModal {
    constructor(opts, components) {
        super(opts, components);

        let _dfd = this.new_deferred();

        this.define_template(`
            <div class="modal fade" tabindex="-1" role="dialog" aria-hidden="true">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                            <h4 class="modal-title">SSO Endpoint Client Config</h4>
                        </div>
                        <div class="modal-body">
                            <div class="row">
                                <div class="col-sm-12">
                                    <div>
                                        Login URL (aka Single Sign On URL):
                                        <strong>https://api.cobaltlp.com/sso/<span data-bind="text: vanity_link_or_uid"></span></strong>
                                    </div>

                                    <div>
                                        ACS URL (aka Consumer URL):
                                        <strong>https://api.cobaltlp.com/sso/saml-return/<span data-bind="text: vanity_link_or_uid"></span></strong>
                                    </div>

                                    <div>
                                        OAuth Return URL:
                                        <strong>https://api.cobaltlp.com/sso/oauth-return/<span data-bind="text: vanity_link_or_uid"></span></strong>
                                    </div>

                                    <div>
                                        Recipient:
                                        <strong>https://api.cobaltlp.com/sso</strong>
                                    </div>

                                    <div>
                                        Audience (aka SP Entity ID):
                                        <strong><span data-bind="text: audience"></span></strong>
                                    </div>
                                </div>
                            </div>

                            <div class="row">
                                <div class="col-sm-12">
                                    <h5>Advanced, Optional, Less Common Settings</h5>

                                    <div>
                                        Logout URL (SAML):
                                        <strong>https://api.cobaltlp.com/sso/saml-logout/<span data-bind="text: vanity_link_or_uid"></span></strong>
                                    </div>

                                    <div>
                                        Logout URL (OAuth):
                                        <strong>https://api.cobaltlp.com/sso/oauth-logout/<span data-bind="text: vanity_link_or_uid"></span></strong>
                                    </div>

                                    <div>
                                        Validator Pattern:
                                        <strong>^https:\\/\\/api.cobaltlp.com/*</strong>
                                    </div>

                                    <div>
                                        Encryption:
                                        <strong>RSA-SHA512</strong> (or <strong>RSA-SHA256</strong> if 512 is not supported by their IdP)
                                    </div>

                                    <div>
                                        SAML Signature Element:
                                        <strong>Response</strong>
                                    </div>

                                    <div>
                                        Issuer Type:
                                        <strong>Specific</strong>
                                    </div>

                                    <div>
                                        Allow this App to Request other URLs:
                                        <strong>Yes</strong>
                                    </div>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-sm-12">
                                    <br/>
                                    <button type="button" class="btn btn-default" data-dismiss="modal">Ok</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `);

        this.vm = {
            uid: ko.observable(),
            client_uid: ko.observable(),
            custom_sp_entity_id: ko.observable(),
            vanity_link: ko.observable(),
        };

        this.vanity_link_or_uid = ko.computed(() => {
            return this.vm.vanity_link() || this.vm.uid() || '<save to generate ID>';
        });

        this.audience = ko.computed(() => {
            if (this.vm.custom_sp_entity_id()) {
                return this.vm.custom_sp_entity_id();
            }
            return `https://api.cobaltlp.com/sso/saml-metadata/${this.vanity_link_or_uid()}`;
        });

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

        _dfd.resolve();
    }
}
