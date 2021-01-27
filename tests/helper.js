define(['knockout', 'custombindings'], ko => {
    let self = {};

    self.templates = {
        component: '<div id="component" data-bind="renderComponent: $data"></div>',
        template_binding: `
            <div id="template_binding" data-bind="template: {
                name: template,
                data: data,
            }"></div>
        `,
    };

    self.create_element = function(template_id_or_string) {
        let element = document.createElement('div');

        if (template_id_or_string in self.templates) {
            element.innerHTML = self.templates[template_id_or_string];
        } else {
            element.innerHTML = template_id_or_string;
        }

        document.body.appendChild(element);

        return element;
    };

    self.render = function(vm, template_id_or_string) {
        let element = self.create_element(template_id_or_string);

        ko.applyBindings(vm, element);

        return element;
    };

    self.cleanup = function(element) {
        element.parentNode.removeChild(element);
    };

    return self;
});
