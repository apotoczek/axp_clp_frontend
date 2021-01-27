/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import bison from 'bison';
import config from 'config';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import DataThing from 'src/libs/DataThing';
import TextInput from 'src/libs/components/basic/TextInput';
import NewDropdown from 'src/libs/components/basic/NewDropdown';
import TypeaheadInput from 'src/libs/components/TypeaheadInput';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    self.define_default_template(`
            <div class="modal fade" tabindex="-1" role="dialog" aria-hidden="true">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                            <h4 class="modal-title">Create Family</h4>
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
                                    <!-- ko renderComponent: ordinal_style --><!-- /ko -->
                                    </div>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-sm-6">
                                    <div class="form-group">
                                    <!-- ko renderComponent: template_info --><!-- /ko -->
                                    </div>
                                </div>
                                <div class="col-sm-6">
                                    <div class="form-group">
                                    <!-- ko renderComponent: firm --><!-- /ko -->
                                    </div>
                                </div>
                            </div>
                            <hr class="transparent hr-small" />
                            <button type="button" class="btn btn-primary" data-bind='click: create_family, enable: can_create'>Create</button>
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
        placeholder: 'Family Name',
    });

    self.template_info = new TextInput({
        allow_empty: false,
        placeholder: 'E.g: Name Subname <ord>, Name <ord> Subname',
    });

    self.ordinal_style = new NewDropdown({
        id: 'ordinal_style',
        label: 'Ordinal style',
        datasource: {
            type: 'static',
            data: [
                {
                    label: 'Integer year',
                    value: 'int_year',
                },
                {
                    label: 'Roman',
                    value: 'roman',
                },
                {
                    label: 'Integer',
                    value: 'int',
                },
                {
                    label: 'Numeric word',
                    value: 'num_words',
                },
                {
                    label: 'Alpha',
                    value: 'alpha',
                },
                {
                    label: 'Inherit',
                    value: 'inherit',
                },
            ],
        },
    });

    self.firm = new TypeaheadInput({
        placeholder: 'Firm',
        allow_empty: false,
        endpoint: {
            target: 'commander:firms',
            query_key: 'string_filter',
            display_key: 'name',
            return_key: 'uid',
            order_by: [
                {
                    name: 'name_startswith',
                },
                {
                    name: 'name',
                    sort: 'asc',
                },
            ],
        },
    });

    /********************************************************************
     * Modal functionality
     *******************************************************************/

    self.can_create = ko.pureComputed(() => {
        return self.name.can_submit() && self.template_info.can_submit() && self.firm.can_submit();
    });

    self.show = function() {
        bison.helpers.modal(self.template, self, self.get_id());
    };

    self.reset = function() {
        self.name.clear();
        self.template_info.clear();
        self.ordinal_style.clear();
        self.firm.clear();
        bison.helpers.close_modal(self.get_id());
    };

    self._create_family = DataThing.backends.commander({
        url: 'create_family',
    });

    self.create_family = function() {
        let data = {
            name: self.name.value(),
            fund_template: self.template_info.value(),
            ordinal_style: self.ordinal_style.value(),
            firm_uid: self.firm.value(),
        };
        self._create_family({
            data: data,
            success: DataThing.api.XHRSuccess(data => {
                let family_uid = data.uid;
                self.reset();
                redirect(config.commander.families_url + family_uid);
            }),
            error: DataThing.api.XHRError(() => {
                self.loading(false);
            }),
        });
    };

    _dfd.resolve();

    return self;
}
