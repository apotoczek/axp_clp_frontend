/* globals google */
/* eslint no-console: "off" */

import ko from 'knockout';
import $ from 'jquery';
import lang from 'lang';
import Observer from 'src/libs/Observer';

import 'src/libs/bindings/highcharts';

ko.virtualElements.allowedBindings.page = true;

ko.bindingHandlers.foreachWithLength = {
    get_array: function(valueAccessor) {
        if (valueAccessor.data) {
            return ko.utils.unwrapObservable(valueAccessor.data);
        }
        return ko.utils.unwrapObservable(valueAccessor);
    },
    init: function(element, valueAccessor, allBindingsAccessor, viewModel, context) {
        return ko.bindingHandlers.foreach.init(
            element,
            valueAccessor,
            allBindingsAccessor,
            viewModel,
            context,
        );
    },
    update: function(element, valueAccessor, allBindingsAccessor, viewModel, context) {
        let array = ko.bindingHandlers.foreachWithLength.get_array(valueAccessor());

        return ko.bindingHandlers.foreach.update(
            element,
            valueAccessor,
            allBindingsAccessor,
            viewModel,
            context.extend({$length: array.length}),
        );
    },
};

ko.virtualElements.allowedBindings.foreachWithLength = true;

ko.bindingHandlers.collapseGroup = {
    init: function(element, valueAccessor) {
        let selector = valueAccessor();
        let $myGroup = $(selector);

        $myGroup.on('click', e => {
            if (
                $(e.target)
                    .closest('label')
                    .next()
                    .hasClass('in')
            ) {
                e.preventDefault();
                e.stopImmediatePropagation();
                return false;
            }
        });

        $myGroup.on('show.bs.collapse', '.collapse', () => {
            $myGroup.find('.collapse.in').collapse('hide');
        });
    },
};

ko.bindingHandlers.autoExpandActive = {
    update: function(element, valueAccessor) {
        let selector = ko.unwrap(valueAccessor());
        let id = `#${selector}`;
        $(id).collapse('show');
    },
};

ko.utils.uniqueId = (function() {
    let prefixesCounts = {
        'ks-unique-': 0,
    };

    return function(prefix) {
        prefix = prefix || 'ks-unique-';

        if (!prefixesCounts[prefix]) {
            prefixesCounts[prefix] = 0;
        }

        return prefix + prefixesCounts[prefix]++;
    };
})();

let popoverDomDataTemplateKey = '__popoverTemplateKey__';

