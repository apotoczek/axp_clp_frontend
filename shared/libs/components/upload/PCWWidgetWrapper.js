/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import $ from 'jquery';
import pager from 'pager';
import Observer from 'src/libs/Observer';
import DataThing from 'src/libs/DataThing';
import * as Formatters from 'src/libs/Formatters';
import PCWConfirmUpload from 'src/libs/components/upload/PCWConfirmUpload';
import PCWAttachToEntity from 'src/libs/components/upload/PCWAttachToEntity';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import ActionButton from 'src/libs/components/basic/ActionButton';
import InteractiveSheetWidget from 'src/libs/components/upload/InteractiveSheetWidget';
import NewReplaceAppendWidget from 'src/libs/components/upload/NewReplaceAppendWidget';
import ReplaceAppendValuationsWidget from 'src/libs/components/upload/ReplaceAppendValuationsWidget';
import PCWDefineFundWidget from 'src/libs/components/upload/PCWDefineFundWidget';
import PCWDefineEntityName from 'src/libs/components/upload/PCWDefineEntityName';
import AppendReplaceEntityWidget from 'src/libs/components/upload/AppendReplaceEntityWidget';
import PCWSelectTypeWidget from 'src/libs/components/upload/PCWSelectTypeWidget';
import PCWCompletedEntity from 'src/libs/components/upload/PCWCompletedEntity';
import CompleteAppendReplaceWidget from 'src/libs/components/upload/CompleteAppendReplaceWidget';
import PCWCompletedAttach from 'src/libs/components/upload/PCWCompletedAttach';
import PCWCompleteAttached from 'src/libs/components/upload/PCWCompleteAttached';
import PCWSelectMetricsVersion from 'src/libs/components/upload/PCWSelectMetricsVersion';
import PCWConfirmMetricsUpload from 'src/libs/components/upload/PCWConfirmMetricsUpload';
import 'src/libs/bindings/fileupload';
import auth from 'auth';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    let _dfd = self.new_deferred();

    self.define_default_template(`
        <div class="upload-status-wrapper">
            <div class="upload-status-header">
                <span data-bind="text: name"></span>
                <span
                    class="glyphicon glyphicon-remove upload-status-discard"
                    data-bind="click: discard"
                ></span>
                <span
                    class="label-ghost pull-right"
                    data-bind="text:filename, visible: $data.filename"
                ></span>
            </div>
            <!--ko with: widget -->
                <!--ko renderComponent: $data --><!--/ko-->
            <!-- /ko -->
        </div>
    `);

    self.description = ko.observable();
    self.name = ko.observable();
    self.filename = opts.filename;

    self.loading = ko.observable(false);

    self._resolve_spreadsheet_action = DataThing.backends.useractionhandler({
        url: 'resolve_spreadsheet_action',
    });

    self._discard_spreadsheet = DataThing.backends.useractionhandler({
        url: 'discard_spreadsheet',
    });

    self.widget = ko.observable();

    self.set_widget = function(widget_conf) {
        self.init_component(widget_conf, widget => {
            $.when(...widget.dfds).done(() => {
                self.widget(widget);
                Observer.register_for_id(
                    widget.get_id(),
                    'resolve_spreadsheet_action',
                    self.resolve_spreadsheet_action,
                );
                Observer.register_for_id(widget.get_id(), 'discard_spreadsheet', self.discard);
                Observer.register_for_id(widget.get_id(), 'navigating', self.navigating);

                if (widget_conf.action_button_id) {
                    Observer.register_for_id(
                        widget_conf.action_button_id,
                        'ActionButton.action.create_gross_fund',
                        self.create_gross_fund,
                    );
                }

                _dfd.resolve();
            });
        });
    };

    self.resolve_spreadsheet_action = function(data) {
        self._resolve_spreadsheet_action({
            data: data,
            success: DataThing.api.XHRSuccess(self.handle_required_action),
        });
    };

    self.navigating = function(url) {
        Observer.broadcast_for_id(self.get_id(), 'PCWWidgetWrapper.navigating', url);
    };

    self.discard = function() {
        Observer.broadcast_for_id(self.get_id(), 'remove_sheet', self.get_id());

        let widget = self.widget();

        if (widget) {
            let data = widget.data();
            if (data && data.identifier) {
                self._discard_spreadsheet({
                    data: {
                        identifier: data.identifier,
                    },
                    success: DataThing.api.XHRSuccess(() => {}),
                });
            }
        }
    };

    self.broadcast_upload_success = function(data) {
        Observer.broadcast_for_id(self.get_id(), 'PCWWidgetWrapper.upload_success', {
            data: data.data,
            action: data.required_action,
        });
    };

    self.create_gross_fund = () => {
        self._ensure_user_fund = DataThing.backends.useractionhandler({
            url: 'ensure_user_fund',
        });

        self._ensure_user_fund({
            data: {
                cashflow_type: 'gross',
            },
            success: DataThing.api.XHRSuccess(response => {
                let url = Formatters.entity_edit_url({
                    entity_type: 'user_fund',
                    user_fund_uid: response.user_fund.uid,
                    cashflow_type: response.user_fund.cashflow_type,
                });
                self.discard();

                if (url) {
                    Observer.broadcast_for_id(self.get_id(), 'close_modal', true);
                    pager.navigate(url);
                }
            }),
        });
    };

    self.handle_required_action = function(data) {
        self.name(data.name.spacify().titleize());
        if (data.required_action === 'select_columns') {
            self.description('Identify Spreadsheet Contents');
            self.set_widget({
                component: InteractiveSheetWidget,
                sheet: data,
                prompts: data.data.prompts,
                data: data,
            });
        } else if (data.required_action === 'new_or_replace_or_append') {
            self.description('Choose How to Import Data');
            self.set_widget({component: NewReplaceAppendWidget, sheet: data, data: data});
        } else if (data.required_action === 'append_or_replace_valuations') {
            self.description('Choose How to Import Data');
            self.set_widget({
                component: ReplaceAppendValuationsWidget,
                sheet: data,
                data: data,
            });
        } else if (data.required_action === 'define_net_fund') {
            self.description('Define Net Cash Flow Fund');
            self.set_widget({component: PCWDefineFundWidget, sheet: data, data: data});
        } else if (data.required_action === 'define_gross_fund') {
            self.description('Define Gross Cash Flow Fund');
            self.set_widget({component: PCWDefineFundWidget, sheet: data, data: data});
        } else if (data.required_action === 'define_net_portfolio') {
            self.description('Define Net Portfolio');
            self.set_widget({
                component: PCWDefineEntityName,
                sheet: data,
                prompt: 'Please provide a name for your net portfolio',
                data: data,
            });
        } else if (data.required_action === 'define_gross_portfolio') {
            self.description('Define Gross Portfolio');
            self.set_widget({
                component: PCWDefineEntityName,
                sheet: data,
                prompt: 'Please provide a name for your gross portfolio',
                data: data,
            });
        } else if (data.required_action === 'define_portfolio_from_addepar') {
            self.description('Define Addepar Portfolio');
            self.set_widget({
                component: PCWDefineEntityName,
                sheet: data,
                prompt: 'Please provide a name for your addepar portfolio',
                data: data,
            });
        } else if (data.required_action === 'define_index') {
            self.description('Define Index');
            self.set_widget({
                component: PCWDefineEntityName,
                sheet: data,
                prompt: 'Please provide a name for your index',
                data: data,
            });
        } else if (data.required_action === 'replace_net_fund') {
            self.description('Replace Net Cash Flow Fund');
            self.set_widget({
                component: AppendReplaceEntityWidget,
                mode: 'replace',
                cashflow_type: 'net',
                entity_type: 'user_fund',
                sheet: data,
                prompt: 'Please select a net fund to replace',
                data: data,
            });
        } else if (data.required_action === 'replace_gross_fund') {
            self.description('Replace Gross Cash Flow Fund');
            self.set_widget({
                component: AppendReplaceEntityWidget,
                mode: 'replace',
                cashflow_type: 'gross',
                entity_type: 'user_fund',
                sheet: data,
                prompt: 'Please select a gross fund to replace',
                data: data,
            });
        } else if (data.required_action === 'replace_net_portfolio') {
            self.description('Replace Net Portfolio');
            self.set_widget({
                component: AppendReplaceEntityWidget,
                mode: 'replace',
                cashflow_type: 'net',
                entity_type: 'portfolio',
                sheet: data,
                prompt: 'Please select a net portfolio to replace',
                data: data,
            });
        } else if (data.required_action === 'replace_gross_portfolio') {
            self.description('Replace Gross Portfolio');
            self.set_widget({
                component: AppendReplaceEntityWidget,
                mode: 'replace',
                cashflow_type: 'gross',
                entity_type: 'portfolio',
                sheet: data,
                prompt: 'Please select a gross portfolio to replace',
                data: data,
            });
        } else if (data.required_action === 'replace_index') {
            self.description('Replace Index');
            self.set_widget({
                component: AppendReplaceEntityWidget,
                mode: 'replace',
                entity_type: 'index',
                sheet: data,
                prompt: 'Please select an index to replace',
                data: data,
            });
        } else if (data.required_action === 'append_net_fund') {
            self.description('Append Net Cash Flow Fund');
            self.set_widget({
                component: AppendReplaceEntityWidget,
                mode: 'append',
                cashflow_type: 'net',
                entity_type: 'user_fund',
                sheet: data,
                prompt: 'Please select a net fund to append',
                data: data,
            });
        } else if (data.required_action === 'append_gross_fund') {
            self.description('Append Gross Cash Flow Fund');
            self.set_widget({
                component: AppendReplaceEntityWidget,
                mode: 'append',
                cashflow_type: 'gross',
                entity_type: 'user_fund',
                sheet: data,
                prompt: 'Please select a gross fund to append',
                data: data,
            });
        } else if (data.required_action === 'append_net_portfolio') {
            self.description('Append Net Portfolio');
            self.set_widget({
                component: AppendReplaceEntityWidget,
                mode: 'append',
                cashflow_type: 'net',
                entity_type: 'portfolio',
                sheet: data,
                prompt: 'Please select a net portfolio to append',
                data: data,
            });
        } else if (data.required_action === 'append_gross_portfolio') {
            self.description('Append Gross Portfolio');
            self.set_widget({
                component: AppendReplaceEntityWidget,
                mode: 'append',
                cashflow_type: 'gross',
                entity_type: 'portfolio',
                sheet: data,
                prompt: 'Please select a gross portfolio to append',
                data: data,
            });
        } else if (data.required_action === 'append_index') {
            self.description('Append Index');
            self.set_widget({
                component: AppendReplaceEntityWidget,
                mode: 'append',
                entity_type: 'index',
                sheet: data,
                prompt: 'Please select an index to append',
                data: data,
            });
        } else if (data.required_action === 'select_type') {
            self.description('Select Type');
            self.set_widget({component: PCWSelectTypeWidget, sheet: data, data: data});
        } else if (data.required_action === 'complete_define') {
            self.description('Completed');
            self.set_widget({component: PCWCompletedEntity, sheet: data, data: data});
            Observer.broadcast_for_id(self.get_id(), 'created_entity', {
                entity: data.data,
                sheet_id: self.get_id(),
            });
            self.broadcast_upload_success(data);
        } else if (data.required_action === 'complete_append') {
            self.description('Completed');
            self.set_widget({
                component: CompleteAppendReplaceWidget,
                sheet: data,
                mode: 'append',
                data: data,
            });
            self.broadcast_upload_success(data);
        } else if (data.required_action === 'complete_replace') {
            self.description('Completed');
            self.set_widget({
                component: CompleteAppendReplaceWidget,
                sheet: data,
                mode: 'replace',
                data: data,
            });
            self.broadcast_upload_success(data);
        } else if (data.required_action === 'complete_attach') {
            self.description('Completed');
            self.set_widget({component: PCWCompletedAttach, sheet: data, data: data});
            self.broadcast_upload_success(data);
        } else if (data.required_action === 'attach_fund_characteristics') {
            self.description('Attach fund characteristics to portfolio');
            self.set_widget({
                component: PCWAttachToEntity,
                sheet: data,
                uid_property: 'portfolio_uid',
                entity_type: 'portfolio',
                prompt: 'Select portfolio to attach fund characteristics to..',
                data: data,
            });
        } else if (data.required_action === 'attach_company_characteristics') {
            self.description('Attach company characteristics to fund');
            self.set_widget({
                component: PCWAttachToEntity,
                sheet: data,
                uid_property: 'user_fund_uid',
                entity_type: 'user_fund',
                cashflow_type: 'gross',
                prompt: 'Select fund to attach company characteristics to..',
                data: data,
            });
        } else if (data.required_action === 'attach_company_valuations') {
            self.description('Attach company valuations to fund');
            self.set_widget({
                component: PCWAttachToEntity,
                sheet: data,
                uid_property: 'user_fund_uid',
                entity_type: 'user_fund',
                cashflow_type: 'gross',
                prompt: 'Select fund to attach company valuations to..',
                data: data,
            });
        } else if (data.required_action === 'confirm_attributes') {
            self.description('Confirm upload attributes');
            self.set_widget({
                component: PCWConfirmUpload,
                sheet: data,
                data: data,
                body_text: oneLine`
                    You are about to delete all previously assigned
                    attributes and replace them according to the uploaded spreadsheet!
                `,
            });
        } else if (data.required_action === 'select_metric_version') {
            self.description('Select Version');
            self.set_widget({
                component: PCWSelectMetricsVersion,
                sheet: data,
                data: data,
            });
        } else if (data.required_action === 'confirm_metrics') {
            let body_text;
            if (auth.user_has_feature('metric_versions')) {
                body_text = oneLine`
                    You are about to delete all previously assigned metrics from version
                    ${data.metric_version.label} and replace them according to the
                    uploaded spreadsheet!
                `;
            } else {
                body_text = oneLine`
                    You are about to delete all previously assigned metrics and replace
                    them according to the uploaded spreadsheet!
                `;
            }
            self.description('Confirm upload metrics');
            self.set_widget({
                component: PCWConfirmMetricsUpload,
                sheet: data,
                data: data,
                body_text: body_text,
            });
        } else if (data.required_action === 'confirm_replace_company_valuations') {
            self.description('Confirm Replace Valuations');
            self.set_widget({
                component: PCWConfirmUpload,
                sheet: data,
                data: data,
                body_text: oneLine`
                    You are about to delete all previously assigned valuations and
                    replace them according to the uploaded spreadsheet!
                `,
            });
        } else if (data.required_action === 'complete_attributes') {
            self.description('Completed');
            self.set_widget({
                component: PCWCompleteAttached,
                attached_name: 'Attributes',
                sheet: data,
                data: data,
            });
        } else if (data.required_action === 'complete_metrics') {
            self.description('Completed');
            self.set_widget({
                component: PCWCompleteAttached,
                attached_name: 'Metrics',
                sheet: data,
                data: data,
            });
        } else if (data.required_action === 'create_gross_fund') {
            self.description('No Available Gross Funds!');
            data.error_text = data.error;
            data.action_button = self.new_instance(ActionButton, {
                id: 'create_gross_fund',
                action: 'create_gross_fund',
                label: 'Create Gross Fund',
                css: {
                    btn: true,
                    'btn-danger': true,
                    'btn-sm': true,
                    'pull-right': true,
                },
            });
            self.set_widget({
                template: 'tpl_pcw_widget_failed',
                data: data,
                action_button_id: data.action_button.get_id(),
            });
        } else {
            self.description('Invalid Spreadsheet');
            data.error_text =
                data.error ||
                oneLine`
                File is not recognizable as an Excel or CSV file...
            `;
            self.set_widget({template: 'tpl_pcw_widget_failed', data: data});
        }
    };

    return self;
}
