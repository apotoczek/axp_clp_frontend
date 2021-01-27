/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import auth from 'auth';
import ActionButton from 'src/libs/components/basic/ActionButton';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import SelectedCount from 'src/libs/components/basic/SelectedCount';
import DynamicActions from 'src/libs/components/basic/DynamicActions';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    let _dfd = self.new_deferred();

    self._disable_export = opts.disable_export || false;

    self.disable_export = ko.computed(() => {
        return ko.unwrap(self._disable_export);
    });

    self.valid_export_features = opts.valid_export_features || false;

    self.can_export = ko.pureComputed(() => {
        if (!self.valid_export_features) {
            return true;
        }

        for (let i = 0, l = self.valid_export_features.length; i < l; i++) {
            if (auth.user_has_feature(self.valid_export_features[i])) {
                return true;
            }
        }
        return false;
    });

    if (opts.data_table_id) {
        self.selected_count = self.new_instance(SelectedCount, {
            parent_id: self.get_id(),
            id: 'selected_count',
            data_table_id: opts.data_table_id,
            pull_left: true,
        });
    }

    self.export_actions = self.new_instance(DynamicActions, {
        id: 'export_actions',
        label: 'Export',
        id_callback: opts.export_id_callback,
        icon_css: 'glyphicon glyphicon-download-alt',
        css: {'dropdown-flow-left': true, 'btn-block': true},
    });

    /*******************************************************************
     * Buttons
     *******************************************************************/

    self.button_configs = opts.buttons || [];

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

        if (conf.last_button == true) {
            self.init_component(conf, button => {
                self.last_button = button;
            });
        } else {
            if (self.button_configs[i].use_header_data) {
                conf.data = self.data;
            }

            self._init_button(conf, i);
        }
    }

    self.when.apply(null, self.buttons).done(() => {
        _dfd.resolve();
    });

    return self;
}
