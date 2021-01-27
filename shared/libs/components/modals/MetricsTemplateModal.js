import net from 'bison/net/net';
import BaseModal from 'src/libs/components/basic/BaseModal';
import DataThing from 'src/libs/DataThing';
import EventButton from 'src/libs/components/basic/EventButton';
import EventRegistry from 'src/libs/components/basic/EventRegistry';
import Observer from 'src/libs/Observer';
import config from 'config';

import MetricSelector from 'src/libs/components/reporting/MetricSelector';

class MetricsUploadModal extends BaseModal {
    constructor(opts, components) {
        super(opts, components);
        let _dfd = this.new_deferred();

        this.define_template(`
            <div class="modal fade" tabindex="-1" role="dialog" aria-hidden="true">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <!-- ko with: data -->
                            Generate Template for <span data-bind="text: company_name"></span>
                            <!-- /ko -->
                        </div>
                        <div class="modal-body">
                            <div class="row">
                                <div class="col-xs-12">
                                    <!-- ko renderComponent: metricSelector --><!-- /ko -->
                                    <div class="form-group pull-right">
                                        <!-- ko renderComponent: download_button --><!-- /ko -->
                                        <!-- ko renderComponent: cancel_button --><!-- /ko -->
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `);

        this.events = this.new_instance(EventRegistry, {});
        this.events.resolve_and_add('download_button_click', 'EventButton');
        this.events.resolve_and_add('cancel', 'EventButton');

        this.metricSelector = this.new_instance(MetricSelector, {
            metricIdKey: 'metric_uid',
        });

        this.download_button = this.new_instance(EventButton, {
            id: 'download_template_button',
            label: 'Download Template',
            id_callback: this.events.register_alias('download_button_click'),
            css: {
                'btn-success': true,
                'btn-sm': true,
            },
        });

        this.cancel_button = this.new_instance(EventButton, {
            id: 'cancel_button',
            label: 'Cancel',
            id_callback: this.events.register_alias('cancel'),
            css: {
                'btn-default': true,
                'btn-sm': true,
            },
        });

        this.register_events();
        _dfd.resolve();
    }

    set_defaults(uids) {
        this.metricSelector.setDefaults(uids);
    }

    register_events() {
        Observer.register(this.events.get('cancel'), () => {
            this.reset();
        });

        Observer.register(this.events.get('download_button_click'), () => {
            const items = this.metricSelector.selected();

            this.download_endpoint({
                data: {
                    company_uid: this.data().company_uid,
                    metrics: items.map(i => ({
                        uid: i.uid,
                        time_frame: i.time_frame,
                    })),
                },
                success: DataThing.api.XHRSuccess(key => {
                    DataThing.form_post(config.download_file_base + key);
                    DataThing.status_check();
                    this.reset();
                }),
                error: DataThing.api.XHRError(() => {
                    this.reset();
                }),
            });
        });
    }

    get download_endpoint() {
        // TODO(Pat) this is slop
        let _endpoint = net.api.endpoint({url: `${config.api_base_url}data-collection/`});
        return _endpoint.instance({
            url: 'prepare/metrics',
        });
    }
}

export default MetricsUploadModal;
