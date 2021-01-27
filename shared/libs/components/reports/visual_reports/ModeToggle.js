/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import Observer from 'src/libs/Observer';

export default function(opts) {
    /********************************************************************
     * Mode Toggle
     *
     * Toggles between Edit mode and Preview mode in visual reports
     *
     *******************************************************************/

    let self = new BaseComponent(opts);

    self.disable_event = opts.disable_event;

    if (self.disable_event) {
        self.disabled = Observer.observable(self.disable_event, opts.start_disabled);
    } else {
        self.disabled = ko.observable(false);
    }

    self.visible = opts.visible || true;

    self.template = opts.template || 'tpl_mode_toggle';

    self.editor_event = opts.editor_event;

    self.preview_event = opts.preview_event;

    self._on_click = opts.on_click;

    self.on_click = function() {
        if (!self.disabled()) {
            self._on_click();
        }
    };

    self.css = opts.css || {};

    return self;
}
