import ko from 'knockout';
import bison from 'bison';
import BaseModal from 'src/libs/components/basic/BaseModal';
import DataThing from 'src/libs/DataThing';

export default class PublicKeyModal extends BaseModal {
    constructor(opts, components) {
        super(opts, components);

        let _dfd = this.new_deferred();

        this.define_template(`
            <div class="modal fade" tabindex="-1" role="dialog" aria-hidden="true">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                            <h4 class="modal-title">IdP Public Key</h4>
                        </div>
                        <div class="modal-body">
                            <div class="row">
                                <div class="col-sm-12">
                                    The Public Key of the Identity Provider's keypair (client needs to give this to us)<br/>
                                    We use this key to verify the digital signature of the SAML response they send us. <br/>
                                    <br/>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-sm-12">
                                    <pre data-bind="text: vm.idp_public_key"></pre>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-sm-12">
                                    <hr/>
                                    The Public Key of the Service Provider's (us) keypair <br/>
                                    We send this to the client (optional, if asked) <br/>
                                    They would use this to encrypt messages to us, which we'd decrypt with our private key (which we never share) <br/>
                                    <br/>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-sm-12">
                                    <pre data-bind="text: vm.our_public_key"></pre>
                                </div>
                            </div>
                            <hr class="transparent hr-small" />
                            <button type="button" class="btn btn-default" data-dismiss="modal">Ok</button>
                        </div>
                    </div>
                </div>
            </div>
        `);

        /********************************************************************
         * Modal functionality
         *******************************************************************/
        this.show = function() {
            bison.helpers.modal(this.template, this, this.get_id());

            this._get_our_public_key({
                data: {},
                success: DataThing.api.XHRSuccess(result => {
                    this.vm.our_public_key(result.result);
                }),
                error: DataThing.api.XHRError(() => {}),
            });
        };

        this.vm = {
            idp_public_key: ko.pureComputed(() => {
                return this.data().idp_public_key;
            }),
            our_public_key: ko.observable(),
        };

        this._get_our_public_key = DataThing.backends.commander({
            url: 'get_public_key',
        });

        _dfd.resolve();
    }
}
