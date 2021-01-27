/* Automatically transformed from AMD to ES6. Beware of code smell. */
import NewPopoverButton from 'src/libs/components/popovers/NewPopoverButton';
import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import SelectedCount from 'src/libs/components/basic/SelectedCount';
import ActionButton from 'src/libs/components/basic/ActionButton';
import PopoverSupportForm from 'src/libs/components/popovers/PopoverSupportForm';
import Observer from 'src/libs/Observer';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    let _dfd = self.new_deferred();

    self.template = opts.template || 'tpl_breadcrumb_header';

    self.button_configs = opts.buttons || [];

    const hide_event = Observer.gen_event_type();

    self.button_configs.push({
        component: NewPopoverButton,
        id: 'help_me',
        css: 'help-button',
        hide_on_events: [hide_event],
        popover_config: {
            component: PopoverSupportForm,
            get_user: true,
            entity: self.entity,
            placement: 'left',
            hide_event: hide_event,
        },
        ellipsis: false,
        label: 'Get Support <i class="icon-mail" style="padding-left:5px;"></i>',
    });

    self.buttons = [];

    self.title_css = opts.title_css || {};

    self.title =
        opts.title ||
        ko.pureComputed(() => {
            let entity = self.data();

            if (entity) {
                return entity.name;
            }

            return '';
        });

    if (opts.data_table_id) {
        self.selected_count = new SelectedCount({
            parent_id: self.get_id(),
            id: 'selected_count',
            data_table_id: opts.data_table_id,
            pull_left: true,
        });
    }

    /*******************************************************************
     * Buttons
     *******************************************************************/

    self._init_button = function(conf, index) {
        self.dfds.push(
            self.init_component(conf, button => {
                self.buttons.insert(button, index);
            }),
        );
    };

    for (let i = 0, l = self.button_configs.length; i < l; i++) {
        let conf = {...self.button_configs[i]};

        conf.component = conf.component || ActionButton;

        if (self.button_configs[i].use_header_data) {
            conf.data = self.data;
        }

        self._init_button(conf, i);
    }

    self.when.apply(null, self.buttons).done(() => {
        _dfd.resolve();
    });

    return self;
}
