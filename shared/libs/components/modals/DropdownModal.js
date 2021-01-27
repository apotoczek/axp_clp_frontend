/* Automatically transformed from AMD to ES6. Beware of code smell. */
/**
 * Description:
 *   A simple modal prompts the user to select an option from a dropdown
 * Keys:
 *   - dropdown_datasource
 *      Datasource used for the dropdown
 *   - title
 *      Modal header title
 *   - description
 *      Text that's displayed just above the dropdown within the modal
 *   - confirm_btn_label
 *      Label for the confirm btn, can be html
 *   - broadcast_confirm
 *      Broadcasts a DropdownModal.confirm event if true
 *   - value_key
 *      value_key for listing items in dropdown
 *   - label_key
 *      label_key for listing items in dropdown
 *   - sublabel_key
 *      sublabel_key for sublabels within the dropdown
 *   - confirm_callback
 *      Function for handling confirmation. Gets passed the selected item
 */
import bison from 'bison';
import BaseModal from 'src/libs/components/basic/BaseModal';
import FilteredDropdown from 'src/libs/components/basic/FilteredDropdown';
import NewDropdown from 'src/libs/components/basic/NewDropdown';
import Observer from 'src/libs/Observer';
import * as Utils from 'src/libs/Utils';

export default function(opts, components) {
    let self = new BaseModal(opts, components);

    self.define_template(`
            <div class="modal fade" tabindex="-1" role="dialog" aria-hidden="true">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                            <h4 class="modal-title" data-bind="text: title"></h4>
                        </div>
                        <div class="modal-body">
                            <span class="spaced-row" data-bind="html: description"></span>
                            <div class="spaced-row" style="margin-top: 10px">
                                <!-- ko renderComponent: dropdown --><!-- /ko -->
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-success pull-right" data-dismiss="modal" data-bind="click: confirm, html: confirm_btn_label"></button>
                        </div>
                    </div>
                </div>
            </div>
        `);

    let _dfd = self.new_deferred();

    self.title = opts.title || 'MISSING TITLE';
    self.description = opts.description || 'MISSING TITLE';

    self.dropdown_datasource = opts.dropdown_datasource;

    self.confirm_btn_label = opts.confirm_btn_label || 'Confirm';

    self.broadcast_confirm = opts.broadcast_confirm || false;
    self.confirm_callback = opts.confirm_callback || (data => data);

    self.value_key = opts.value_key || 'value';
    self.label_key = opts.label_key || 'label';
    self.sublabel_key = opts.sublabel_key || false;

    let enable_filter = Utils.default_value(opts.enable_filter, true);

    let component = enable_filter ? FilteredDropdown : NewDropdown;

    self.dropdown = self.new_instance(component, {
        id: 'dropdown',
        datasource: self.dropdown_datasource,
        value_key: self.value_key,
        label_key: self.label_key,
        sublabel_key: self.sublabel_key,
        sublabel_parenthesis: true,
        default_selected_index: 0,
    });

    self.show = () => {
        bison.helpers.modal(self.template, self, self.get_id());
    };

    self.confirm = () => {
        if (self.broadcast_confirm) {
            Observer.broadcast_for_id(
                self.get_id(),
                'DropdownModal.confirm',
                self.dropdown.selected_value(),
            );
        }

        self.confirm_callback(self.dropdown.selected_value(), self.data());
    };

    _dfd.resolve();

    return self;
}
