import {identity, is_set, object_from_array} from 'src/libs/Utils';

import specEngine from 'libs/spec-engine';
import dashboardComponents from 'libs/dashboard-components';

import * as dashboardActions from 'actions/dashboards';

import * as componentSelectors from 'selectors/dashboards/component';
import * as dashboardSelectors from 'selectors/dashboards/dashboard';
import {valueMap as valueMapSelector} from 'selectors/dashboards';

import {
    DASHBOARD_SELECT_COMPONENT,
    DASHBOARD_SET_COMPONENT_DATA,
    DASHBOARD_SET_DATA_SPEC,
    DASHBOARD_SET_LAYOUT_DATA,
} from 'action-types/dashboards';

export function addComponent(component, pageIdx = 0, nbrColumns = 24) {
    return function action(dispatch, getState) {
        const dashboard = {
            dataSpec: dashboardSelectors.activeDataSpec(getState()),
            componentData: dashboardSelectors.activeComponentData(getState()),
            layoutData: dashboardSelectors.activeLayoutData(getState(), false, false),
        };

        const {componentKey} = component.componentData;
        const defaults = dashboardComponents[componentKey].defaults;
        const constraints = dashboardComponents[componentKey].constraints;

        component.componentData.settings = {
            ...defaults.settings,
            ...component.componentData.settings,
        };

        if (!component.layoutData) {
            component.layoutData = {
                w: (defaults && defaults.width) || undefined,
                h: (defaults && defaults.height) || undefined,
                minW: (constraints && constraints.width.min) || undefined,
                maxW: (constraints && constraints.width.max) || undefined,
                minH: (constraints && constraints.height.min) || undefined,
                maxH: (constraints && constraints.height.max) || undefined,
                pageIdx,
            };
        } else {
            component.layoutData.pageIdx = pageIdx;
        }

        const [newDashboard, componentId] = specEngine.addNewComponent(
            component,
            dashboard,
            nbrColumns,
        );

        dispatch(
            _updateSpecs(
                newDashboard.dataSpec,
                newDashboard.componentData,
                newDashboard.layoutData,
            ),
        );
        dispatch(selectComponent(componentId));
    };
}

export function selectComponent(componentId) {
    return (dispatch, getState) => {
        if (componentSelectors.selectedComponentId(getState()) === componentId) {
            return;
        }

        dispatch({
            type: DASHBOARD_SELECT_COMPONENT,
            payload: {
                dashboardId: dashboardSelectors.activeDashboardId(getState()),
                componentId,
            },
        });
    };
}

export function changeComponentPage(componentId, up, newRow, newCol) {
    return (dispatch, getState) => {
        const {newLayoutData} = specEngine.changeComponentPage(
            componentId,
            up,
            newRow,
            newCol,
            dashboardSelectors.activeLayoutData(getState()),
        );
        dispatch(_updateSpecs(null, null, newLayoutData));
    };
}

export function removeComponent(componentId) {
    return (dispatch, getState) => {
        componentId = componentId || componentSelectors.selectedComponentId(getState());
        const {newDataSpec, newComponentData, newLayoutData} =
            specEngine.removeComponent(
                componentId,
                dashboardSelectors.activeDataSpec(getState()),
                dashboardSelectors.activeComponentData(getState()),
                dashboardSelectors.activeLayoutData(getState(), false, false),
            ) || {};

        if (!newDataSpec || !newComponentData || !newLayoutData) {
            // TODO(Simon 16 March 2018) Dispatch error message
            return;
        }

        dispatch(_updateSpecs(newDataSpec, newComponentData, newLayoutData));
        dispatch(selectComponent(null));
    };
}

export function duplicateComponent(componentId) {
    return (dispatch, getState) => {
        componentId = componentId || componentSelectors.selectedComponentId(getState());
        const {
            newDataSpec,
            newComponentData,
            newLayoutData,
            newComponentId,
        } = specEngine.duplicateComponent(
            componentId,
            dashboardSelectors.activeDataSpec(getState()),
            dashboardSelectors.activeComponentData(getState()),
            dashboardSelectors.activeLayoutData(getState(), false, false),
        );

        dispatch(_updateSpecs(newDataSpec, newComponentData, newLayoutData));
        dispatch(selectComponent(newComponentId));
    };
}