ko.bindingHandlers.popover2 = {
    get_viewport: function() {
        let vp = {};
        return {
            top: (vp.top = $(document).scrollTop()),
            left: (vp.left = $(document).scrollLeft()),
            bottom: vp.top + $(window).height(),
            right: vp.left + $(window).width(),
        };
    },
    init: function(element) {
        let $element = $(element);

        ko.utils.domNodeDisposal.addDisposeCallback(element, () => {
            if ($element.data('bs.popover')) {
                $element.popover('destroy');
            }
        });
    },
    update: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
        let $element = $(element);
        let value = ko.unwrap(valueAccessor());
        let options =
            (!value.component && !value.options && !value.template
                ? ko.toJS(value)
                : ko.toJS(value.options)) || {};
        let get_template, data;

        let css = options.css_class || '';

        ko.utils.extend(options, {
            animation: false,
            container: 'body',
            template: `<div class="popover popover-new ${css}"> \
                            <div class="arrow"></div> \
                            <h3 class="popover-title"></h3> \
                            <div class="popover-content"></div> \
                      </div>`,
        });

        if (value.template || value.component) {
            if (value.template) {
                get_template = () => ko.unwrap(value.template);
                data = ko.unwrap(value.data);
            } else {
                data = ko.unwrap(value.component);

                if (value.component._has_inline_templates()) {
                    get_template = () => value.component.get_inline_template();
                } else {
                    get_template = () => ko.unwrap(value.component.template);
                }
            }

            // use unwrap to track dependency from template, if it is observable
            get_template();

            let id = ko.utils.domData.get(element, popoverDomDataTemplateKey);

            let listen_to = ko.unwrap(value.listen_to) || [];

            for (let i = 0, l = listen_to.length; i < l; i++) {
                ko.unwrap(data[listen_to[i]]);
            }

            let renderPopoverTemplate = function(eventObject) {
                if (eventObject && eventObject.type === 'inserted') {
                    $element.off('shown.bs.popover');
                }

                // use unwrap again to get correct template value instead of old value from closure
                // this works for observable template property
                ko.renderTemplate(
                    get_template(),
                    bindingContext.createChildContext(data),
                    value.templateOptions,
                    document.getElementById(id),
                );

                // bootstrap's popover calculates position before template renders,
                // so we recalculate position, using bootstrap methods
                let $popover = $(`#${id}`).parents('.popover');
                let popoverMethods = $element.data('bs.popover');

                $popover.find('.close-popover').on('click', () => {
                    $element.popover('hide');
                });

                if (popoverMethods) {
                    let placement = options.placement || 'right';
                    let position = popoverMethods.getPosition();
                    let width = $popover.outerWidth();
                    let height = $popover.outerHeight();
                    let offset = popoverMethods.getCalculatedOffset(
                        placement,
                        position,
                        width,
                        height,
                    );

                    let viewport = ko.bindingHandlers.popover2.get_viewport();

                    if (placement.includes('top') || placement.includes('bottom')) {
                        if (offset.left + width > viewport.right) {
                            offset.left = viewport.right - width;
                        } else if (offset.left < viewport.left) {
                            offset.left = viewport.left;
                        }
                    } else if (placement.includes('left') || placement.includes('right')) {
                        if (offset.top < viewport.top) {
                            offset.top = viewport.top;
                        } else if (offset.top + height > viewport.bottom) {
                            offset.top = viewport.bottom - height;
                        }
                    }

                    popoverMethods.applyPlacement(offset, placement);

                    if (placement.includes('top') || placement.includes('bottom')) {
                        let arrow_relative = position.left + position.width / 2 - offset.left;

                        popoverMethods.$arrow.css({left: `${arrow_relative}px`});
                    } else if (placement.includes('left') || placement.includes('right')) {
                        let arrow_relative = position.top + position.height / 2 - offset.top;

                        popoverMethods.$arrow.css({top: `${arrow_relative}px`});
                    }
                }
            };

            // if there is no generated id - popover executes first time for this element
            if (!id) {
                id = ko.utils.uniqueId('ks-popover-');
                ko.utils.domData.set(element, popoverDomDataTemplateKey, id);

                // place template rendering after popover is shown, because we don't have root element for template before that
                $element.on('shown.bs.popover inserted.bs.popover', renderPopoverTemplate);

                $element.parents('.scrollable').on('scroll', () => {
                    if ($(`#${id}`).is(':visible')) {
                        renderPopoverTemplate();
                    }
                });

                $(window).resize(() => {
                    $element.popover('hide');
                });

                if (value.hide_on_events) {
                    Observer.register_many(value.hide_on_events, () => {
                        $element.popover('hide');
                    });
                }

                $('html').on('click.popover_dismiss', e => {
                    let is_this_button =
                        $(e.target).closest('.btn-popover')[0] == $element[0] ||
                        $(e.target).closest('[data-bind^=popover2]')[0] == $element[0];
                    let is_inside_popover = $(e.target).closest('.popover-new').length != 0;

                    if (!is_this_button && !is_inside_popover) {
                        $element.popover('hide');
                    }
                });
            }

            options.content = `<div id="${id}" ></div>`;
            options.html = true;

            // support rerendering of template, if observable changes, when popover is opened
            if ($(`#${id}`).is(':visible')) {
                renderPopoverTemplate();
            }
        }

        let popoverData = $element.data('bs.popover');

        if (!popoverData) {
            $element.popover(options);

            $element.on('hidden.bs.popover', () => {
                $element.data('bs.popover').inState = {click: false, hover: false, focus: false};

                if (value.closed_event) {
                    Observer.broadcast(value.closed_event);
                }
            });

            $element.on('shown.bs.popover inserted.bs.popover', () => {
                (options.container ? $(options.container) : $element.parent()).one(
                    'click',
                    '[data-dismiss="popover"]',
                    () => {
                        $element.popover('hide');
                    },
                );

                if (value.opened_event) {
                    Observer.broadcast(value.opened_event);
                }
            });
        } else {
            ko.utils.extend(popoverData.options, options);
        }
    },
};

