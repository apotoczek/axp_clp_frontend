import ko from 'knockout';
import BaseModal from 'src/libs/components/basic/BaseModal';
import DataThing from 'src/libs/DataThing';

import 'src/libs/bindings/react';
import TextDataSpecForm from 'components/datamanager/TextDataSpecForm';
import DataSource from 'src/libs/DataSource';
import {is_set} from 'src/libs/Utils';
import bison from 'bison';
import {TextDataSpecType} from 'src/libs/Enums';

export default class CreateTextDataSpecModal extends BaseModal {
    constructor(opts, components) {
        super(opts, components);

        const _dfd = this.new_deferred();

        this.define_template(`
            <div class="modal fade" tabindex="-1" role="dialog" aria-hidden="true">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h4>Create Text Field</h4>
                        </div>
                        <div class="modal-body" data-bind="renderReactComponent: TextDataSpecForm, props: props">
                        </div>
                        <div class="modal-footer">
                            <button class="btn btn-success" data-bind="click:save">Save</button>
                            <button class="btn btn-ghost-default" data-bind="click:cancel">Cancel</button>
                        </div>
                    </div>
                </div>
            </div>
        `);

        this.endpoints = {
            create_text_data_spec: DataThing.backends.text_data({
                url: 'create_spec',
            }),
        };

        this.groups = this.new_instance(DataSource, {
            datasource: {
                type: 'dynamic',
                key: 'specs',
                query: {
                    target: 'text_data_specs',
                },
                mapping: specs => {
                    const groups = {};

                    for (const {group, attribute_uid, label} of specs) {
                        if (!groups[group.uid]) {
                            groups[group.uid] = {
                                value: group.uid,
                                label: group.label,
                                specs: new Set(),
                            };
                        }

                        groups[group.uid].specs.add(attribute_uid || label);
                    }

                    return Object.values(groups);
                },
            },
        });

        this.attributes = this.new_instance(DataSource, {
            datasource: {
                type: 'dynamic',
                query: {
                    target: 'attributes',
                    results_per_page: 'all',
                },
                key: 'results',
                mapping: attributes => attributes.map(({uid, name}) => ({label: name, value: uid})),
            },
        });

        this.TextDataSpecForm = TextDataSpecForm;
        this.default_state = {
            errors: {},
            values: {
                specType: TextDataSpecType.FreeText,
                label: '',
                groupName: '',
                attributeUid: null,
            },
        };

        this.state = ko.observable(this.default_state);

        this.props = ko.pureComputed(() => {
            const {values, errors} = this.state();

            return {
                onValueChanged: (key, value) => {
                    const {values} = this.state();
                    const new_values = {...values, [key]: value};

                    this.state({...this.state(), values: new_values});
                },
                values,
                errors,
                options: {
                    attributes: this.attributes.data(),
                    groups: this.groups.data(),
                    specTypes: [
                        {value: TextDataSpecType.FreeText, label: 'Free Text'},
                        {value: TextDataSpecType.Attribute, label: 'Attribute Dropdown'},
                    ],
                },
            };
        });

        _dfd.resolve();
    }

    validate(values) {
        const errors = {};

        if (!is_set(values.groupName, true)) {
            errors.groupName = 'Group name is required';
        }

        const group = this.groups.data().find(g => g.label === values.groupName);
        const existingSpecs = (group && group.specs) || new Set();

        if (values.specType === TextDataSpecType.FreeText) {
            if (!is_set(values.label, true)) {
                errors.label = 'Label is required';
            } else if (existingSpecs.has(values.label)) {
                errors.label = 'Label already exists in this group';
            }
        } else if (values.specType === TextDataSpecType.Attribute) {
            if (!is_set(values.attributeUid, true)) {
                errors.attributeUid = 'You have to pick an attribute';
            } else if (existingSpecs.has(values.attributeUid)) {
                errors.attributeUid = 'Attribute already exists in this group';
            }
        } else {
            errors.specType = 'Field type is required';
        }

        return errors;
    }

    save() {
        const {values} = this.state();

        const errors = this.validate(values);

        if (is_set(errors, true)) {
            this.state({...this.state(), errors});
            return;
        }

        const data = {
            group_label: values.groupName,
            spec_type: values.specType,
        };

        if (values.specType === TextDataSpecType.FreeText) {
            data.label = values.label;
        } else if (values.specType === TextDataSpecType.Attribute) {
            data.attribute_uid = values.attributeUid;
        }

        this.endpoints.create_text_data_spec({
            data,
            success: DataThing.api.XHRSuccess(() => {
                this.reset();
                DataThing.status_check();
            }),
            error: DataThing.api.XHRError(() => {}),
        });
    }

    reset = () => {
        bison.helpers.close_modal(this.get_id());
        this.state(this.default_state);
    };

    cancel() {
        this.reset();
    }
}
