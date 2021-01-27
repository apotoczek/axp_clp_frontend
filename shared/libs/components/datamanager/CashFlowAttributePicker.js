import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import MultiLevelSelector from 'src/libs/react/components/MultiLevelSelector';
import Observer from 'src/libs/Observer';

import 'src/libs/bindings/react';

class CashFlowAttributePicker extends BaseComponent {
    constructor(opts) {
        super(opts);
        this.MultiLevelSelector = MultiLevelSelector;

        this.selectedItem = ko.observable();
        this.members = opts.members;
        this.attribute_uid = opts.attribute_uid;
        this.select_event = opts.select_event || 'CashFlowAttributePicker.selected';

        this.props = ko.pureComputed(() => {
            return {
                selectedItem: this.selectedItem(),
                members: this.members,
                onSelect: member_uid => this.onSelect(member_uid),
            };
        });

        this.define_template(
            '<div data-bind="renderReactComponent: MultiLevelSelector, props: props"></div>',
        );
    }

    onSelect = member_uid => {
        const {attribute_uid} = this;
        const payload = {value: {attribute_uid, member_uid}, data: this.data()};
        // Send event to direct frontend to update data
        Observer.broadcast_for_id(this.get_id(), this.select_event, payload);
    };

    setDataValue(data) {
        this.data(data);
        if (data && data.attributes) {
            this.selectedItem(data.attributes[this.attribute_uid]);
        }
    }
}

export default CashFlowAttributePicker;
