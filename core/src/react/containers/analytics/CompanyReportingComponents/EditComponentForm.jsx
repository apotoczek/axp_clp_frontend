import React, {useState, useCallback, useEffect, useMemo} from 'react';
import {Link, useParams, useHistory} from 'react-router-dom';
import {Flex, Box} from '@rebass/grid';
import styled, {css} from 'styled-components';

import {useBackendEndpoint, useBackendData} from 'utils/backendConnect';
import {is_set} from 'src/libs/Utils';
import * as Formatters from 'utils/formatters';
import {AccessLevel} from 'src/libs/Enums';

import Loader from 'components/basic/Loader';
import {Content} from 'components/layout';
import Toolbar, {ToolbarItem} from 'components/basic/Toolbar';
import {H1, H3, Description} from 'components/basic/text';
import Icon from 'components/basic/Icon';
import TextInput from 'components/basic/forms/input/TextInput';
import DropdownList from 'components/basic/forms/dropdowns/DropdownList';
import TextDropdown from 'components/basic/forms/dropdowns/TextDropdown';
import TabbedView, {Tab} from 'components/TabbedView';

import TextBlock from 'components/dashboards/TextBlock';
import TextBlockProvider from 'components/dashboards/TextBlock/provider';
import TextBlockToolbar from 'components/dashboards/TextBlock/Toolbar';

import {NavigationHelper} from './helpers';

const MaybeLocked = styled(Flex)`
    ${props =>
        props.locked &&
        css`
            opacity: 0.5;
            pointer-events: none;
        `};
`;

const Tabs = {
    CURRENT_VERSION: 0,
    PREVIOUS_VERSION: 1,
};

const COMPONENT_DESCRIPTION = oneLine`
    This is a previous version of the current
    component which cannot be changed.
`;

function PreviousVersionTab({name, onSelectVersion, versionTimestamps}) {
    return (
        <DropdownList
            small
            label={name}
            onValueChanged={onSelectVersion}
            options={versionTimestamps.map((timestamp, idx) => ({
                key: timestamp,
                value: idx + 1,
                label: Formatters.backend_datetime(timestamp),
            }))}
            noOptionsLabel='No previous edits available'
        />
    );
}

function Form({
    name,
    asOfDate,
    componentData,
    instanceId,
    companyId,
    versionTimestamps,
    existingInstances = [],
    onComponentAsOfDateChanged,
    onComponentSettingsChanged,
    onVersionChanged = () => {},
    oldVersion,
}) {
    // Create spec handler and provider. Memoized so that they are only generated
    // when data has been updated and they need to be re-generated.
    const dataProvider = useMemo(() => new TextBlockProvider(componentData), [componentData]);
    const [sharedState, setSharedState] = useState();

    const tabChanged = useCallback(
        tabId => {
            if (tabId === Tabs.PREVIOUS_VERSION) {
                return;
            }

            onVersionChanged(null);
        },
        [onVersionChanged],
    );

    const handleSharedStateChange = useCallback((componentId, data) => setSharedState(data), []);

    const selectOldVersion = useCallback(versionIdx => onVersionChanged(versionIdx), [
        onVersionChanged,
    ]);

    const asOfDateOptions = existingInstances.map(instance => ({
        instance_uid: instance.uid,
        value: instance.as_of_date,
        label: Formatters.backend_date(instance.as_of_date),
    }));

    return (
        <Flex flexDirection='column' p={16}>
            <Box mb={32}>
                <H1>Edit Reporting Component</H1>
            </Box>
            <Box flexDirection='column' mb={32}>
                <H3>Reporting Component</H3>
                <Description>
                    You can make edits to a different as of date by changing it below. Want to add a
                    new as of date?
                    <Link to={NavigationHelper.newReportingComponentLink(companyId)}>
                        {' '}
                        Click here{' '}
                    </Link>
                    to create a new reporting component.
                </Description>
                <Flex mt={2}>
                    <Box flex='1 1 auto' mr={2}>
                        <TextInput leftLabel='Name' value={name} disabled />
                    </Box>
                    <Box flex='1 1 auto'>
                        <DropdownList
                            leftLabel='As of Date'
                            manualValue={Formatters.backend_date(asOfDate)}
                            options={asOfDateOptions}
                            onValueChanged={onComponentAsOfDateChanged}
                            broadcastFullOption
                        />
                    </Box>
                </Flex>
            </Box>
            <Flex flexDirection='column'>
                <Flex>
                    <H3>Content</H3>
                    {oldVersion ? (
                        <Box ml={2}>
                            <TextDropdown content={COMPONENT_DESCRIPTION}>
                                <Icon name='lock' glyphicon />
                            </TextDropdown>
                        </Box>
                    ) : null}
                </Flex>
                <MaybeLocked mb={2} alignSelf='flex-start' locked={!!oldVersion}>
                    <TextBlockToolbar
                        instanceId={instanceId}
                        dataProvider={dataProvider}
                        onSpecHandlerAction={onComponentSettingsChanged}
                        sharedState={sharedState}
                        disableVariables
                    />
                </MaybeLocked>
                <TabbedView
                    onTabChanged={tabChanged}
                    activeTab={oldVersion ? Tabs.PREVIOUS_VERSION : Tabs.CURRENT_VERSION}
                >
                    <Tab name='Current Edit' id={Tabs.CURRENT_VERSION}>
                        <MaybeLocked flex='1 1 auto' flexDirection='column' locked={!!oldVersion}>
                            <TextBlock
                                instanceId={instanceId}
                                dataProvider={dataProvider}
                                placeholder='Start writing free text...'
                                onSpecHandlerAction={onComponentSettingsChanged}
                                debounceValueChange={false}
                                isEditing
                                isSelected
                                showToolbar
                                onSharedStateChange={handleSharedStateChange}
                            />
                        </MaybeLocked>
                    </Tab>
                    <Tab
                        id={Tabs.PREVIOUS_VERSION}
                        headerChildren={
                            <PreviousVersionTab
                                name='Previous Edits'
                                onSelectVersion={selectOldVersion}
                                versionTimestamps={versionTimestamps}
                            />
                        }
                    >
                        <MaybeLocked flex='1 1 auto' flexDirection='column' locked={!!oldVersion}>
                            <TextBlock
                                instanceId={instanceId}
                                dataProvider={dataProvider}
                                onSpecHandlerAction={onComponentSettingsChanged}
                                isEditing={false}
                                isSelected
                                showToolbar={false}
                            />
                        </MaybeLocked>
                    </Tab>
                </TabbedView>
            </Flex>
        </Flex>
    );
}

