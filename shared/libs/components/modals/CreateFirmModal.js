/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import bison from 'bison';
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
                            <h4 class="modal-title">Create Firm</h4>
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
                                    <!-- ko renderComponent: location --><!-- /ko -->
                                    </div>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-sm-12">
                                    <div class="form-group">
                                    <!-- ko renderComponent: website --><!-- /ko -->
                                    </div>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-sm-12">
                                    <div class="form-group">
                                    <!-- ko renderComponent: overview --><!-- /ko -->
                                    </div>
                                </div>
                            </div>
                            <hr class="transparent hr-small" />
                            <button type="button" class="btn btn-primary" data-bind='click: create_firm, enable: can_create'>Create</button>
                            <button type="button" class="btn btn-default" data-dismiss="modal">Cancel</button>
                        </div>
                    </div>
                </div>
            </div>
        `);

    let _dfd = self.new_deferred();

    /********************************************************************
     * Components
     ********************************************************************/
    self.name = new TextInput({
        allow_empty: false,
        placeholder: 'Firm Name',
    });

    self.location = new TextInput({
        allow_empty: true,
        placeholder: 'Location',
    });

    self.website = new TextInput({
        allow_empty: true,
        placeholder: 'Website',
        custom_validator: {
            function: function(url) {
                let has_http = url.includes('http://') || url.includes('https://');
                let has_dot = url.includes('.');
                let trimmed = url.replace(/\s+/g, '');

                let without_http = trimmed.replace('http://', '').replace('https://', '');

                return (
                    has_http && has_dot && without_http.length > 1 && trimmed.length == url.length
                );
            },
            message: 'Invalid website! Must be absolute url without whitespace..',
        },
    });

    self.overview = new TextInput({
        allow_empty: true,
        placeholder: 'Overview',
        template: 'tpl_text_box_input',
    });

    self.can_create = ko.pureComputed(() => {
        return self.name.can_submit() && self.location.can_submit() && self.overview.can_submit();
    });

    /********************************************************************
     * Modal functionality
     *******************************************************************/
    self.show = function() {
        bison.helpers.modal(self.template, self, self.get_id());
    };

    self.reset = function() {
        self.name.clear();
        self.location.clear();
        self.website.clear();
        self.overview.clear();
        bison.helpers.close_modal(self.get_id());
    };

    self._create_firm = DataThing.backends.commander({
        url: 'create_firm',
    });

    self.create_firm = function() {
        let data = {
            name: self.name.value(),
            location: self.location.value(),
            website: self.website.value(),
            overview: self.overview.value(),
        };
        self._create_firm({
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

    _dfd.resolve();

    return self;
}
