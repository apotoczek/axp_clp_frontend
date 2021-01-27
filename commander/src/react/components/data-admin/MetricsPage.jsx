import React from 'react';

import Button from 'components/basic/forms/Button';
import styled from 'styled-components';
import {Box, Flex} from '@rebass/grid';
import Icon from 'components/basic/Icon';
import CreateMetricForm from 'components/datamanager/CreateMetricForm';

import {is_set} from 'src/libs/Utils';

import ConfirmDropdown from 'src/libs/react/components/basic/forms/dropdowns/ConfirmDropdown';

import {format_options, REPORTING_PERIODS} from 'src/libs/Constants';

import {ModalHeader} from 'components/reporting/shared';
import Modal, {ModalContent} from 'components/basic/Modal';

import DataTable from 'components/basic/DataTable';

import {H1} from 'components/basic/text';

import * as api from 'src/react/api';

import Loader from 'components/basic/Loader';
import {TimeFrame} from 'src/libs/Enums';

const Page = styled(Flex)`
    height: 100%;
`;

const Content = styled(Flex)`
    height: 100%;
    width: 100%;
`;

const VALUE_TYPE = {
    PointInTime: 0,
    Period: 1,
};

function isPointInTime({point_in_time, existing_time_frames}) {
    if (point_in_time) {
        return true;
    }

    if (existing_time_frames && existing_time_frames.length === 1) {
        return existing_time_frames[0] === TimeFrame.PointInTime;
    }

    return false;
}

function NewMetricModal({
    onValueChanged,
    createNewMetric,
    modalKey,
    toggleModal,
    values,
    metricFormatOptions,
    errors,
}) {
    return (
        <Modal isOpen={modalKey == 'new_metric'} openStateChanged={toggleModal}>
            <ModalContent flexDirection='column'>
                <ModalHeader width={1} pb={2} mb={3}>
                    <Box width={2 / 3}>
                        <H1>Create Metric</H1>
                    </Box>
                </ModalHeader>
                <CreateMetricForm
                    onValueChanged={onValueChanged}
                    options={metricFormatOptions}
                    values={values}
                    errors={errors}
                ></CreateMetricForm>
                <Box width={200}>
                    <Button width={1 / 5} primary onClick={createNewMetric}>
                        Create
                    </Button>
                </Box>
            </ModalContent>
        </Modal>
    );
}

export default class MetricsPage extends React.Component {
    state = {
        isLoadingMetrics: false,
        modalKey: null,
        baseMetric: null,
        valueType: 0,
        format: 1,
        name: '',
        reportingPeriods: {},
        selectedMetrics: [],
        baseMetricOptions: [],
        metricsData: null,
        metricsCount: 0,
        errors: {},
    };
    componentDidMount() {
        this.fetchBaseMetrics();
        this.fetchMetrics();
    }

    validate() {
        const errors = {};

        if (!this.state.baseMetric) {
            if (!is_set(this.state.name, true)) {
                errors.name = 'Name is required';
            }
        }

        if (Object.values(this.state.reportingPeriods).filter(v => v).length === 0) {
            errors.reportingPeriods = 'You have to select at least one reporting period';
        }

        return errors;
    }

    createNewMetric = () => {
        const errors = this.validate();
        if (is_set(errors, true)) {
            this.setState({
                errors: errors,
            });
            return;
        }

        const reporting_periods = Object.entries(this.state.reportingPeriods)
            .filter(([_, selected]) => selected)
            .map(([key, _]) => {
                const {timeFrame, frequency} = REPORTING_PERIODS[key];
                return [timeFrame, frequency];
            });
        let data = {};

        if (this.state.baseMetric) {
            const {
                uid: base_metric_uid,
                format,
                name,
                system_metric_type,
            } = this.state.baseMetricOptions.find(b => b.name == this.state.baseMetric);
            if (base_metric_uid) {
                data = {...data, base_metric_uid};
            } else {
                data = {...data, name, format, system_metric_type};
            }
        } else {
            data = {
                name: this.state.name,
                format: this.state.format,
            };
        }

        const res = api
            .callEndpoint('useractionhandler/create_market_data_metric', {
                ...data,
                scope: 'market_data_metric',
                reporting_periods: reporting_periods,
            })
            .then(() => {
                this.setState({
                    modalKey: null,
                    reportingPeriods: [],
                });
                api.dataThing.statusCheck();
            })
            .catch(() => {
                this.setState({
                    modalKey: null,
                    reportingPeriods: [],
                });
            });

        res.expired.then(() => {
            this.fetchBaseMetrics();
            this.fetchMetrics();
        });
    };

