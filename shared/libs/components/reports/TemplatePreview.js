/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import Observer from 'src/libs/Observer';
import * as Formatters from 'src/libs/Formatters';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    let _dfd = self.new_deferred();

    self.default_preview_img = opts.default_preview_img;

    self.define_default_template(`
            <div class="layout-vbox template-preview" data-bind="if: selected_template, css:css">
                <div class="row expanded-data" style="padding-top: 30px;">
                    <div class="col-md-5 report-features">
                        <button type="button" class="btn btn-lg disabled" data-bind="visible: is_disabled">
                            Coming soon
                        </button>
                        <button type="button" class="btn btn-lg btn-success" data-bind="click: generate_report, visible: is_enabled">
                            Generate This Report
                        </button>
                        <h2>Includes</h2>
                        <div data-bind="html: features"></div>
                    </div>
                    <div class="col-md-7">
                        <div class="report-preview" data-bind="style: preview_image_style"></div>
                    </div>
                </div>
            </div>
        `);

    self.preview_event = opts.preview_event || Observer.gen_event_type();
    self.generate_report_event = opts.generate_report_event || Observer.gen_event_type();

    self.selected_template = ko.observable(undefined);
    self.expanded = ko.observable(false);

    self.templates = self.data;

    if (opts.templates) {
        self.templates(opts.templates);
    }

    if (opts.enabled_templates) {
        self.enabled_templates = opts.enabled_templates;

        self.is_enabled = ko.pureComputed(() => {
            let selected = self.selected_template();

            if (selected) {
                return self.enabled_templates.indexOf(selected.id) > -1;
            }

            return false;
        });
    } else {
        self.is_enabled = ko.pureComputed(() => {
            let selected = self.selected_template();

            if (selected) {
                return selected.enabled || false;
            }

            return false;
        });
    }

    self.is_disabled = ko.pureComputed(() => {
        return !self.is_enabled();
    });

    self.css = ko.pureComputed(() => {
        return {expanded: self.expanded()};
    });

    self.toggle_expand = function() {
        self.expanded(!self.expanded());
    };

    self.selected_and_expand = function(id) {
        let templates = self.templates();

        let prev = self.selected_template();

        let next = templates.find(tpl => tpl.id === id);

        self.selected_template(next);

        if (self.expanded() && id === prev.id) {
            self.expanded(false);
        } else {
            self.expanded(true);
        }
    };

    self.preview_image_style = ko.pureComputed(() => {
        let selected = self.selected_template();

        let style = {
            backgroundImage: '',
        };

        let mapping = {
            net_overview: require('src/img/data_reports/net_overview.jpg'),
            net_cashflows: require('src/img/data_reports/net_cashflows.jpg'),
            pme_benchmark: require('src/img/data_reports/PME_benchmark.jpg'),
            time_weighted: require('src/img/data_reports/time_weighted.jpg'),
            peer_benchmark: require('src/img/data_reports/peer_benchmark.jpg'),
            quarterly_progression: require('src/img/data_reports/quarterly_progression.jpg'),
            lp_report: require('src/img/data_reports/lp_report.jpg'),
            delayed_cashflows: require('src/img/data_reports/delayed_cashflows.jpg'),
        };

        if (selected && selected.preview_img) {
            style.backgroundImage = `url('${selected.preview_img}')`;
        } else if (selected && selected.id in mapping) {
            style.backgroundImage = `url('${mapping[selected.id]}')`;
        } else if (self.default_preview_img) {
            style.backgroundImage = `url('${self.default_preview_img}')`;
        }

        return style;
    });

    self.features = ko.pureComputed(() => {
        let selected = self.selected_template();

        if (selected && selected.features) {
            return Formatters.strings_full(selected.features);
        }

        return '';
    });

    Observer.register(self.preview_event, self.selected_and_expand);

    self.generate_report = function() {
        let selected = self.selected_template();

        if (selected) {
            Observer.broadcast(self.generate_report_event, selected.id);
        }

        self.expanded(false);
    };

    _dfd.resolve();

    return self;
}
