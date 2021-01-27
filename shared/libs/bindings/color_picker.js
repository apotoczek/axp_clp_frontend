import $ from 'jquery';
import ko from 'knockout';

import 'spectrum-colorpicker';

ko.bindingHandlers.color_picker = {
    init: function(element, valueAccessor) {
        let opts = ko.unwrap(valueAccessor());
        let change_callback = opts.color_callback;
        let starting_color = ko.unwrap(opts.starting_color);

        $(element).spectrum({
            color: starting_color,
            change: change_callback,
            hide: change_callback,
            showInput: true,
            preferredFormat: 'hex',
        });

        ko.utils.domNodeDisposal.addDisposeCallback(element, () => {
            $(element).spectrum('destroy');
        });
    },
};
