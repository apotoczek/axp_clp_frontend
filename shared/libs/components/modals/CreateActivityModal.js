/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import bison from 'bison';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import DataThing from 'src/libs/DataThing';
import TextInput from 'src/libs/components/basic/TextInput';
import DateInput from 'src/libs/components/basic/DateInput';
import NewDropdown from 'src/libs/components/basic/NewDropdown';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    self.define_template(`
            <div class="modal fade" tabindex="-1" role="dialog" aria-hidden="true">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                            <h4 class="modal-title">Create Activity</h4>
                        </div>
                        <div class="modal-body">
                            <div class="row">
                                <div class="col-sm-12">
                                    <div class="form-group">
                                        <!-- ko renderComponent: title --><!-- /ko -->
                                    </div>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-sm-12">
                                    <div class="form-group">
                                        <!-- ko renderComponent: url --><!-- /ko -->
                                    </div>
                                </div>
                            </div>
                            <div class="row" data-bind="visible: include_body">
                                <div class="col-sm-12">
                                    <div class="form-group">
                                        <!-- ko renderComponent: body --><!-- /ko -->
                                    </div>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-sm-6">
                                    <div class="form-group">
                                        <!-- ko renderComponent: expiry --><!-- /ko -->
                                    </div>
                                </div>
                                <div class="col-sm-6">
                                    <div class="form-group">
                                        <!-- ko renderComponent: style --><!-- /ko -->
                                    </div>
                                </div>
                            </div>
                            <hr class="transparent hr-small" />
                            <button type="button" class="btn btn-primary" data-bind='click: create_activity, enable: can_create' data-dismiss="modal">Create</button>
                            <button type="button" class="btn btn-default" data-dismiss="modal">Cancel</button>
                        </div>
                    </div>
                </div>
            </div>
        `);

    /********************************************************************
     * Components
     ********************************************************************/
    self.title = new TextInput({
        allow_empty: false,
        placeholder: 'Title',
    });

    self.url = new TextInput({
        allow_empty: false,
        placeholder: 'Link',
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
            message: 'Invalid url! Must be absolute url without whitespace..',
        },
    });

    self.body = new TextInput({
        allow_empty: true,
        placeholder: 'Body',
        template: 'tpl_text_box_input',
    });

    self.style = new NewDropdown({
        id: 'style',
        allow_empty: false,
        label: 'Style',
        datasource: {
            type: 'static',
            data: [
                {value: 'title_only', label: 'Title Only'},
                {value: 'title_and_body', label: 'Title and Body'},
            ],
        },
        default_selected_index: 0,
    });

    self.expiry = new DateInput({
        id: 'expiry',
        placeholder: 'Expiry',
        use_local_time: true,
    });

    self.include_body = ko.pureComputed(() => {
        return self.style.selected_value() == 'title_and_body';
    });

    self.can_create = ko.pureComputed(() => {
        return self.title.can_submit() && self.body.can_submit() && self.url.can_submit();
    });

    /********************************************************************
     * Modal functionality
     *******************************************************************/
    self.show = function() {
        bison.helpers.modal(self.template, self, self.get_id());
    };

    self.reset = function() {
        self.title.clear();
        self.url.clear();
        self.body.clear();
        self.style.clear();
        self.expiry.clear();

        bison.helpers.close_modal(self.get_id());
    };

    self._create_custom_activity = DataThing.backends.commander({
        url: 'create_custom_activity',
    });

    self.create_activity = function() {
        let data = {
            title: self.title.value(),
            url: self.url.value(),
            body: self.body.value(),
            expiry: self.expiry.value(),
            style: self.style.selected_value(),
        };

        self.loading(true);

        self._create_custom_activity({
            data: data,
            success: DataThing.api.XHRSuccess(() => {
                DataThing.status_check();
            }),
            error: DataThing.api.XHRError(() => {
                self.loading(false);
            }),
        });
    };

    return self;
}
