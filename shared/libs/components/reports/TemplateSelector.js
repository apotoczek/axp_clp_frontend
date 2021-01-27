/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import Observer from 'src/libs/Observer';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    self.define_default_template(`
            <div class="template-selector-wrapper">
            <h2 class="text-center" data-bind="text: header_text, visible: header_text"></h2>
            <div class="template-selector">
                <table>
                    <tbody>
                        <tr data-bind="foreach: templates">
                            <td>
                                <div class="template-card" data-bind="click:$parent.preview, css: { active: $parent.is_selected($data) }"><h4 data-bind="html: name"></h4>
                                <span data-bind="text: description"></span>
                                <div class="preview-link">
                                    <p class="small">Preview</p>
                                    <span class="glyphicon glyphicon-chevron-down"></span>
                                </div>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            </div>
        `);

    self.header_text = opts.header_text || false;

    self.preview_event = opts.preview_event || Observer.gen_event_type();

    self.templates = self.data;

    if (opts.templates) {
        self.templates(opts.templates);
    }

    self.selected_id = ko.observable(opts.default_id);

    self.is_selected = function(template) {
        return self.selected_id() === template.id;
    };

    self.preview = function(template) {
        self.selected_id(template.id);

        Observer.broadcast(self.preview_event, template.id);
    };

    return self;
}
