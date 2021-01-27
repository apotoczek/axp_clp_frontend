/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import bison from 'bison';
import config from 'config';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import DataThing from 'src/libs/DataThing';
import TextInput from 'src/libs/components/basic/TextInput';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    self.define_default_template(`
            <div class="modal fade" tabindex="-1" role="dialog" aria-hidden="true">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                            <h4 class="modal-title">Create Investor</h4>
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
                                    <!-- ko renderComponent: city --><!-- /ko -->
                                    </div>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-sm-12">
                                    <div class="form-group">
                                    <!-- ko renderComponent: country --><!-- /ko -->
                                    </div>
                                </div>
                            </div>
                            <hr class="transparent hr-small" />
                            <button type="button" class="btn btn-primary" data-bind='click: create_investor, enable: can_create' data-dismiss="modal">Create</button>
                            <button type="button" class="btn btn-default" data-dismiss="modal">Cancel</button>
                        </div>
                    </div>
                </div>
            </div>
        `);

    let _dfd = self.new_deferred();

    self.name = new TextInput({
        allow_empty: false,
        placeholder: 'Investor name',
    });

    self.city = new TextInput({
        allow_empty: true,
        placeholder: 'City',
    });

    self.country = new TextInput({
        allow_empty: true,
        placeholder: 'Country',
    });

    self.can_create = ko.pureComputed(() => {
        return self.name.can_submit() && self.city.can_submit() && self.country.can_submit();
    });

    self.show = function() {
        bison.helpers.modal(self.template, self, self.get_id());
    };

    self.reset = function() {
        self.name.clear();
        self.city.clear();
        self.country.clear();
        bison.helpers.close_modal(self.get_id());
    };

    self._create_investor = DataThing.backends.commander({
        url: 'create_investor',
    });

    self.create_investor = function() {
        let data = {
            name: self.name.value(),
            city: self.city.value(),
            country: self.country.value(),
        };
        self._create_investor({
            data: data,
            success: DataThing.api.XHRSuccess(data => {
                let investor_uid = data.uid;
                self.reset();
                redirect(config.commander.investors_url + investor_uid);
            }),
            error: DataThing.api.XHRError(() => {
                self.loading(false);
            }),
        });
    };

    _dfd.resolve();

    return self;
}
