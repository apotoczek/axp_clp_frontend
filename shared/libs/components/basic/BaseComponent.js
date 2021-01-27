/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import Observer from 'src/libs/Observer';
import DataSource from 'src/libs/DataSource';

export default class BaseComponent extends DataSource {
    constructor(opts = {}, components = {}) {
        super(opts, components);

        this.__base_component = true;

        this.opts = opts;
        this.css = opts.css || {};

        if (ko.isObservable(opts.visible)) {
            this.visible = opts.visible;
        } else {
            this.visible = ko.observable(opts.visible === undefined ? true : opts.visible);
        }

        this.visible_event = opts.visible_event;
        this.visible_event_fn = opts.visible_event_fn;

        if (this.visible_event) {
            Observer.register(this.visible_event, visible => {
                if (ko.isWriteableObservable(this.visible)) {
                    if (typeof this.visible_event_fn === 'function') {
                        this.visible(this.visible_event_fn(visible));
                    } else {
                        this.visible(!!visible);
                    }
                }
            });
        }

        this._inline_templates = {};
        this._active_inline_template = ko.observable(opts.active_template || 'default');

        let _dfd = this.new_deferred();

        if (opts.get_user) {
            this.user = ko.observable();
            this._user = this.new_instance(DataSource, {
                data: this.user,
                datasource: {
                    type: 'dynamic',
                    query: {
                        target: 'user',
                    },
                },
            });

            this.add_dependency(this._user);
        } else {
            this.user = () => {
                throw `Trying to access user without get_user: true. (${this.get_id()})`;
            };
        }

        _dfd.resolve();
    }

    user_has_feature(feature) {
        let user = this.user();

        if (user) {
            if (user.features) {
                return user.features.indexOf(feature) > -1;
            }
        }

        return false;
    }

    extend_method(method, override) {
        return function(...args) {
            override(method, ...args);
        };
    }

    define_default_template(template) {
        this.define_template(template);
    }

    /*
            Define a inline template

            Args:
                template (string): The string with the template in it, in
                    this case, name will be set to "default"

                OR

                name (string): Name of the template (for non-default ones)
                template (string): The string with the template in it
        */
    define_template(...args) {
        let name, template_string;

        if (args.length === 1) {
            name = 'default';
            template_string = args[0];
        } else if (args.length === 2) {
            name = args[0];
            template_string = args[1];
        } else {
            throw `Invalid number of arguments (${
                args.length
            }) to 'define_template' in component with id=${this.get_id()}, args=${args}`;
        }

        // Sanity check to make sure we're not also defining a template id
        let template_argument = this.opts.template || this.template;

        if (template_argument) {
            throw `Defining template '${name}' on component that recieved a 'template' argument=${template_argument}, id=${this.get_id()}, template=${template_string}`;
        }

        this._inline_templates[name] = template_string;
    }

    _has_inline_templates() {
        return Object.keys(this._inline_templates).length;
    }

    set_active_template(name) {
        if (name in this._inline_templates) {
            this._active_inline_template(name);
        }
    }

    get_inline_template() {
        let active = this._active_inline_template();

        return this._inline_templates[active];
    }
}
