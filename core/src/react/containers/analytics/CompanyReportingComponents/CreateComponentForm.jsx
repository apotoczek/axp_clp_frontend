import React, {useState, useCallback, useMemo, useContext} from 'react';
import {Redirect} from 'react-router-dom';
import {Flex, Box} from '@rebass/grid';
import styled from 'styled-components';

import {useBackendEndpoint, useBackendData} from 'utils/backendConnect';
import {useFormState} from 'utils/hooks';
import {NotificationType} from 'src/libs/Enums';

import {NotificationContext} from 'contexts';

import Loader from 'components/basic/Loader';
import {Content} from 'components/layout';
import Toolbar, {ToolbarItem} from 'components/basic/Toolbar';
import {H1, H3, Description} from 'components/basic/text';
import TypeaheadInput from 'components/basic/forms/input/TypeaheadInput';
import DatePickerDropdown from 'components/basic/forms/dropdowns/DatePickerDropdown';

import TextBlock from 'components/dashboards/TextBlock';
import TextBlockProvider from 'components/dashboards/TextBlock/provider';
import TextBlockToolbar from 'components/dashboards/TextBlock/Toolbar';

import {NavigationHelper} from './helpers';

const TextBlockWrapper = styled(Flex)`
    background: #ffffff;
    border: 1px solid #e1e5ed;
    padding: 12px;
    flex: 1;
`;

function Form({
    componentData,
    componentId,
    existingReportingComponents = [],
    formErrors,
    formState,
    onComponentAsOfDateChanged,
    onComponentNameChanged,
    onComponentSettingsChanged,
}) {
    // Create spec handler and provider. Memoized so that they are only generated
    // when data has been updated and they need to be re-generated.
    const dataProvider = useMemo(() => new TextBlockProvider(componentData), [componentData]);
    const [sharedState, setSharedState] = useState();

    const handleSharedStateChange = useCallback((componentId, data) => setSharedState(data), []);

    const nameOptions = existingReportingComponents
        .sort((left, right) => {
            const leftName = left.name.toLowerCase();
            const rightName = right.name.toLowerCase();
            return leftName < rightName ? -1 : leftName > rightName ? 1 : 0;
        })
        .map(rc => ({key: rc.uid, value: rc.name, label: rc.name}));

    return (
        <Flex flexDirection='column' p={16}>
            <Box mb={32}>
                <H1>New Reporting Component</H1>
                <Description>
                    Configure and create a component that can later be pulled directly into
                    dashboards created in the dashboard section.
                </Description>
            </Box>
            <Box flexDirection='column' mb={32}>
                <H3>Settings</H3>
                <Flex mt={2}>
                    <Box flex='1 1 auto' mr={2}>
                        <TypeaheadInput
                            leftLabel='Name'
                            placeholder='Enter a name'
                            value={formState.name}
                            error={formErrors.name}
                            options={nameOptions}
                            onValueChanged={onComponentNameChanged}
                        />
                    </Box>
                    <Box flex='1 1 auto'>
                        <DatePickerDropdown
                            label='As of Date'
                            placeholder='Select an as of date'
                            value={formState.asOfDate}
                            error={formErrors.asOfDate}
                            onChange={onComponentAsOfDateChanged}
                            useTimestamp
                        />
                    </Box>
                </Flex>
            </Box>
            <Flex flexDirection='column'>
                <H3>Content</H3>
                <Box alignSelf='flex-start'>
                    <TextBlockToolbar
                        componentId={componentId}
                        dataProvider={dataProvider}
                        onSpecHandlerAction={onComponentSettingsChanged}
                        sharedState={sharedState}
                        disableVariables
                    />
                </Box>
                <TextBlockWrapper mt={2}>
                    <TextBlock
                        componentId={componentId}
                        dataProvider={dataProvider}
                        onSpecHandlerAction={onComponentSettingsChanged}
                        placeholder='Start writing free text...'
                        isEditing
                        isSelected
                        showToolbar
                        onSharedStateChange={handleSharedStateChange}
                    />
                </TextBlockWrapper>
            </Flex>
        </Flex>
    );
}

function PageToolbar({companyId, onSave}) {
    return (
        <Toolbar>
            <ToolbarItem to={NavigationHelper.companyReportingComponentsLink(companyId)} right>
                Cancel
            </ToolbarItem>
            <ToolbarItem icon='save' glyphicon right onClick={onSave}>
                Save Reporting Component
            </ToolbarItem>
        </Toolbar>
    );
}

export default function CreateComponentForm({match}) {
    const {companyId} = NavigationHelper.getIdsFromMatch(match);
    const notifications = useContext(NotificationContext);

    const [dataSpec, setDataSpec] = useState({});
    const [layoutData, setLayoutData] = useState({});
    const [componentData, setComponentData] = useState({componentKey: 'textBlock'});
    const [formState, formErrors, setFormState, triggerFormValidation] = useFormState({
        name: {
            initialValue: '',
            validator: name => (!name ? 'You need to provide a name' : null),
            validatorDeps: [],
        },
        asOfDate: {
            initialValue: null,
            validator: asOfDate => (!asOfDate ? 'You need to provide an as of date' : null),
            validatorDeps: [],
        },
    });

    const {
        data: {reporting_components: reportingComponents = []},
    } = useBackendData('reporting-components/list');

    const {
        triggerEndpoint: createComponent,
        isLoading: isCreatingComponent,
        hasTriggered: hasCreatedComponent,
        error: createReportingComponentError,
    } = useBackendEndpoint('reporting-components/instance/create');

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

    const onSave = useCallback(() => {
        if (!triggerFormValidation()) {
            return;
        }

        createComponent({
            name: formState.name,
            as_of_date: formState.asOfDate,
            company_uid: companyId,
            layout_data: layoutData,
            component_data: componentData,
            data_spec: dataSpec,
        }).catch(message => {
            notifications.add({type: NotificationType.Error, message});
        });
    }, [
        companyId,
        componentData,
        createComponent,
        dataSpec,
        formState.asOfDate,
        formState.name,
        layoutData,
        notifications,
        triggerFormValidation,
    ]);

    if (!isCreatingComponent && hasCreatedComponent && !createReportingComponentError) {
        return <Redirect to={NavigationHelper.companyReportingComponentsLink(companyId)} push />;
    }

    return (
        <Content>
            <PageToolbar companyId={companyId} onSave={onSave} />
            {isCreatingComponent ? (
                <Loader />
            ) : (
                <Form
                    formState={formState}
                    formErrors={formErrors}
                    companyId={companyId}
                    dataSpec={dataSpec}
                    layoutData={layoutData}
                    componentData={componentData}
                    onComponentNameChanged={setFormState('name')}
                    onComponentAsOfDateChanged={setFormState('asOfDate')}
                    onComponentSettingsChanged={onComponentSettingsChanged}
                    existingReportingComponents={reportingComponents}
                    onSave={onSave}
                />
            )}
        </Content>
    );
}
