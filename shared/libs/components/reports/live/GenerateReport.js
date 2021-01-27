/* Automatically transformed from AMD to ES6. Beware of code smell. */
import EventButton from 'src/libs/components/basic/EventButton';
import HTMLContent from 'src/libs/components/basic/HTMLContent';
import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import Aside from 'src/libs/components/basic/Aside';
import * as Utils from 'src/libs/Utils';
import Observer from 'src/libs/Observer';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    self.dfd = self.new_deferred();

    self.template = 'tpl_body_no_layout';
    self.selected_fund = ko.observable();
    self.selected_entity = ko.observable();
    self.generate_report_event = opts.generate_report_event;

    self.heading = {
        component: HTMLContent,
        id: 'heading',
        html: ko.computed(() => {
            if (self.selected_fund() && self.selected_entity()) {
                return `<h1 style="line-height:50px;">Modeling ${
                    self.selected_fund().name
                }<br/>on ${self.selected_entity().name}</h1>`;
            }
            return '';
        }),
        css: {'text-center': true},
    };
    self.subtitle = {
        component: HTMLContent,
        id: 'subtitle',
        html: '<p>100 Credits Remaining',
        css: {'text-center': true},
    };

    self.generate_report_button = {
        id: 'generate_report',
        component: EventButton,
        template: 'tpl_cpanel_button',
        css: {'btn-lg': true, 'btn-success': true, 'generate-button': true},
        label: 'Generate Report',
    };
    self.body = self.new_instance(Aside, {
        id: 'body',
        template: 'tpl_aside_body',
        layout: {
            body: ['heading', 'generate_report', 'subtitle'],
        },
        components: [self.heading, self.subtitle, self.generate_report_button],
    });

    self.when(self.body).done(() => {
        self.dfd.resolve();

        Observer.register(opts.select_fund_event, fund => {
            self.selected_fund(fund);
        });

        Observer.register(opts.select_comp_event, entity => {
            self.selected_entity(entity);
        });

        Observer.register(
            Utils.gen_event('EventButton', self.get_id(), 'body', 'generate_report'),
            () => {
                Observer.broadcast(self.generate_report_event);
            },
        );
    });
    return self;
}
