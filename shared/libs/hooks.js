/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import Sugar from 'sugar';
import 'knockout-punches';

Sugar.extend();

ko.options.deferUpdates = true;

ko.punches.enableAll();

function uuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        let r = (Math.random() * 16) | 0,
            v = c == 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

ko.templateSources.stringTemplate = function(template) {
    this._id = uuid();
    this._template = template;
};

ko.utils.extend(ko.templateSources.stringTemplate.prototype, {
    data: function(key, value) {
        this._data = this._data || {};
        this._data[this._id] = this._data[this._id] || {};

        if (arguments.length === 1) {
            return this._data[this._id][key];
        }

        this._data[this._id][key] = value;
    },
    text: function(value) {
        if (arguments.length === 0) {
            return this._template;
        }
        this._template = value;
    },
});

function createStringTemplateEngine(templateEngine) {
    templateEngine._makeTemplateSource = templateEngine.makeTemplateSource;

    templateEngine.makeTemplateSource = function(template) {
        if (typeof template !== 'string' || template.startsWith('tpl_')) {
            if (!template) {
                throw 'Trying to use template binding without template';
            }

            return templateEngine._makeTemplateSource(template);
        }

        return new ko.templateSources.stringTemplate(template);
    };

    return templateEngine;
}

ko.setTemplateEngine(createStringTemplateEngine(new ko.nativeTemplateEngine()));
