import React, {useContext, useMemo, useCallback} from 'react';
import styled from 'styled-components';
import {Flex, Box} from '@rebass/grid';

import {DashboardContext} from 'contexts';
import {useBackendData} from 'utils/backendConnect';
import {useFormState} from 'utils/hooks';
import {dateSelectionTimestamp, formattedDateSelectionValue} from 'src/helpers/dashboards';
import {DateOffsetType, DateParamType} from 'src/libs/Enums';
import {is_set} from 'src/libs/Utils';

import {H1, H2, H3, H4, Description} from 'components/basic/text';

import TextBlockProvider from 'components/dashboards/TextBlock/provider';

import Button from 'components/basic/forms/Button';
import DashboardComponent from 'components/dashboards/DashboardComponent';
import FilterableDropdownList from 'components/basic/forms/dropdowns/FilterableDropdownList';
import DateParameter from 'components/dashboards/component-settings/DateParameter';
import Loader from 'components/basic/Loader';

import dashboardComponents from 'libs/dashboard-components';
import DashboardLayout from 'libs/multi-page-dashboard-layout';

const PreviewWrapper = styled.div`
    background: #ffffff;
`;

const layoutEngine = new DashboardLayout();

export default function ComponentForm({onConfirm, onCancel}) {
    const dashboard = useContext(DashboardContext);
    const [formState, formErrors, setFormState, triggerFormValidation] = useFormState({
        dealId: {
            initialValue: null,
            validator: dealId => (dealId ? null : 'You must select a deal'),
        },
        reportingComponentId: {
            initialValue: null,
            validator: reportingComponentId =>
                reportingComponentId ? null : 'You must select a reporting component',
        },
        asOfDate: {
            initialValue: {
                type: DateParamType.RELATIVE,
                dateOffsetType: DateOffsetType.OnDate,
            },
            validator: asOfDate => (asOfDate ? null : 'You must select an as of date'),
        },
    });
    const {data: entities} = useBackendData(
        'dataprovider/dashboards/entities',
        {
            dashboard_uid: dashboard.uid,
            entities: dashboard.settings.dashboard.baseEntities.map(entity_uid => ({entity_uid})),
            entity_types: ['deal'],
        },
        {
            initialData: [],
        },
    );
    const {
        data: {reporting_components: reportingComponents = []},
    } = useBackendData(
        'reporting-components/list',
        {deal_uids: formState.dealId ? [formState.dealId] : undefined},
        {requiredParams: ['deal_uids']},
    );
    const {
        data: {reporting_component_instance: rcInstance = {}},
        error: reportingComponentInstanceError,
        isLoading: isLoadingReportingComponentInstance,
    } = useBackendData(
        'reporting-components/instance/get',
        {
            reporting_component_uid: formState.reportingComponentId,
            as_of_date: dateSelectionTimestamp(
                formState.asOfDate,
                dashboard.settings.dashboard.globalDate,
            ),
            deal_uid: formState.dealId,
        },
        {
            requiredParams: ['reporting_component_uid', 'as_of_date', 'deal_uid'],
        },
    );

    const onClickAddComponent = useCallback(() => {
        if (triggerFormValidation()) {
            onConfirm({
                dataSpec: rcInstance.data_spec,
                layoutData: rcInstance.layout_data,
                componentData: {
                    ...rcInstance.component_data,
                    base: {
                        reportingComponentId: formState.reportingComponentId,
                        entity: {type: 'deal', uid: formState.dealId},
                        asOfDate: formState.asOfDate,
                    },
                },
            });
        }
    }, [
        formState.asOfDate,
        formState.dealId,
        formState.reportingComponentId,
        onConfirm,
        rcInstance,
        triggerFormValidation,
    ]);

    const onSelectDeal = useCallback(
        dealId => {
            setFormState('dealId')(dealId);
            setFormState('reportingComponentId')(null);
        },
        [setFormState],
    );

    const onSelectReportingComponent = useCallback(
        reportingComponentId => setFormState('reportingComponentId')(reportingComponentId),
        [setFormState],
    );

    const onAsOfDateChanged = useCallback(asOfDate => setFormState('asOfDate')(asOfDate), [
        setFormState,
    ]);

    const foundValidReportingComponentInstance =
        !isLoadingReportingComponentInstance &&
        !reportingComponentInstanceError &&
        is_set(rcInstance, true);
    const dataProvider = useMemo(() => {
        if (!foundValidReportingComponentInstance) {
            return null;
        }

        // TODO(Simon 2 Oct 2019): This is temporary. We are moving away from Redux.
        // Once all the providers have been migrated away from Redux, we can take
        // this from `libs/dashboard-domponents.js` as per usual.
        const Provider = {
            textBlock: TextBlockProvider,
        }[rcInstance.component_type];

        if (!Provider) {
            return null;
        }

        return new Provider(rcInstance.component_data);
    }, [foundValidReportingComponentInstance, rcInstance]);

    const formattedAsOfDate = formattedDateSelectionValue(
        formState.asOfDate,
        dashboard.settings.dashboard.globalDate,
        '{M}/{d}/{yy}',
    );

    const reportingComponentOptions = reportingComponents.sort((left, right) => {
        const leftName = left.name.toLowerCase();
        const rightName = right.name.toLowerCase();
        return leftName < rightName ? -1 : leftName > rightName ? 1 : 0;
    });

    return (
        <Flex flex='1 1 auto' flexDirection='column' p={16}>
            <Box mb={32}>
                <H1>New Reporting Component</H1>
                <Description>
                    Reporting Components are used to pull in components that have been
                    pre-configured for specific companies. Select the appropriate company below, and
                    see how a component gets automatically pulled in.
                </Description>
            </Box>
            <Box mb={32}>
                <H3>Configuration</H3>
                <Flex flexWrap='wrap'>
                    <Box
                        width={[1, 1, 1, 1, 1, 0.5]}
                        pr={[0, 0, 0, 0, 0, 1]}
                        mb={[2, 2, 2, 2, 2, 0]}
                    >
                        <FilterableDropdownList
                            placeholder='Select an entity'
                            label='Entity'
                            options={entities || []}
                            labelKey='entity_name'
                            valueKey='entity_uid'
                            subLabelKey='entity_type'
                            onValueChanged={onSelectDeal}
                            value={formState.dealId}
                            error={formErrors.dealId}
                        />
                    </Box>
                    <Box width={[1, 1, 1, 1, 1, 0.5]} pl={[0, 0, 0, 0, 0, 1]}>
                        <FilterableDropdownList
                            label='Component'
                            placeholder='Select a component'
                            options={reportingComponentOptions}
                            labelKey='name'
                            valueKey='uid'
                            disabled={!formState.dealId}
                            onValueChanged={onSelectReportingComponent}
                            value={formState.reportingComponentId}
                            error={formErrors.reportingComponentId}
                        />
                    </Box>
                    <Box width={1} mt={2}>
                        <DateParameter
                            label='As of Date'
                            value={formState.asOfDate}
                            formattedValue={formattedAsOfDate}
                            onValueChanged={onAsOfDateChanged}
                        />
                    </Box>
                </Flex>
            </Box>
            <Flex flex='1 1 auto' mb={32} flexDirection='column'>
                <H3>Component Preview</H3>
                {foundValidReportingComponentInstance ? (
                    <PreviewWrapper>
                        <DashboardComponent
                            componentSpec={dashboardComponents[rcInstance.component_type]}
                            dataProvider={dataProvider}
                            height={layoutEngine.innerHeight(rcInstance.layout_data.h)}
                            width={layoutEngine.innerWidth(rcInstance.layout_data.w)}
                            {...rcInstance.component_data}
                        />
                    </PreviewWrapper>
                ) : (
                    <Flex
                        flexDirection='column'
                        justifyContent='center'
                        alignItems='center'
                        flex={1}
                    >
                        <H2>There is no component available.</H2>
                        <H4>Please change parameters.</H4>
                    </Flex>
                )}
                {isLoadingReportingComponentInstance && (
                    <Flex
                        flexDirection='column'
                        justifyContent='center'
                        alignItems='center'
                        flex={1}
                    >
                        <Loader />
                    </Flex>
                )}
            </Flex>
            <Flex alignSelf='flex-end'>
                <Button onClick={onCancel} mr={1}>
                    Cancel
                </Button>
                <Button
                    primary
                    onClick={onClickAddComponent}
                    disabled={!foundValidReportingComponentInstance}
                >
                    Add Component
                </Button>
            </Flex>
        </Flex>
    );
}
