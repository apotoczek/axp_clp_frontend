/* Automatically transformed from AMD to ES6. Beware of code smell. */
import BaseComponent from 'src/libs/components/basic/BaseComponent';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    let _dfd = self.new_deferred();

    self.restore_dynamic_data = function(data) {
        for (let [key, component] of Object.entries(self.components)) {
            if (
                ['ReportComponentWrapper', 'ReportMultiComponentWrapper'].includes(
                    component.__class__,
                )
            ) {
                if (data && data[key]) {
                    component.restore_dynamic_data(data[key]);
                } else {
                    component.widget.clear_data();
                }
            } else if (typeof component.restore_dynamic_data === 'function') {
                component.restore_dynamic_data(data);
            }
        }
    };

    self.restore_static_data = function(data) {
        for (let [key, component] of Object.entries(self.components)) {
            if (component.__class__ === 'ReportComponentWrapper') {
                if (data && data[key]) {
                    component.restore_static_data(data[key]);
                }
            } else if (typeof component.restore_static_data === 'function') {
                component.restore_static_data(data);
            }
        }
    };

    self.extract_dynamic_data = function() {
        let data = {};

        for (let [key, component] of Object.entries(self.components)) {
            if (
                ['ReportComponentWrapper', 'ReportMultiComponentWrapper'].includes(
                    component.__class__,
                )
            ) {
                data[key] = component.extract_dynamic_data();
            } else if (typeof component.extract_dynamic_data === 'function') {
                let wrapper_data = component.extract_dynamic_data();
                for (let [inner_key, value] of Object.entries(wrapper_data)) {
                    data[inner_key] = value;
                }
            }
        }
        return data;
    };

    self.extract_static_data = function() {
        let data = {};

        for (let [key, component] of Object.entries(self.components)) {
            if (component.__class__ === 'ReportComponentWrapper') {
                data[key] = component.extract_static_data();
            } else if (typeof component.extract_static_data === 'function') {
                let wrapper_data = component.extract_static_data();
                for (let [inner_key, value] of Object.entries(wrapper_data)) {
                    data[inner_key] = value;
                }
            }
        }
        return data;
    };

    _dfd.resolve();

    return self;
}
