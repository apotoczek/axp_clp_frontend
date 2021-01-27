/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import BaseModal from 'src/libs/components/basic/BaseModal';
import DataThing from 'src/libs/DataThing';

import 'src/libs/bindings/react';
import EditMetricForm from 'components/datamanager/EditMetricForm';
import bison from 'bison';

import {TimeFrame, ValueType, Format} from 'src/libs/Enums';
import {format_options} from 'src/libs/Constants';
import {REPORTING_PERIODS} from 'src/libs/Constants';

export default class EditMetricModal extends BaseModal {
    constructor(opts, components) {
        super(opts, components);

        let _dfd = this.new_deferred();

        this.define_template(`
            <div class="modal fade" tabindex="-1" role="dialog" aria-hidden="true">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h4>Edit Metric</h4>
                        </div>
                        <div class="modal-body" data-bind="renderReactComponent: EditMetricForm, props: props">
                        </div>
                        <div class="modal-footer">
                            <button class="btn btn-success" data-bind="click:save">Save</button>
                            <button class="btn btn-ghost-default" data-bind="click:cancel">Cancel</button>
                        </div>
                    </div>
                </div>
            </div>
        `);

        this.endpoints = {
            update_metric: DataThing.backends.useractionhandler({
                url: 'update_metric',
            }),
        };

        this.EditMetricForm = EditMetricForm;
        this.default_state = {
            uid: null,
            values: {
                valueType: ValueType.Period,
                reportingPeriod: 'monthly',
                name: '',
                format: Format.Money,
            },
        };

        this.state = ko.observable(this.default_state);

        this.props = ko.pureComputed(() => {
            const {values} = this.state();

            return {
                onValueChanged: (key, value) => {
                    const {values} = this.state();
                    const new_values = {...values, [key]: value};

                    if (key === 'valueType' && value != values.valueType) {
                        new_values.reportingPeriod =
                            REPORTING_PERIODS[values.reportingPeriod].convertTo;
                    }

                    this.state({...this.state(), values: new_values});
                },
                values,
                options: {
                    formats: format_options,
                    valueTypes: [
                        {value: ValueType.Period, label: 'Period'},
                        {value: ValueType.PointInTime, label: 'Point In Time'},
                    ],
                    reportingPeriods: Object.entries(REPORTING_PERIODS).map(
                        ([value, {label, timeFrame}]) => ({
                            label,
                            value,
                            valueType:
                                timeFrame === TimeFrame.PointInTime
                                    ? ValueType.PointInTime
                                    : ValueType.Period,
                        }),
                    ),
                },
            };
        });

        _dfd.resolve();
    }

    save() {
        const {uid, values} = this.state();

        const {timeFrame, frequency} = REPORTING_PERIODS[values.reportingPeriod];

        this.endpoints.update_metric({
            data: {
                uid: uid,
                time_frame: timeFrame,
                format: values.format,
                frequency: frequency,
            },
            success: DataThing.api.XHRSuccess(() => {
                this.reset();
                DataThing.status_check();
            }),
            error: DataThing.api.XHRError(() => {}),
        });
    }

    show_and_populate = data => {
        const period = Object.entries(REPORTING_PERIODS).find(([_, {timeFrame, frequency}]) => {
            return frequency == data.frequency && timeFrame == data.time_frame;
        });

        this.state({
            uid: data.uid,
            values: {
                name: data.base_metric_name,
                reportingPeriod: period[0],
                format: data.format,
                valueType:
                    period[1].timeFrame === TimeFrame.PointInTime
                        ? ValueType.PointInTime
                        : ValueType.Period,
            },
        });

        this.show();
    };

    reset = () => {
        bison.helpers.close_modal(this.get_id());
        this.state(this.default_state);
    };

    cancel() {
        this.reset();
    }
}
