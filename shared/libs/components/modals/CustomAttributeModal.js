import ko from 'knockout';
import BaseModal from 'src/libs/components/basic/BaseModal';
import DataThing from 'src/libs/DataThing';
import AttributeForm from 'src/libs/react/components/basic/forms/attributes/AttributeForm';
import {flattenMembers} from 'bison/utils/attributes';
import bison from 'bison';

class CustomAttributeModal extends BaseModal {
    constructor(opts, components) {
        super(opts, components);
        const _dfd = this.new_deferred();

        this._members = ko.observable([]);
        this._attribute = ko.observable({});
        this.AttributeForm = AttributeForm;
        this.props = ko.pureComputed(() => {
            return {
                members: this._members(),
                attribute: this._attribute(),
                levelLimit: 3, // Only allow 3 tiers of members
                onUpdateMember: this.edit_mode()
                    ? this.on_update_member
                    : this.capture_update_member,
                onUpdateAttribute: this.edit_mode()
                    ? this.on_update_attribute
                    : this.capture_update_attribute,
                onDeleteMember: this.edit_mode()
                    ? this.on_delete_member
                    : this.capture_delete_member,
                onAddMember: this.edit_mode() ? this.on_add_member : this.capture_add_member,
            };
        });

        this.attribute_uid = ko.observable();
        this.created_attribute = ko.observable({
            name: '',
            scope: null,
        });
        this.created_members = ko.observableArray([]);

        this.dirty = ko.observable(false);

        this.define_template(`
            <div class="modal fade" tabindex="-1" role="dialog" aria-hidden="true">
                <div class="modal-dialog modal-md">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h4 data-bind="if: edit_mode">Edit Attribute</h4>
                            <h4 data-bind="ifnot: edit_mode">Create Attribute</h4>
                        </div>
                        <div class="modal-body custom-attribute-modal">
                            <div data-bind="renderReactComponent: AttributeForm, props: props">
                            </div>
                        </div>
                        <div class="modal-footer">
                        <!-- ko ifnot: edit_mode -->
                            <button class="btn btn-success" data-bind="click: create_attribute">Save</button>
                            <button class="btn btn-ghost-default" data-bind="click: reset">Cancel</button>
                        <!-- /ko -->
                        <!-- ko if: edit_mode -->
                            <button class="btn btn-success" data-bind="click: done">Done</button>
                        <!-- /ko -->
                        </div>
                    </div>
                </div>
            </div>
        `);

        this.title = opts.title;

        this.name = ko.observable('');
        this.list = ko.observableArray([]);

        this.edit_mode = ko.pureComputed(() => {
            const attribute = this._attribute() || {};
            return attribute.uid !== undefined;
        });

        this._save_updates = DataThing.backends.attribute({
            url: 'update-custom-attribute',
        });

        this._create_attribute = DataThing.backends.attribute({
            url: 'create-custom-attribute',
        });

        this._update_attribute_member = DataThing.backends.attribute({
            url: 'update-custom-attribute-member',
        });

        this._add_attribute_member = DataThing.backends.attribute({
            url: 'add-custom-attribute-member',
        });

        this._delete_attribute_member = DataThing.backends.attribute({
            url: 'delete-custom-attribute-member',
        });

        this.create_attribute = () => {
            const data = this.created_attribute();
            data.members = this.created_members();
            this.created_attribute.valueHasMutated();
            this._create_attribute({
                data,
                success: DataThing.api.XHRSuccess(() => {
                    DataThing.status_check();
                    this.reset();
                }),
            });
        };

        this.on_add_member = member => {
            // do some stuff here
            this._add_attribute_member({
                data: {
                    attribute_uid: this.attribute_uid(),
                    ...member,
                },
                success: DataThing.api.XHRSuccess(() => this.dirty(true)),
            });
        };

        this.on_delete_member = (member_uid, _descendant_uids) => {
            // do some stuff here
            this._delete_attribute_member({
                data: {
                    attribute_uid: this.attribute_uid(),
                    member_uid: member_uid,
                },
                success: DataThing.api.XHRSuccess(() => this.dirty(true)),
            });
        };

        this.on_update_member = (member_uid, field_name, value) => {
            // do some stuff here
            this._update_attribute_member({
                data: {
                    attribute_uid: this.attribute_uid(),
                    member_uid: member_uid,
                    [field_name]: value,
                },
                success: DataThing.api.XHRSuccess(() => this.dirty(true)),
            });
        };

        this.on_update_attribute = (field_name, value) => {
            this._save_updates({
                data: {
                    attribute_uid: this.attribute_uid(),
                    [field_name]: value,
                },
                success: DataThing.api.XHRSuccess(() => this.dirty(true)),
            });
        };

        this.reset = () => {
            bison.helpers.close_modal(this.get_id());
            if (this.dirty()) {
                DataThing.status_check();
            }
            this.created_attribute({scope: null, name: ''});
            this.created_members([]);
            this.loading(false);
        };

        this.done = () => {
            this.reset();
        };

        this.when().done(() => {
            _dfd.resolve();
        });
    }

    capture_update_member = (member_uid, field_name, value) => {
        const members = this.created_members();
        const index = members.findIndex(m => (m.uid = member_uid));
        members[index][field_name] = value;
        this.created_members.valueHasMutated();
    };

    capture_add_member = member => {
        const members = this.created_members();
        members.push(member);
    };

    capture_delete_member = (_member_uid, affected_uids) => {
        const members = this.created_members();
        affected_uids.map(m => members.remove(o => o.uid == m.uid));
        this.created_members.valueHasMutated();
    };

    capture_update_attribute = (field_name, value) => {
        const attr = this.created_attribute();
        this.created_attribute({...attr, [field_name]: value});
    };

    show_and_populate = data => {
        const attribute = {
            name: data.name,
            uid: data.uid,
            scope: data.scope,
        };

        this.attribute_uid(data.uid);

        const flat_members = flattenMembers(data.members);
        this._members(flat_members);
        this._attribute(attribute);
        this.show();
    };
}

export default CustomAttributeModal;
