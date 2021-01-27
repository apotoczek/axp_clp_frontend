import React, {useContext, useCallback} from 'react';
import {Flex, Box} from '@rebass/grid';

import {DashboardContext} from 'contexts';
import {useBackendData} from 'utils/backendConnect';

import {H3} from 'components/basic/text';

import Loader from 'components/basic/Loader';
import FilterableDropdownList from 'components/basic/forms/dropdowns/FilterableDropdownList';
import DateParameter from 'components/dashboards/component-settings/DateParameter';

export default function ComponentForm({
    _componentProvider,
    onSettingsChanged,
    globalParams,
    provider,
    _layoutData,
}) {
    const dashboard = useContext(DashboardContext);
    const {data: deals, isLoading: isLoadingDeals} = useBackendData(
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
    const dealId = (provider.getDeal(deals) || {}).entity_uid;
    const {
        data: {reporting_components: reportingComponents = []},
        isLoading: isLoadingReportingComponents,
    } = useBackendData(
        'reporting-components/list',
        {deal_uids: dealId ? [dealId] : undefined},
        {requiredParams: ['deal_uids']},
    );

    const asOfDate = provider.getAsOfDate();
    const reportingComponentId = (provider.getReportingComponent(reportingComponents) || {}).uid;

    const onSelectDeal = useCallback(
        dealId => {
            onSettingsChanged('changeEntity', {dealId});
            onSettingsChanged('changeReportingComponent', {reportingComponentId: null});
        },
        [onSettingsChanged],
    );

    const onSelectReportingComponent = useCallback(
        reportingComponentId => {
            onSettingsChanged('changeReportingComponent', {reportingComponentId});
        },
        [onSettingsChanged],
    );

    const onAsOfDateChanged = useCallback(
        asOfDate => onSettingsChanged('changeAsOfDate', {asOfDate}),
        [onSettingsChanged],
    );

    const formattedAsOfDate = provider.getFormattedAsOfDate(globalParams.globalDate);

    const reportingComponentOptions = reportingComponents.sort((left, right) => {
        const leftName = left.name.toLowerCase();
        const rightName = right.name.toLowerCase();
        return leftName < rightName ? -1 : leftName > rightName ? 1 : 0;
    });

    let content;
    if (isLoadingDeals || isLoadingReportingComponents) {
        content = <Loader />;
    } else {
        content = (
            <>
                <Box width={[1, 1, 1, 1, 1, 0.5]} pr={[0, 0, 0, 0, 0, 1]} mb={[2, 2, 2, 2, 2, 0]}>
                    <FilterableDropdownList
                        placeholder='Select an entity'
                        label='Entity'
                        options={deals || []}
                        labelKey='entity_name'
                        valueKey='entity_uid'
                        subLabelKey='entity_type'
                        onValueChanged={onSelectDeal}
                        value={dealId}
                    />
                </Box>
                <Box width={[1, 1, 1, 1, 1, 0.5]} pl={[0, 0, 0, 0, 0, 1]}>
                    <FilterableDropdownList
                        label='Component'
                        placeholder='Select a component'
                        options={reportingComponentOptions}
                        labelKey='name'
                        valueKey='uid'
                        disabled={!dealId}
                        onValueChanged={onSelectReportingComponent}
                        value={reportingComponentId}
                    />
                </Box>
                <Box width={1}>
                    <DateParameter
                        label='As of Date'
                        value={asOfDate}
                        formattedValue={formattedAsOfDate}
                        onValueChanged={onAsOfDateChanged}
                    />
                </Box>
            </>
        );
    }

    return (
        <Flex flex='1 1 auto' flexDirection='column' p={16}>
            <H3>Configuration</H3>
            <Flex flexWrap='wrap'>{content}</Flex>
        </Flex>
    );
}
