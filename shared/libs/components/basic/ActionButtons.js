/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ActionButton from 'src/libs/components/basic/ActionButton';
import Observer from 'src/libs/Observer';

export default function(opts) {
    /********************************************************************
     * ActionButtons
     *
     * A set of buttons with <label> and <action>. When you click a button,
     * an event (ActionButtons.action.<action>) is broadcasted with
     * the data object as the payload. The data object is either passed in
     * as 'data' or determined by the 'datasource' config.
     *
     *******************************************************************/

    let self = new ActionButton(opts);

    self.template = opts.template || 'tpl_action_buttons';

    self.buttons = [];

    self.css = opts.css;

    self.broadcast_event = function(btn) {
        Observer.broadcast_for_id(self.get_id(), `ActionButtons.action.${btn.action}`, btn.data());
    };

    self.init_button = function(opts) {
        return self.new_instance(ActionButton, {
            label: opts.label,
            dropdown_label: opts.label,
            template: opts.template,
            disabled_label: opts.disabled_label,
            disabled_property: opts.disabled_property,
            disabled_callback: opts.disabled_callback,
            disabled_if_no_data: opts.disabled_if_no_data,
            hidden_property: opts.hidden_property,
            hidden_callback: opts.hidden_callback,
            action: opts.action,
            data: opts.datasource ? undefined : opts.data || self.data,
            loading: self.loading,
            broadcast_event: self.broadcast_event,
            css: opts.css,
            trigger_modal: opts.trigger_modal,
            trigger_url: opts.trigger_url,
            datasource: opts.datasource,
        });
    };

    if (opts.buttons) {
        for (let i = 0, l = opts.buttons.length; i < l; i++) {
            self.buttons.push(self.init_button(opts.buttons[i]));
        }
    } else {
        throw `Trying to initialize ActionButtons (${self.get_id()}) without buttons`;
    }

    return self;
}
