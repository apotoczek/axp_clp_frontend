/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import * as Formatters from 'src/libs/Formatters';
import * as Utils from 'src/libs/Utils';

class BreadcrumbItem extends BaseComponent {
    constructor(opts, components) {
        super(opts, components);

        this.inherit_data = opts.inherit_data || false;

        if (opts.label) {
            this.label = opts.label;
        } else {
            if (opts.label_key) {
                this.label_key = opts.label_key;
            }

            this.label = ko.pureComputed(() => {
                let data = this.data();
                let loading = this.loading();

                if (!loading && data) {
                    if (this.label_key) {
                        return Utils.extract_data(this.label_key, data);
                    }
                    return data;
                } else if (loading) {
                    return '<span class="glyphicon glyphicon-cog animate-spin"></span>';
                }
            });
        }

        if (opts.link) {
            this.link = opts.link;
        } else if (opts.contextual_url) {
            this.link = ko.pureComputed(() => {
                return Utils.contextual_url(this.data(), opts.contextual_url);
            });
        } else if (opts.link_key || opts.link_format) {
            this.link_formatter = Formatters.gen_formatter({format: opts.link_format});
            this.link_key = opts.link_key;
            this.link = ko.pureComputed(() => {
                let data = this.data();
                if (data) {
                    if (this.link_key && data[this.link_key]) {
                        return this.link_formatter(data[this.link_key]);
                    }
                    return this.link_formatter(data);
                }
            });
        }
    }
}

export default class Breadcrumb extends BaseComponent {
    constructor(opts, components) {
        super(opts, components);

        this.define_template(`
                <ol class="breadcrumb" data-bind="foreach: items">
                    <li data-bind="css: { active: !link }">
                        <!-- ko if: link -->
                            <a data-bind="attr: { href: link }, html: label, css:$data.css ? css : {}"></a>
                        <!-- /ko -->
                        <!-- ko if: !link -->
                             <span data-bind="html: label"></span>
                        <!-- /ko -->
                    </li>
                </ol>
            `);

        this._items = [];

        for (let item of opts.items) {
            if (item.inherit_data) {
                item.data = this.data;
                item.loading = this.loading;
            }

            this._items.push(new BreadcrumbItem(item));
        }

        this.items = ko.pureComputed(() => {
            let items = [];

            for (let item of this._items) {
                let label = ko.unwrap(item.label);
                if (label) {
                    items.push({
                        label: label,
                        link: ko.unwrap(item.link),
                    });
                }
            }

            return items;
        });
    }
}
