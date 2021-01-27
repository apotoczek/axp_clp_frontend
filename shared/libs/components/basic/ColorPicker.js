/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import 'src/libs/bindings/color_picker';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);
    let _dfd = self.new_deferred();

    self.css = opts.css;
    self.color_name = opts.color_name;
    self.current_color_value = opts.color_value;
    self.change_callback = opts.change_callback;

    self.color = ko.observable();
    self.color.subscribe(color => {
        let hex = color.toHexString();
        self.change_callback({
            color_name: self.color_name,
            new_color_val: hex,
        });
    });

    self.define_default_template(`
        <input
            type="text"
            data-bind="color_picker: {
                color_callback:color,
                starting_color:opts.color_value
            }"
        />
    `);

    _dfd.resolve();

    return self;
}