ko.bindingHandlers.define = {
    popover: function(element, title, content, placement, width, css_class, underlined = true) {
        if (content) {
            width = width || '250px';
            css_class = css_class || '';
            $(element).popover({
                title: title,
                content: content,
                trigger: 'hover',
                placement: placement || 'right',
                html: true,
                container: 'body',
                template: `<div class="popover popover-define ${css_class}" role="tooltip" style="width: ${width}">
                                <div class="arrow"></div>
                                <h3 class="popover-title"></h3>
                                <div class="popover-content"></div>
                          </div>`,
            });

            $(element).addClass('definition');

            if (!underlined) {
                $(element).addClass('definition-no-underline');
            }

            ko.utils.domNodeDisposal.addDisposeCallback(element, () => {
                $(element).popover('destroy');
            });
        }
    },
    get_content: function(term) {
        if (lang[term] && lang[term].definition) {
            let content = lang[term].definition;
            if (lang[term].src) {
                content += `<br/><span class="text-muted" style="font-size:12px;">Source: ${lang[term].src}</span>`;
            }

            return content;
        }

        return false;
    },
    get_alias: function(term) {
        if (lang.aliases[term]) {
            return lang.aliases[term];
        }
        return term;
    },
    get_title: function(term) {
        if (lang[term] && lang[term].title) {
            return lang[term].title;
        }

        if (lang[term] && lang[term].no_title) {
            return undefined;
        }

        return term;
    },
    init: function(element, valueAccessor) {
        let options = ko.unwrap(valueAccessor());

        if (typeof options === 'string') {
            let term = ko.bindingHandlers.define.get_alias(options);

            ko.bindingHandlers.define.popover(
                element,
                ko.bindingHandlers.define.get_title(term),
                ko.bindingHandlers.define.get_content(term),
                'right',
                '250px',
            );
        } else if (typeof options === 'object' && options && options.term) {
            let placement = options.placement || 'right';
            let width = options.width || '250px';
            let css_class = options.css_class;
            let underlined = options.underlined === undefined ? true : options.underlined;

            if (options.definition) {
                ko.bindingHandlers.define.popover(
                    element,
                    options.term,
                    options.definition,
                    placement,
                    width,
                    css_class,
                    underlined,
                );
            } else {
                let term =
                    !options.disable_lang_definition &&
                    ko.bindingHandlers.define.get_alias(options.term);

                ko.bindingHandlers.define.popover(
                    element,
                    ko.bindingHandlers.define.get_title(term),
                    ko.bindingHandlers.define.get_content(term),
                    placement,
                    width,
                    css_class,
                    underlined,
                );
            }
        }
    },
};

ko.bindingHandlers.renderComponent = {
    init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
        let component = ko.utils.unwrapObservable(valueAccessor());

        let newValueAccessor = function() {
            if (!component) {
                throw 'Trying to use renderComponent on undefined/null';
            }

            if (!component.__base_component) {
                let id = typeof component.get_id === 'function' ? component.get_id() : 'undefined';

                throw `Trying to use renderComponent for something that's not an instance of BaseComponent (id=${id}, template=${component.template})`;
            }

            if (component._has_inline_templates()) {
                return {
                    name: component.get_inline_template(),
                    data: component,
                };
            }

            if (!component.template) {
                let id = typeof component.get_id === 'function' ? component.get_id() : 'undefined';

                throw `Trying to render component without template (id=${id})`;
            }

            return {
                name: component.template,
                data: component,
            };
        };

        return ko.bindingHandlers.template.init(
            element,
            newValueAccessor,
            allBindings,
            viewModel,
            bindingContext,
        );
    },
    update: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
        let component = ko.utils.unwrapObservable(valueAccessor());

        let newValueAccessor = function() {
            if (component._has_inline_templates()) {
                return {
                    name: component.get_inline_template(),
                    data: component,
                };
            }

            return {
                name: component.template,
                data: component,
            };
        };

        return ko.bindingHandlers.template.update(
            element,
            newValueAccessor,
            allBindings,
            viewModel,
            bindingContext,
        );
    },
};

ko.virtualElements.allowedBindings.renderComponent = true;

ko.bindingHandlers.countdown = {
    init: function(element, valueAccessor, allBindings) {
        let data = ko.unwrap(valueAccessor());

        let max_length = allBindings.get('max_length') || 250;

        let remaining = max_length - data.length;

        $(element).text(`${remaining} characters remaining`);
    },
    update: function(element, valueAccessor, allBindings) {
        let data = ko.unwrap(valueAccessor());

        let max_length = allBindings.get('max_length') || 250;

        let remaining = max_length - data.length;

        $(element).text(`${remaining} characters remaining`);
    },
};

ko.bindingHandlers.event_horizon = {
    init: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
        ko.bindingHandlers.click.init(
            element,
            () => {
                return function() {};
            },
            {
                get: function() {
                    return false;
                },
            },
            viewModel,
            bindingContext,
        );
    },
};