function PageToolbar({companyId, onSave, oldVersion}) {
    return (
        <Toolbar>
            <ToolbarItem to={NavigationHelper.companyReportingComponentsLink(companyId)} right>
                Cancel
            </ToolbarItem>
            <ToolbarItem icon='save' glyphicon right onClick={onSave} disabled={!!oldVersion}>
                Save Reporting Component
            </ToolbarItem>
        </Toolbar>
    );
}

export default function EditComponentForm() {
    const {companyId, instanceId} = useParams();
    const history = useHistory();

    const [asOfDate, setAsOfDate] = useState(null);
    const [name, setName] = useState('');
    const [oldVersion, setOldVersion] = useState(null);
    const [dataSpec, setDataSpec] = useState({});
    const [layoutData, setLayoutData] = useState({});
    const [componentData, setComponentData] = useState({});

    const {
        data: {reporting_component_instance: reportingComponentInstance = {}},
        isLoading: isLoadingComponent,
    } = useBackendData(
        'reporting-components/instance/get',
        {uid: instanceId},
        {requiredParams: ['uid']},
    );

    const {
        data: {reporting_component_instances: reportingComponentInstances = []},
        isLoading: isLoadingInstances,
    } = useBackendData(
        'reporting-components/instance/list',
        {
            reporting_component_uids: reportingComponentInstance.reporting_component && [
                reportingComponentInstance.reporting_component.uid,
            ],
            with_access: AccessLevel.Read,
        },
        {requiredParams: ['reporting_component_uids']},
    );

    const {triggerEndpoint: saveComponent, isLoading: isSavingComponent} = useBackendEndpoint(
        'reporting-components/instance/update',
    );

    // If the data from the backend updates, we set that data as the current state.
    // Note that the backend data only updates if the component id changes.
    useEffect(() => {
        if (!is_set(reportingComponentInstance, true)) {
            return;
        }

        setName(reportingComponentInstance.reporting_component.name);
        setAsOfDate(reportingComponentInstance.as_of_date);
        setDataSpec(reportingComponentInstance.data_spec);
        setLayoutData(reportingComponentInstance.layout_data);
        setComponentData(reportingComponentInstance.component_data);
    }, [reportingComponentInstance]);

    // When any setting is being changed, we call the appropriate spec handler function,
    // update the specs, and save the component to the backend.
    const onComponentSettingsChanged = useCallback(
        (actionFn, payload) => {
            const {
                dataSpec: updatedDataSpec,
                layoutData: updatedLayoutData,
                componentData: updatedComponentData,
            } = actionFn(payload, dataSpec, componentData, layoutData);

            setDataSpec(updatedDataSpec);
            setLayoutData(updatedLayoutData);
            setComponentData(updatedComponentData);
        },
        [componentData, dataSpec, layoutData],
    );

    const onVersionChanged = useCallback(
        versionIdx => {
            setOldVersion(versionIdx);

            const rcVersion = reportingComponentInstance.versions[versionIdx || 0];
            setDataSpec(rcVersion.data_spec);
            setLayoutData(rcVersion.layout_data);
            setComponentData(rcVersion.component_data);
        },
        [reportingComponentInstance],
    );

    const onChangeAsOfDate = useCallback(
        option => {
            history.push(
                NavigationHelper.editReportingComponentLink(companyId, option.instance_uid),
            );
        },
        [companyId, history],
    );

    const onSave = useCallback(() => {
        saveComponent({
            uid: instanceId,
            data_spec: dataSpec,
            layout_data: layoutData,
            component_data: componentData,
        }).then(() => {
            history.push(NavigationHelper.companyReportingComponentsLink(companyId));
        });
    }, [companyId, componentData, instanceId, dataSpec, history, layoutData, saveComponent]);

    const versionTimestamps = (reportingComponentInstance.versions || [])
        .slice(1)
        .map(version => version.created);

    return (
        <Content>
            <PageToolbar companyId={companyId} onSave={onSave} oldVersion={oldVersion} />
            {isSavingComponent || isLoadingComponent || isLoadingInstances ? (
                <Loader />
            ) : (
                <Form
                    companyId={companyId}
                    instanceId={instanceId}
                    dataSpec={dataSpec}
                    layoutData={layoutData}
                    componentData={componentData}
                    asOfDate={asOfDate}
                    name={name}
                    onComponentAsOfDateChanged={onChangeAsOfDate}
                    onComponentSettingsChanged={onComponentSettingsChanged}
                    onVersionChanged={onVersionChanged}
                    existingInstances={reportingComponentInstances}
                    onSave={onSave}
                    versionTimestamps={versionTimestamps}
                    isLoading={isSavingComponent || isLoadingComponent}
                    oldVersion={oldVersion}
                />
            )}
        </Content>
    );
}