export function updateComponentSpec(action, payload, componentId) {
    return (dispatch, getState) => {
        componentId = componentId || componentSelectors.selectedComponentId(getState());
        const componentData = dashboardSelectors.activeComponentData(getState());
        const dataSpec = dashboardSelectors.activeDataSpec(getState());
        const dashboardId = dashboardSelectors.activeDashboardId(getState());
        const valueMap = valueMapSelector(getState());

        let {componentKey, base} = componentData[componentId] || {};
        if (base) {
            componentKey = 'reportingComponent';
        }
        if (!componentKey) {
            return;
        }
        const SpecHandler = dashboardComponents[componentKey].specHandler;

        const [
            componentDataUpdates,
            dataSpecUpdates,
            requireRederiveDashboard,
        ] = SpecHandler.updateSpecs(
            componentId,
            action,
            payload,
            componentData,
            dataSpec,
            valueMap,
        );

        let updatedDataSpecs = null;
        if (dataSpecUpdates.updatedComponents.length > 0) {
            updatedDataSpecs = object_from_array(
                dataSpecUpdates.updatedComponents.map(compId => [
                    compId,
                    {...dataSpecUpdates.dataSpec[compId]},
                ]),
                identity,
            );

            if (!requireRederiveDashboard) {
                dispatch(
                    dashboardActions.requestDataForSpec(
                        dashboardId,
                        updatedDataSpecs,
                        dataSpecUpdates.updatedComponents,
                    ),
                );
            }
        }
        let updatedComponentDatas = null;
        if (componentDataUpdates.updatedComponents.length > 0) {
            updatedComponentDatas = object_from_array(
                componentDataUpdates.updatedComponents.map(compId => [
                    compId,
                    {...componentDataUpdates.componentData[compId]},
                ]),
                identity,
            );
        }

        if (!requireRederiveDashboard) {
            dispatch(_updateSpecsForComponents(updatedDataSpecs, updatedComponentDatas, null));
        }

        if (requireRederiveDashboard) {
            const updatedComponentIds = new Set([
                ...dataSpecUpdates.updatedComponents,
                ...componentDataUpdates.updatedComponents,
            ]);

            let dashboardData = {
                uid: dashboardId,
                dataSpec: dataSpecUpdates.dataSpec,
                componentData: componentDataUpdates.componentData,
                layoutData: dashboardSelectors.activeLayoutData(getState()),
            };

            dispatch(
                dashboardActions.deriveDashboard(true, dashboardData, updatedComponentIds),
            ).then(derivedDashboard => {
                dispatch(
                    _updateSpecsForComponents(
                        derivedDashboard.dataSpec,
                        derivedDashboard.componentData,
                        null,
                    ),
                );
            });
        }
    };
}

function _updateSpecs(dataSpec, componentData, layoutData) {
    return (dispatch, getState) => {
        const dashboardId = dashboardSelectors.activeDashboardId(getState());

        if (dataSpec) {
            dispatch({
                type: DASHBOARD_SET_DATA_SPEC,
                payload: {
                    dashboardId,
                    dataSpec,
                },
            });
        }

        if (componentData) {
            dispatch({
                type: DASHBOARD_SET_COMPONENT_DATA,
                payload: {
                    dashboardId,
                    componentData,
                },
            });
        }

        if (layoutData) {
            dispatch({
                type: DASHBOARD_SET_LAYOUT_DATA,
                payload: {
                    dashboardId,
                    layoutData,
                },
            });
        }
    };
}

function _updateSpecsForComponents(dataSpecs, componentDatas, layoutDatas) {
    return (dispatch, getState) => {
        const dashboardId = dashboardSelectors.activeDashboardId(getState());

        if (is_set(dataSpecs, true)) {
            dispatch({
                type: DASHBOARD_SET_DATA_SPEC,
                payload: {
                    dashboardId,
                    dataSpecs,
                },
            });
        }

        if (is_set(componentDatas, true)) {
            dispatch({
                type: DASHBOARD_SET_COMPONENT_DATA,
                payload: {
                    dashboardId,
                    componentDatas,
                },
            });
        }

        if (is_set(layoutDatas, true)) {
            dispatch({
                type: DASHBOARD_SET_LAYOUT_DATA,
                payload: {
                    dashboardId,
                    layoutDatas,
                },
            });
        }
    };
}

export function setComponentDimension(dimension, size) {
    return (dispatch, getState) => {
        const componentId = componentSelectors.selectedComponentId(getState());
        const componentData = componentSelectors.selectedComponentData(getState());
        const constraints = dashboardComponents[componentData.componentKey].constraints;
        const dimensionConstraint = constraints && constraints[dimension];

        if (
            !is_set(dimensionConstraint, true) ||
            (size >= dimensionConstraint.min && size <= (dimensionConstraint.max || Infinity))
        ) {
            const layout = [{i: componentId, [dimension[0]]: size}];
            dispatch(dashboardActions.layoutChanged(layout));
        }
    };
}
