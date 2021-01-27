import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import Observer from 'src/libs/Observer';

class PCWConfirmMetricsUpload extends BaseComponent {
    constructor(opts = {}, components = {}) {
        super(opts, components);

        this.body_text = opts.body_text;

        this.define_default_template(`
            <div class="upload-status upload-status-warning">
                <!--ko if: loading -->
                    <!-- ko template: {
                        name: 'tpl_pcw_crunching_numbers',
                        data: {
                            callout_css: 'callout-warning'
                        },
                    } --><!-- /ko -->
                <!-- /ko -->
                <!-- ko ifnot:loading -->
                <div class="row">
                    <table class="callout-table callout-warning">
                        <tr>
                            <td class="callout-icon">
                                <span class="icon-attention-1">
                            </td>
                            <td>
                                <table style="width: 100%;">
                                    <tr>
                                        <td data-bind="text: body_text">

                                        <td>
                                        <td>
                                            <button class="btn btn-confirm btn-sm pull-right" data-bind="click: finish, disable: loading()">
                                                Finish
                                                <span class="glyphicon glyphicon-ok pull-left" style="color:#fff;"></span>
                                            </button>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                </div>
                <!-- /ko -->
            </div>
        `);

        const _dfd = this.new_deferred();

        this.sheet = opts.sheet;
        this.loading = ko.observable(false);

        this.finish = () => {
            this.loading(true);
            let data = {
                identifier: this.sheet.identifier,
                action: this.sheet.required_action,
                data: this.sheet.metric_version,
            };
            Observer.broadcast_for_id(this.get_id(), 'resolve_spreadsheet_action', data);
        };
        _dfd.resolve();
    }
}
export default PCWConfirmMetricsUpload;
