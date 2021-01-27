import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import ActionButton from 'src/libs/components/basic/ActionButton';

export default class DropdownButtons extends BaseComponent {
    constructor(opts, components) {
        super(opts, components);

        const _dfd = this.new_deferred();

        this.css = opts.css || {'btn-transparent': true};
        this.icon_css = opts.icon_css;

        this.label = opts.label;

        this.define_template(`
            <div class="dropdown">
                <button type="button" class="btn dropdown-toggle" data-toggle="dropdown" data-bind="disable: disabled, css: css">
                    <span data-bind="html: label"></span>
                    <span data-bind="css: icon_css"></span>
                </button>
                <ul class="dropdown-menu">
                    <!-- ko foreach: buttons -->
                        <!-- ko renderComponent: $data --><!-- /ko -->
                    <!-- /ko -->
                </ul>
            </div>
        `);

        this.button_configs = opts.buttons || [];

        this.buttons = [];

        for (const conf of this.button_configs) {
            const component = conf.component || ActionButton;

            this.buttons.push(
                this.new_instance(component, {
                    ...conf,
                    template: 'tpl_dropdown_item_action_button',
                }),
            );
        }

        this.when(this.buttons).done(() => {
            _dfd.resolve();
        });

        this.disabled = ko.pureComputed(() => {
            for (const button of this.buttons) {
                if (!button.disabled()) {
                    return false;
                }
            }

            return true;
        });
    }

    _init_button(conf, index) {
        return this.init_component(conf, button => {
            this.buttons.insert(button, index);
        });
    }
}
