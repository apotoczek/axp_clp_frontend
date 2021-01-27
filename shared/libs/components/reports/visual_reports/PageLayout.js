/* Automatically transformed from AMD to ES6. Beware of code smell. */
import TableOfContents from 'src/libs/components/reports/visual_reports/TableOfContents';
import ko from 'knockout';
import Layout from 'src/libs/components/reports/visual_reports/base/Layout';
import ReportComponentWrapper from 'src/libs/components/reports/visual_reports/ReportComponentWrapper';
import * as Utils from 'src/libs/Utils';

export default function(opts, components) {
    let self = new Layout(opts, components);

    self.__class__ = 'PageLayout';

    let _dfd = self.new_deferred();

    self.define_default_template(`
            <!-- ko if: mode() === 'view' -->
            <div class="layout-vbox faux-page-wrapper scrollable">
                <div class="faux-page" data-bind="attr: { id: html_id() }">
                    <!-- ko foreach: pages -->
                        <!-- ko template: {
                            name: $parent.page_template,
                            data: $data,
                        } --><!-- /ko -->
                    <!-- /ko -->
                </div>
            </div>
            <!-- /ko -->
            <!-- ko if: mode() === 'edit' -->
                <!-- ko foreach: pages -->
                    <!-- ko template: {
                        name: $parent.page_template,
                        data: $data,
                    } --><!-- /ko -->
                <!-- /ko -->
            <!-- /ko -->
        `);

    self._page_css = opts.page_css || {};
    self.page_template = opts.page_template || 'tpl_report_page';

    self.mode = ko.observable(opts.mode || 'view');

    self.enable_toc = opts.enable_toc || false;
    self.toc_page_number = opts.toc_page_number || 2;

    self.pages_config = opts.pages || [];

    self._pages = ko.observableArray([]);

    self.restore_static_data = self.extend_method(self.restore_static_data, (original, data) => {
        original(data);
        self.calculate_layout();
    });

    self.toc = self.new_instance(ReportComponentWrapper, {
        id: 'toc',
        template: 'tpl_report_component_wrapper_view',
        widget_config: {
            component: TableOfContents,
            template: 'tpl_fbr_report_toc',
            toc: ko.pureComputed(() => {
                let toc = [];

                let current_title = null;
                let current_idx = -1;

                for (let page of self._pages()) {
                    if (page.title && !page.exclude_from_toc) {
                        if (current_title != page.title) {
                            current_title = page.title;
                            current_idx++;

                            toc[current_idx] = {
                                title: current_title,
                                page_number: page.page_number,
                                subtitles: [],
                            };
                        }

                        let subtitle = ko.unwrap(page.subtitle);

                        if (toc[current_idx].subtitles.indexOf(subtitle) === -1) {
                            toc[current_idx].subtitles.push(subtitle);
                        }
                    }
                }

                return toc;
            }),
        },
    });

    self.page_css = function(is_cover = false, oversized_page = false) {
        let css = Utils.ensure_css_object(self._page_css);

        css['oversized-page'] = oversized_page;
        css['report-cover'] = is_cover;
        css['edit-mode'] = self.mode() === 'edit';

        return css;
    };

    self.calculate_layout = () => {
        let mode = self.mode();

        let pages = [];

        let page_number = 1;

        for (let page_config of self.pages_config) {
            if (self.enable_toc && page_number === self.toc_page_number) {
                page_number++;
            }
            if (page_config.multi_page && mode === 'view') {
                let key = page_config.layout[0];
                let component = self.components[key];
                let multi_pages = component.into_pages();

                for (let p of multi_pages) {
                    let page = {
                        layout: ko.observableArray([]),
                        title: page_config.title,
                        page_number: page_number || '',
                        css: self.page_css(false),
                        is_cover: false,
                    };

                    self.when(p).done(() => {
                        page.layout.push(p);
                    });

                    pages.push(page);
                    page_number++;
                }
            } else if (page_config.array_of_pages && mode === 'view') {
                let key = page_config.layout[0];

                for (let p of self.components[key].widget.pages()) {
                    let page = {
                        layout: ko.observableArray([]),
                        title: page_config.title,
                        page_number: page_number || '',
                        css: self.page_css(false),
                        is_cover: false,
                    };

                    self.when(p).done(() => {
                        page.layout.push(p);
                    });

                    pages.push(page);
                    page_number++;
                }
            } else if (page_config.multi_page_component_list && mode === 'view') {
                let key = page_config.layout[0];
                let grouped_components = self.components[key].into_page_groups();

                if (grouped_components) {
                    for (let page_group = 0; page_group < grouped_components.length; page_group++) {
                        let page = {
                            layout: [],
                            title: page_config.title,
                            page_number: page_number || '',
                            css: self.page_css(
                                page_config.is_cover || false,
                                page_config.oversized_page || false,
                            ),
                            is_cover: page_config.is_cover,
                        };

                        for (let key of page_config.layout) {
                            if (self.components[key]) {
                                let components_arr = grouped_components[page_group];
                                for (let i = 0; i < components_arr.length; i++) {
                                    page.layout.push(components_arr[i]);
                                }
                            }
                        }

                        if (page.layout.length > 0) {
                            if (page_config.subtitle_callback) {
                                page.subtitle = ko.pureComputed(() => {
                                    return page_config.subtitle_callback(page);
                                });
                            } else {
                                page.subtitle = page_config.subtitle;
                            }
                            page_number++;
                            pages.push(page);
                        }
                    }
                }
            } else {
                let page = {
                    layout: [],
                    title: page_config.title,
                    page_number: page_number || '',
                    css: self.page_css(
                        page_config.is_cover || false,
                        page_config.oversized_page || false,
                    ),
                    is_cover: page_config.is_cover,
                };

                for (let key of page_config.layout) {
                    if (self.components[key] && (mode === 'edit' || !self.components[key].hide())) {
                        page.layout.push(self.components[key]);
                    }
                }

                if (page.layout.length > 0) {
                    if (page_config.subtitle_callback) {
                        page.subtitle = ko.pureComputed(() => {
                            return page_config.subtitle_callback(page);
                        });
                    } else {
                        page.subtitle = page_config.subtitle;
                    }

                    page_number++;
                    pages.push(page);
                }
            }
        }

        self._pages(pages);
    };

    self.pages = ko.pureComputed(() => {
        let pages = self._pages().slice();

        if (self.enable_toc) {
            pages.splice(self.toc_page_number - 1, 0, {
                title: 'Contents',
                css: self.page_css(),
                layout: [self.toc],
            });
        }

        return pages;
    });

    self.when(self.toc).done(() => {
        _dfd.resolve();
    });

    return self;
}
