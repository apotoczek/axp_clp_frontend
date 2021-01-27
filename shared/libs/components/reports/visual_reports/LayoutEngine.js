/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import Layout from 'src/libs/components/reports/visual_reports/base/Layout';

export default function(opts, components) {
    let self = new Layout(opts, components);

    self.__class__ = 'LayoutEngine';

    self.template = opts.template || 'tpl_report_layout_engine';

    self._layout = opts.layout;
    self.header_id = opts.header;
    self.mode = ko.observable(opts.mode || 'view');

    self.css = ko.pureComputed(() => {
        let css = {};

        css['edit-mode'] = self.mode() === 'edit';

        return css;
    });

    self.layout = ko.observableArray([]);
    self.header = ko.observable();

    self.restore_static_data = self.extend_method(self.restore_static_data, (original, data) => {
        original(data);

        self.calculate_layout();
    });

    self.resolve_flex_if_even_quarters = function(quarter, flex, half) {
        // we have some flex components and an even number of quarter components
        if (flex.length % 2 === 1 && quarter.length % 2 === 0) {
            // we have a flex component(s) and an even number of quarter components
            if (flex.length > 1) {
                // we have an odd number of flex components so make one half and the rest quarter
                half.unshift(flex.pop());
                // put the rest into quarter
                for (let i = 0, l = flex.length; i < l; i++) {
                    quarter.push(flex.shift());
                }
            }
        }
    };

    self.resolve_flex = function(quarter, flex, half) {
        /* == Test 1 ==*/
        if (flex.length % 2 === 1 && quarter.length % 2 === 1) {
            // we have a flex component and need a quarter fill
            quarter.push(flex.shift());
        }

        /* == Test 2 ==*/
        // If quarters are even resolve as much as possible
        self.resolve_flex_if_even_quarters(quarter, flex, half);

        /* == Test 3 ==*/
        if (flex.length % 2 === 0 && quarter.length % 2 === 1) {
            // we have even flex and odd quarter so we try to even out quarters and then
            // resolve as much as possible
            if (flex.length > 0) {
                quarter.push(flex.shift());
            }
            // If quarters are even resolve as much as possible
            self.resolve_flex_if_even_quarters(quarter, flex, half);
        }

        /* == Test 4 ==*/
        if (flex.length === 1 && quarter.length % 2 === 0) {
            // we have 1 remaining flex and even quarters so make the flex half
            half.unshift(flex.pop());
        }

        /* == Test 5 ==*/
        if (flex.length % 2 === 0 && quarter.length % 2 === 0 && flex.length > 0) {
            // we have an even number of flexes left and even number of quarters so we merge
            quarter = quarter.concat(flex);
        }

        return {quarter: quarter, half: half};
    };

    self.calculate_layout = function() {
        let mode = self.mode();

        let widgets = {
            first: [],
            quarter: [],
            flex: [],
            half: [],
            full: [],
        };

        for (let key of self._layout) {
            if (self.components[key]) {
                let component = self.components[key];

                if (mode === 'view' && component.hide()) {
                    continue;
                }

                let size = component.size;

                if (component.is_first) {
                    widgets.first.push(component);
                } else if (typeof size === 'undefined') {
                    widgets.quarter.push(component);
                } else if (size.length == 1) {
                    widgets[size[0]].push(component);
                } else if (size.length > 1) {
                    widgets.flex.push(component);
                }
            }
        }

        let quarter_and_half = self.resolve_flex(widgets.quarter, widgets.flex, widgets.half);

        let quarter = quarter_and_half.quarter;
        let half = quarter_and_half.half;

        // TODO: FULL IS NOT INCLUDED YET
        // let full = widgets.full;

        let final_layout = [];

        for (let i = 0, l = quarter.length; i < l; i++) {
            let obj = {
                template: 'tpl_report_col6',
                data: quarter.shift(),
            };

            if ('templates' in obj.data) {
                if (obj.data.templates.quarter) {
                    obj.data.widget.template = obj.data.templates.quarter;
                }
            }

            final_layout.push(obj);
        }

        final_layout.sort((a, b) => {
            return self._layout.indexOf(a.data.id) - self._layout.indexOf(b.data.id);
        });

        final_layout = final_layout.inGroupsOf(2).map(group => group.compact());

        for (let i = 0, l = half.length; i < l; i++) {
            let obj = {
                template: 'tpl_report_col12',
                data: half.shift(),
            };

            if ('templates' in obj.data) {
                if (obj.data.templates.half) {
                    obj.data.widget.template = obj.data.templates.half;
                }
            }

            final_layout.push([obj]);
        }

        let i = 0;

        let new_final_layout = [widgets.first];

        for (let row of final_layout) {
            i++;

            new_final_layout.push(row);

            if (i % 2 === 0 && i < final_layout.length) {
                new_final_layout.push({
                    is_page_break: true,
                });
            }
        }

        if (self.header_id && self.components[self.header_id]) {
            self.header(self.components[self.header_id]);
        }

        self.layout(new_final_layout);
    };

    return self;
}
