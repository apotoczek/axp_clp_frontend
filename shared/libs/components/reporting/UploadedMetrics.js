import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';

import GroupedMetrics from 'src/libs/components/reporting/GroupedMetrics';

export default class UploadedMetrics extends BaseComponent {
    constructor(opts, components) {
        super(opts, components);

        this.define_template(`
            <div class="row">
                <div class="col-xs-12 col-no-padding">
                    {{#if show_top_table}}
                        {{#renderComponent top_table /}}
                    {{/if}}
                </div>
            </div>
            {{#if show_bottom_table}}
                <div class="row" style="margin-top: 24px">
                    <div class="col-xs-12 col-no-padding">
                        {{#renderComponent bottom_table /}}
                    </div>
                </div>
            {{/if}}
        `);

        this.on_click_cell = opts.on_click_cell;
        this.enable_selection = opts.enable_selection;

        const top_table_versions = ['Actual', 'Forecast'];

        const top_table_data = ko.pureComputed(() => {
            const data = this.data();
            if (data) {
                return {
                    ...data,
                    metrics: data.metrics.filter(
                        metric => top_table_versions.indexOf(metric.version_name) > -1,
                    ),
                };
            }
        });

        this.show_top_table = ko.pureComputed(
            () => top_table_data() && top_table_data().metrics.length > 0,
        );

        this.top_table = this.new_instance(GroupedMetrics, {
            enable_selection: this.enable_selection,
            on_click_cell: this.on_click_cell,
            data: top_table_data,
        });

        const bottom_table_data = ko.pureComputed(() => {
            const data = this.data();
            if (!data) {
                return null;
            }

            return {
                ...data,
                metrics: data.metrics.filter(
                    metric => top_table_versions.indexOf(metric.version_name) == -1,
                ),
            };
        });

        this.show_bottom_table = ko.pureComputed(
            () => bottom_table_data() && bottom_table_data().metrics.length > 0,
        );
        this.bottom_table = this.new_instance(GroupedMetrics, {
            enable_selection: this.enable_selection,
            on_click_cell: this.on_click_cell,
            data: bottom_table_data,
        });
    }
}