ko.bindingHandlers.fixedTableHeader = {
    setWidth: function($fixed_table_header, $element) {
        setTimeout(() => {
            let $header_cols = $fixed_table_header.find('th');
            let $table_cols = $element.find('th');
            let $parent = $element.closest('.scrollable.content.page');

            $table_cols.each((idx, tcol) => {
                $($header_cols[idx]).width($(tcol).width());
            });

            $parent.scrollTop(0);
        }, 10);
    },
    init: function(element, valueAccessor) {
        let vm = valueAccessor();

        if (vm.fixed_header) {
            let $thead = $(element)
                .find('thead')
                .clone();

            ko.applyBindings(vm, $thead[0]);

            let $fixed_table_header = $(
                '<div class="fixed-table-header hidden-sm hidden-xs"></div>',
            );

            let $table = $('<table>').attr('class', $(element).attr('class'));

            $table.append($thead);

            $fixed_table_header.append($table);

            let $parent = $(element).closest('.scrollable.content.page');

            $parent.before($fixed_table_header);
            $(element).data('fixed-table-header', $fixed_table_header);

            $(window).on('resize', () => {
                ko.bindingHandlers.fixedTableHeader.setWidth($fixed_table_header, $(element));
            });

            vm.columns.subscribe(() => {
                ko.bindingHandlers.fixedTableHeader.setWidth($fixed_table_header, $(element));
            });
            vm.rows.subscribe(() => {
                ko.bindingHandlers.fixedTableHeader.setWidth($fixed_table_header, $(element));
            });
        }
    },
    update: function(element, valueAccessor) {
        let vm = valueAccessor();

        if (vm.fixed_header) {
            let $fixed_table_header = $(element).data('fixed-table-header');

            ko.bindingHandlers.fixedTableHeader.setWidth($fixed_table_header, $(element));
        }
    },
};

ko.bindingHandlers.enter = {
    init: function(element, valueAccessor, allBindingsAccessor, viewModel) {
        let allBindings = allBindingsAccessor();
        $(element).keypress(event => {
            let keyCode = event.which ? event.which : event.keyCode;
            if (keyCode === 13) {
                allBindings.enter.call(viewModel);
                return false;
            }
            return true;
        });
    },
};

ko.bindingHandlers.tooltip = {
    init: function(element, valueAccessor) {
        let options = ko.unwrap(valueAccessor());
        if (options) {
            let html = ko.unwrap(options.html);

            let attr = {
                html: true,
                title: html || false,
                placement: ko.unwrap(options.placement) || 'auto',
                container: ko.unwrap(options.container),
                delay: ko.unwrap(options.delay) || 0,
            };

            $(element).tooltip(attr);

            $('html').one('click', () => {
                $(element).tooltip('hide');
            });

            ko.utils.domNodeDisposal.addDisposeCallback(element, () => {
                $(element).tooltip('destroy');
            });
        }
    },
};

ko.bindingHandlers.dropdown = {
    init: function(element, valueAccessor) {
        let options = ko.unwrap(valueAccessor());

        $(element).dropdown();

        if (typeof options.toggle === 'function') {
            $(element)
                .parent()
                .on('show.bs.dropdown', () => {
                    options.toggle(true);
                });

            $(element)
                .parent()
                .on('hide.bs.dropdown', () => {
                    options.toggle(false);
                });
        }
    },
};

ko.bindingHandlers.renderMap = {
    init: function(element, valueAccessor) {
        let vm = ko.unwrap(valueAccessor());
        let mapOptions = ko.bindingHandlers.renderMap.mapOptions;
        if (vm.mapOptions) {
            mapOptions = {
                ...mapOptions,
                ...vm.mapOptions,
            };
        }

        vm.map(new google.maps.Map(element, mapOptions));
    },
    update: function(element, valueAccessor) {
        let vm = ko.unwrap(valueAccessor());

        ko.bindingHandlers.visible.update(element, vm.visible);
    },
    mapOptions: {
        panControl: false,
        zoomControl: true,
        mapTypeControl: false,
        scaleControl: false,
        streetViewControl: false,
        overviewMapControl: false,
        scrollwheel: false,
    },
};

ko.bindingHandlers.consoleLog = {
    update: function(element, valueAccessor) {
        console.log(ko.unwrap(valueAccessor()));
    },
};

ko.bindingHandlers.equalHeight = {
    resize: function(element, selector) {
        let $elements = $(element).find(selector);
        let height = 0;

        $elements.each(function() {
            $(this).height('auto');
        });

        $elements.each(function() {
            height = Math.max($(this).height(), height);
        });

        $elements.each(function() {
            $(this).height(height);
        });
    },
    init: function(element, valueAccessor) {
        let selector = valueAccessor();
        ko.bindingHandlers.equalHeight.resize(element, selector);
        $(window).on('resize', () => {
            ko.bindingHandlers.equalHeight.resize(element, selector);
        });
    },
};
