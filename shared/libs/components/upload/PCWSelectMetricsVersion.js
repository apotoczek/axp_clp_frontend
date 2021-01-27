import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import NewDropdown from 'src/libs/components/basic/NewDropdown';
import Observer from 'src/libs/Observer';

class PCWSelectMetricsVersion extends BaseComponent {
    constructor(opts = {}, components = {}) {
        super(opts, components);
        this.define_default_template(`
        <div class="upload-status upload-status-warning">
        <div class="row">
            <table class="callout-table callout-warning">
                <tr>
                    <td class="callout-icon">
                        <span class="icon-attention-1">
                    </td>
                    <td>
                        <table class="new-world-form" style="table-layout: fixed; width: 50%;">
                            <tr>
                                <td>
                                    <!-- ko renderComponent: types --><!-- /ko -->
                                </td>
                            </tr>
                            <tr>
                                <table style="width: 100%;">
                                    <tr>
                                        <td>
                                            <p class="lead">
                                                Select metric version to continue.
                                            </p>
                                        </td>
                                        <td>
                                            <button class="btn btn-confirm btn-sm pull-right" data-bind="click: finish, disable: loading">
                                                Continue
                                                <span class="glyphicon glyphicon-ok pull-left"></span>
                                            </button>
                                        </td>
                                    </tr>
                                </table>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </div>
        </div>
        `);

        this.sheet = opts.sheet;
        this.options = this.sheet.data;
        const selected_index = () => {
            return this.options
                .map(option => {
                    return option.label;
                })
                .indexOf(this.sheet.name);
        };

        this.types = this.new_instance(NewDropdown, {
            label: 'Sheet Type',
            default_selected_index: selected_index(),
            btn_css: {'btn-ghost-info': true, 'btn-sm': true},
            label_key: 'label',
            value_key: 'value',
            datasource: {
                type: 'static',
                data: this.options,
            },
        });

        this.loading = ko.observable(false);
    }

    finish = () => {
        if (this.types.selected()) {
            this.loading(true);
            const data = {
                identifier: this.sheet.identifier,
                action: 'select_metric_version',
                data: this.types.selected(),
            };
            Observer.broadcast_for_id(this.get_id(), 'resolve_spreadsheet_action', data);
        }
    };
}
export default PCWSelectMetricsVersion;
