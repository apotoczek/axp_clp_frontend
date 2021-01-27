/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import NewPopoverButton from 'src/libs/components/popovers/NewPopoverButton';
import PopoverSupportForm from 'src/libs/components/popovers/PopoverSupportForm';
import ActionButton from 'src/libs/components/basic/ActionButton';
import Observer from 'src/libs/Observer';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    let _dfd = self.new_deferred();

    self.entity = ko.pureComputed(() => {
        let data = self.data();

        if (!Object.isArray(data)) {
            return data;
        }
    });

    self.title = opts.title
        ? ko.observable(opts.title)
        : ko.pureComputed(() => {
              let entity = self.entity();
              if (entity) {
                  if (entity.name) {
                      return entity.name.truncate(50, 'middle', '... ');
                  }
                  return 'Untitled';
              }
          });

    self.title_css = ko.pureComputed(() => {
        let title = self.title();
        if (title && title.indexOf('glyphicon') < 0 && title.length > 25) {
            return {'long-name': true};
        }
        return {'long-name': false};
    });

    self.valid_export_features = opts.valid_export_features || false;

    /*******************************************************************
     * Buttons
     *******************************************************************/

    self.button_configs = opts.buttons || [];

    if (!opts.not_support_button) {
        const hide_event = Observer.gen_event_type();

        self.button_configs.unshift({
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
    }

    self.buttons = [];

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
