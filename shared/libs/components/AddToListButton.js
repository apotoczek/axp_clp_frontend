import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import DataSource from 'src/libs/DataSource';
import DataThing from 'src/libs/DataThing';

export default class AddToListButton extends BaseComponent {
    constructor(opts, components) {
        super(opts, components);

        this.define_template(`
            <div class="dropdown">
                <button type="button" class="btn dropdown-toggle" data-toggle="dropdown" data-bind="css: css, disable: disabled">
                    <span data-bind="html: label"></span>
                    <span data-bind="css: icon_css"></span>
                </button>
                <ul class="dropdown-menu">
                    <!-- ko foreach: lists.data -->
                        <li>
                            <a class="clickable" data-bind="click: $parent.click_list">
                                <span data-bind="html: name"></span>
                            </a>
                        </li>
                    <!-- /ko -->
                </ul>
            </div>
        `);

        this._save_to_list = DataThing.backends.useractionhandler({
            url: 'add_entities_to_list',
        });

        this.entity_type = opts.entity_type;

        this.lists = this.new_instance(DataSource, {
            datasource: {
                key: 'results',
                type: 'dynamic',
                query: {
                    target: 'user:lists',
                    results_per_page: 'all',
                },
            },
        });

        this.css = opts.css || {'btn-transparent': true};
        this.icon_css = opts.icon_css;

        this.label = opts.label || 'Add to list';

        this.disabled = ko.pureComputed(() => {
            const data = this.data() || [];
            const lists = this.lists.data() || [];

            return lists.length == 0 || data.length == 0;
        });
    }

    click_list = list => {
        const data = this.data() || [];

        this._save_to_list({
            data: {
                uid: list.uid,
                entities: data.map(({uid}) => ({uid, entity_type: this.entity_type})),
            },
            success: DataThing.api.XHRSuccess(() => {}),
            error: DataThing.api.XHRError(() => {}),
        });
    };
}
