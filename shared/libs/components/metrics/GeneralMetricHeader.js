/* Automatically transformed from AMD to ES6. Beware of code smell. */
import Breadcrumb from 'src/libs/components/basic/Breadcrumb';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import Aside from 'src/libs/components/basic/Aside';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    let dfd = self.new_deferred();

    let breadcrumb = {
        id: 'breadcrumb',
        component: Breadcrumb,
        items: [{label: 'Metrics'}],
    };

    self.body = self.new_instance(Aside, {
        id: 'body',
        template: 'tpl_aside_body',
        layout: {
            body: ['breadcrumb'],
        },
        components: [breadcrumb],
    });

    self.when(self.body).done(dfd.resolve);

    return self;
}
