/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import PopoverChecklist from 'src/libs/components/popovers/PopoverChecklist';
import * as Mapping from 'src/libs/Mapping';
import * as Formatters from 'src/libs/Formatters';
import Observer from 'src/libs/Observer';

export default function(opts, components) {
    //To prevent duplicate clear event handling, this clear fn calls parent clear.
    let clear_event = opts.clear_event;
    opts.clear_event = undefined;

    let self = new PopoverChecklist(opts, components);

    self.template = opts.template || 'tpl_popover_checklist_custom_value';

    self.custom_value = ko.observable();
    self.custom_value_enabled = ko.observable(false);

    self.custom_value_placeholder = opts.custom_value_placeholder;

    self.custom_value_mapping = Mapping.gen_mapping({
        mapping: opts.custom_value_mapping,
        mapping_args: opts.custom_value_mapping_args,
        mapping_default: opts.custom_value_mapping_default,
    });

    self.toggle_custom_value = function() {
        self.custom_value_enabled(!self.custom_value_enabled());
    };

    self.custom_value_mapped = ko.computed(() => {
        let value = self.custom_value();
        if (value) {
            return self.custom_value_mapping(value);
        }
    });

    self.__selected = self.selected;

    self.selected = ko.computed(() => {
        let custom_value_mapped = self.custom_value_mapped();
        let selected = self.__selected();

        if (self.custom_value_enabled() && custom_value_mapped) {
            let option = {
                value: custom_value_mapped,
                label: Formatters.backend_date(custom_value_mapped),
                _is_custom_value: true,
            };

            if (self.single_selection) {
                return [option];
            }

            return [...selected, option];
        }

        return selected;
    });

    self.get_value = ko.computed(() => {
        return self.selected();
    });

    self.modified = ko.computed(() => {
        return self.selected().length > 0;
    });

    self.__is_selected = self.is_selected;

    self.is_selected = function(option) {
        if (self.custom_value_enabled() && self.custom_value_mapped() && self.single_selection) {
            return false;
        }
        return self.__is_selected(option);
    };

    self.selected_string = ko.computed(() => {
        let selected = self.selected();
        if (selected.length > 0) {
            return self
                .selected()
                .map(option => {
                    return ko.unwrap(option.label);
                })
                .join(', ');
        }
        return 'No selection';
    });

    self.__toggle = self.toggle;

    self.toggle = function(option) {
        if (self.custom_value_enabled() && self.custom_value_mapped() && self.single_selection) {
            self.custom_value_enabled(false);
        }

        self.__toggle(option);
    };

    self.__clear = self.clear;

    self.clear = function() {
        self.__clear();
        self.custom_value(undefined);
        self.custom_value_enabled(false);
    };

    if (clear_event) {
        if (Array.isArray(clear_event) && clear_event.length) {
            for (let i = 0, j = clear_event.length; i < j; i++) {
                Observer.register(clear_event[i], () => {
                    self.clear();
                });
            }
        } else {
            Observer.register(clear_event, () => {
                self.clear();
            });
        }
    }

    return self;
}
