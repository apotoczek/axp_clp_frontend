import {html} from 'common-tags';

import BaseComponent from 'src/libs/components/basic/BaseComponent';

import 'src/libs/bindings/react';

export default class ReactWrapper extends BaseComponent {
    constructor(opts, components) {
        super(opts, components);

        const dfd = this.new_deferred();

        this.define_template(
            'full_page',
            html`
                <div
                    style="padding: 0; width: 100%; height: 100vh;"
                    data-bind="renderReactComponent: reactComponent, props: props"
                ></div>
            `,
        );

        this.define_template(html`
            <div
                style="padding: 0; width: 100%; height: 100%;"
                data-bind="renderReactComponent: reactComponent, props: props"
            ></div>
        `);

        this.reactComponent = opts.reactComponent;
        this.props = opts.props ?? {};

        dfd.resolve();
    }
}
