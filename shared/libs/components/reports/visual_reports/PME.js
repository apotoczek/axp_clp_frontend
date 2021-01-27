/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import PMEBox from 'src/libs/components/PMEBox';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    let _dfd = self.new_deferred();

    self.extract_dynamic_data = function() {
        return {
            selected: self.pme.methodology_dropdown.selected_value(),
            data: self.data(),
        };
    };

    self.restore_dynamic_data = function(snapshot) {
        if (snapshot.selected) {
            self.pme.methodology_dropdown.set_selected_by_value(snapshot.selected);
        }

        self.data(snapshot.data);
    };

    self.css_style = opts.css_style;

    self.methodologies = ko.computed(() => {
        let data = self.data();
        if (data) {
            return data['methodologies'];
        }
    });

    self.pme = self.new_instance(PMEBox, {
        loading: self.loading,
        data: self.methodologies,
        dynamic: true,
        default_methodology: 'bison_pme',
        hide_dropdown: opts.hide_dropdown || false,
        css_style: self.css_style,
    });

    self.when(self.pme).done(() => {
        _dfd.resolve();
    });

    return self;
}
