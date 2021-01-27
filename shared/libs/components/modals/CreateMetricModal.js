/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import BaseModal from 'src/libs/components/basic/BaseModal';
import DataThing from 'src/libs/DataThing';

import auth from 'auth';
import 'src/libs/bindings/react';
import CreateMetricForm from 'components/datamanager/CreateMetricForm';
import {format_options, REPORTING_PERIODS} from 'src/libs/Constants';
import DataSource from 'src/libs/DataSource';
import {is_set} from 'src/libs/Utils';
import bison from 'bison';
import {TimeFrame, ValueType} from 'src/libs/Enums';

const is_point_in_time = ({point_in_time, existing_time_frames}) => {
    if (point_in_time) {
        return true;
    }

    if (existing_time_frames && existing_time_frames.length === 1) {
        return existing_time_frames[0] === TimeFrame.PointInTime;
    }

    return false;
};

export default class CreateMetricModal extends BaseModal {
    constructor(opts, components) {
        super(opts, components);

        let _dfd = this.new_deferred();

        this.define_template(`
            <div class="modal fade" tabindex="-1" role="dialog" aria-hidden="true">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h4>Create Metric</h4>
                        </div>
                        <div class="modal-body" data-bind="renderReactComponent: CreateMetricForm, props: props">
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
            create_metrics: DataThing.backends.useractionhandler({
                url: 'create_metrics',
            }),
        };

        this.metric_bases = this.new_instance(DataSource, {
            datasource: {
                type: 'dynamic',
                query: {
                    target: 'metric_bases_for_client',
                },
            },
        });

        this.CreateMetricForm = CreateMetricForm;
        this.default_state = {
            errors: {},
            values: {
                baseMetric: null,
                valueType: 0,
                format: 1,
                name: '',
                reportingPeriods: {},
            },
        };

        this.state = ko.observable(this.default_state);

        this.props = ko.pureComputed(() => {
            const bases = this.metric_bases.data() || [];
            const {values, errors} = this.state();

            const baseMetrics = [...bases.map(b => ({...b, value: b.name, label: b.name}))];

            if (auth.user_has_feature('custom_metrics')) {
                baseMetrics.unshift({
                    value: null,
                    label: 'New Custom Metric',
                    muted: true,
                });
            } else {
                if (!values.baseMetric) {
                    values.baseMetric = baseMetrics[0].value;
                }
            }
            return {
                onValueChanged: (key, value) => {
                    const {values} = this.state();
                    const new_values = {...values, [key]: value};

                    if (key === 'baseMetric' && value) {
                        const base = bases.find(b => b.name == value);
                        new_values['valueType'] = is_point_in_time(base)
                            ? ValueType.PointInTime
                            : ValueType.Period;
                    }

                    this.state({...this.state(), values: new_values});
                },
                values,
                errors,
                options: {
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
                    formats: format_options,
                    baseMetrics,
                },
            };
        });

        _dfd.resolve();
    }

    validate(values) {
        const errors = {};

        if (!values.baseMetric) {
            if (!is_set(values.name, true)) {
                errors.name = 'Name is required';
            }
        }

        if (Object.values(values.reportingPeriods).filter(v => v).length === 0) {
            errors.reportingPeriods = 'You have to select at least one reporting period';
        }

        return errors;
    }

    save() {
        const bases = this.metric_bases.data() || [];

        const {values} = this.state();

        const errors = this.validate(values);

        if (is_set(errors, true)) {
            this.state({...this.state(), errors});
            return;
        }

        const reporting_periods = Object.entries(values.reportingPeriods)
            .filter(([_, selected]) => selected)
            .map(([key, _]) => {
                const {timeFrame, frequency} = REPORTING_PERIODS[key];

                return [timeFrame, frequency];
            });

        let data = {reporting_periods};

        if (values.baseMetric) {
            const {base_metric_uid, format, name, system_metric_type} = bases.find(
                b => b.name == values.baseMetric,
            );

            if (base_metric_uid) {
                data = {...data, base_metric_uid};
            } else {
                data = {...data, name, format, system_metric_type};
            }
        } else {
            const {format, name} = values;
            data = {...data, name, format};
        }

        this.endpoints.create_metrics({
            data: data,
            success: DataThing.api.XHRSuccess(() => {
                this.reset();
                DataThing.status_check();
            }),
            error: DataThing.api.XHRError(() => {}),
        });
    }

    reset = () => {
        bison.helpers.close_modal(this.get_id());
        this.state(this.default_state);
    };

    cancel() {
        this.reset();
    }
}
