/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import BaseModal from 'src/libs/components/basic/BaseModal';
import DataTable from 'src/libs/components/basic/DataTable';
import DataThing from 'src/libs/DataThing';

export default class MergeMetricsModal extends BaseModal {
    constructor(opts, components) {
        super(opts, components);

        this.define_template(`
            <div class="modal fade" tabindex="-1" role="dialog" aria-hidden="true">
                <div class="modal-dialog modal-md">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h4>Consolidate Metric Sets</h4>
                        </div>
                        <div class="modal-body" data-bind="style: body_style">
                            <p class="lead">
                                Select the metric you want to consolidate and move the sets of all the listed metrics to.
                            </p>
                           <!-- ko renderComponent: table --><!-- /ko -->
                        </div>
                        <div class="modal-footer">
                            <button type="submit" class="btn btn-danger" data-bind="click: submit, enable: can_submit">
                                <!-- ko if: merging -->
                                    <span class="glyphicon glyphicon-cog animate-spin"></span>
                                    Consolidating...
                                <!-- /ko -->
                                <!-- ko ifnot: merging -->
                                    Consolidate Sets
                                <!-- /ko -->
                            </button>
                            <button type="button" class="btn btn-default" data-bind="click: reset, disable: merging">Cancel</button>
                        </div>
                    </div>
                </div>
            </div>
        `);

        this.merging = ko.observable(false);

        this.body_style = ko.pureComputed(() =>
            this.merging() ? {'point-events': 'none', opacity: 0.5} : {},
        );

        this.table = this.new_instance(DataTable, {
            inline_data: true,
            css: 'table-light table-sm',
            data: this.data,
            enable_selection: true,
            radio_selection: true,
            columns: [
                {
                    label: 'Name',
                    key: 'name',
                },
            ],
        });

        this.can_submit = ko.pureComputed(() => {
            return !this.merging() && this.table.has_selected();
        });

        this.endpoints = {
            consolidate_metric_sets: DataThing.backends.useractionhandler({
                url: 'consolidate_metric_sets',
            }),
        };
    }

    submit() {
        const target = this.table.selected()[0];

        const sources = this.data().filter(c => c.uid !== target.uid);

        this.merging(true);

        this.endpoints.consolidate_metric_sets({
            data: {
                target_metric_uid: target.uid,
                source_metric_uids: sources.map(c => c.uid),
            },
            success: DataThing.api.XHRSuccess(() => {
                DataThing.status_check();
                this.reset();
                this.merging(false);
            }),
        });
    }
}
