/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import ActionButton from 'src/libs/components/basic/ActionButton';
import SelectedCount from 'src/libs/components/basic/SelectedCount';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    self.define_template(`
            <div class="header">
                <div class="pull-left">
                    <div class="header-title" data-bind="html: title, css: title_css"></div>
                    <!-- ko if: subtitle -->
                        <div class="header-subtitle" data-bind="text: subtitle, css: subtitle_css" style="margin: 10px 0px 20px"></div>
                    <!-- /ko -->
                </div>
                <div class="btn-toolbar pull-right" role="toolbar">
                    <!-- ko if: $data.selected_count -->
                        <!-- ko renderComponent: selected_count --><!-- /ko -->
                    <!-- /ko -->
                    <!-- ko foreach: buttons -->
                        <div class="btn-group">
                            <!-- ko renderComponent: $data --><!-- /ko -->
                        </div>
                    <!-- /ko -->
                </div>
            </div>
        `);

    let _dfd = self.new_deferred();

    self.button_configs = opts.buttons || [];

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

    self.subtitle_css = opts.subtitle_css || {};

    self.subtitle_key = opts.subtitle_key;

    self.subtitle =
        opts.subtitle ||
        ko.pureComputed(() => {
            let entity = self.data();

            if (entity && self.subtitle_key && entity[self.subtitle_key]) {
                return entity[self.subtitle_key];
            }

            return undefined;
        });

    if (opts.data_table_id) {
        self.selected_count = new SelectedCount({
            parent_id: self.get_id(),
            id: 'selected_count',
            data_table_id: opts.data_table_id,
            enable_select_all: opts.enable_select_all,
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