    deleteMetrics = () => {
        const res = api
            .callEndpoint('useractionhandler/delete_market_data_metrics', {
                metric_uids: this.state.selectedMetrics,
                scope: 'market_data_metric',
            })
            .then(() => {
                api.dataThing.statusCheck();
            })
            .catch(() => {});

        res.expired.then(() => {
            this.fetchMetrics();
            this.fetchBaseMetrics();
        });
    };

    fetchMetrics = () => {
        this.setState({isLoadingMetrics: true});

        api.callEndpoint('dataprovider/metrics_for_market_data', {scope: 'market_data_metric'})
            .then(response => {
                this.setState({
                    isLoadingMetrics: false,
                    metricsData: response.metrics,
                });
            })
            .catch(() => {
                this.setState({
                    isLoadingMetrics: false,
                    metricsData: [],
                });
            });
    };

    fetchBaseMetrics = () => {
        api.callEndpoint('dataprovider/metric_bases_for_market_data', {
            scope: 'market_data_metric',
        })
            .then(response => {
                const baseMetricOptions = response.base_metrics.map(obj => ({
                    ...obj,
                    value: obj.name,
                    label: obj.name,
                }));
                baseMetricOptions.unshift({
                    value: null,
                    label: 'New Custom Metric',
                    muted: true,
                });
                this.setState({baseMetricOptions: baseMetricOptions});
            })
            .catch(() => {
                this.setState({baseMetricOptions: []});
            });
    };

    handleSelectMetrics = selectedMetrics => {
        this.setState({selectedMetrics: selectedMetrics});
    };

    onValueChanged = (key, value) => {
        const values = this.state;
        const new_values = {...values, [key]: value};

        if (key === 'baseMetric' && value) {
            const base = this.state.baseMetricOptions.find(b => b.name == value);
            new_values['valueType'] = isPointInTime(base)
                ? VALUE_TYPE.PointInTime
                : VALUE_TYPE.Period;
        }
        this.setState({...new_values});
    };

    openNewMetricModal = () => {
        this.setState({
            modalKey: 'new_metric',
            reportingPeriods: [],
        });
    };

    toggleModal = modalKey => () => {
        this.setState(state => ({modalKey: state.modalKey === modalKey ? null : modalKey}));
    };

    render() {
        const {
            modalKey,
            selectedMetrics,
            baseMetricOptions,
            baseMetric,
            valueType,
            format,
            name,
            reportingPeriods,
            metricsData,
            isLoadingMetrics,
            errors,
        } = this.state;

        if (isLoadingMetrics) {
            return (
                <Page>
                    <Loader />
                </Page>
            );
        }

        const values = {
            baseMetric,
            valueType,
            format,
            name,
            reportingPeriods,
        };

        const metricFormatOptions = {
            formats: format_options,
            baseMetrics: baseMetricOptions,
            valueTypes: [
                {value: VALUE_TYPE.PointInTime, label: 'Point In Time'},
                {value: VALUE_TYPE.Period, label: 'Period'},
            ],
            reportingPeriods: Object.entries(REPORTING_PERIODS).map(
                ([value, {label, timeFrame}]) => ({
                    label,
                    value,
                    valueType:
                        timeFrame === TimeFrame.PointInTime
                            ? VALUE_TYPE.PointInTime
                            : VALUE_TYPE.Period,
                }),
            ),
        };

        return (
            <Page>
                <Content flexDirection='column' p={3}>
                    <Flex>
                        <Box flex={1}>
                            <H1>Metrics</H1>
                        </Box>
                        <Button onClick={() => this.openNewMetricModal()} mr={2} primary>
                            <Icon name='plus' left />
                            New Metric
                        </Button>
                        <Box flex='initial'>
                            <ConfirmDropdown
                                onConfirm={this.deleteMetrics}
                                text='Are you sure you want to remove these metrics?'
                                subText='This action can not be undone.'
                                flexx='initial'
                                width='230px'
                            >
                                <Button mr={2} danger disabled={selectedMetrics.length <= 0}>
                                    <Icon name='trash' left />
                                    Delete Selected
                                </Button>
                            </ConfirmDropdown>
                        </Box>
                    </Flex>
                    <DataTable
                        label='Metrics'
                        rows={metricsData || []}
                        columns={[{label: 'Name', key: 'name'}]}
                        enableRowClick
                        resultsPerPage={50}
                        rowKey='uid'
                        enableContextHeader
                        enablePagination
                        paginateInline
                        sortInline
                        enableSelection
                        enableSorting
                        onSelectionChanged={this.handleSelectMetrics}
                    />
                </Content>
                <NewMetricModal
                    onValueChanged={this.onValueChanged}
                    createNewMetric={this.createNewMetric}
                    modalKey={modalKey}
                    toggleModal={this.toggleModal('new_metric')}
                    values={values}
                    errors={errors}
                    metricFormatOptions={metricFormatOptions}
                />
            </Page>
        );
    }
}
