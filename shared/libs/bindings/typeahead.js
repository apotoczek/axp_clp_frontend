import ko from 'knockout';
import $ from 'jquery';

import 'typeahead.js';

ko.bindingHandlers.typeahead = {
    init: function(element, valueAccessor) {
        let options = {
            ...ko.bindingHandlers.typeahead.options,
            ...ko.utils.unwrapObservable(valueAccessor()),
        };

        if (options && options.datasets) {
            let $input = $(element);
            let datasets = options.datasets;

            let clear_on_select = options.clear_on_select || false;

            $input.typeahead(options, datasets);

            ko.utils.domNodeDisposal.addDisposeCallback(element, () => {
                $input.typeahead('destroy');
            });

            let set_value = function(value) {
                if (value) {
                    $input.typeahead('val', value[datasets.display]);
                    $input.typeahead('close');
                }
            };

            if (options.default_value) {
                if (typeof options.default_value.subscribe === 'function') {
                    options.default_value.subscribe(set_value);
                }
                set_value(ko.unwrap(options.default_value));
            }

            if (options.on_select) {
                $input.on('typeahead:selected', (event, suggestion, name) => {
                    options.on_select(event, suggestion, name);
                    if (clear_on_select) {
                        $input.typeahead('val', '');
                    }
                    $input.typeahead('close');
                });
            }
            if (options.on_close) {
                $input.on('typeahead:closed', () => {
                    if (options.on_close($input.val())) {
                        $input.val('');
                    }
                });
            }
        }
    },
    options: {
        minLength: 3,
    },
};
