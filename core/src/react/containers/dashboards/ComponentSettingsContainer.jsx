import React, {Component} from 'react';
import {connect} from 'react-redux';

import dashboardComponents from 'libs/dashboard-components';

import * as componentSelectors from 'selectors/dashboards/component';
import * as dashboardSelectors from 'selectors/dashboards/dashboard';

import * as componentActions from 'actions/dashboards/components';

import ComponentSettings from 'components/dashboards/component-settings/ComponentSettings';

class ComponentSettingsContainer extends Component {
    render() {
        const {selectedComponentData} = this.props;
        let componentKey = selectedComponentData && selectedComponentData.componentKey;
        if (selectedComponentData && selectedComponentData.base) {
            componentKey = 'reportingComponent';
        }
        const hidePreview = !selectedComponentData || dashboardComponents[componentKey].hidePreview;

        return (
            <ComponentSettings
                columnRef={this.props.columnRef}
                active={this.props.active}
                selectedComponent={this.props.selectedComponent}
                selectedComponentData={this.props.selectedComponentData}
                selectedLayoutData={this.props.selectedLayoutData}
                dashboardSize={this.props.dashboardSize}
                provider={this.props.dataProvider}
                componentProvider={this.props.componentDataProvider}
                onSettingsChanged={this.props.updateComponentSpec}
                onChangeColumn={this.props.onChangeColumn}
                globalParams={this.props.globalParams}
                hidePreview={hidePreview}
                layoutEngine={this.props.layoutEngine}
            />
        );
    }
}

function componentProviders(state, props) {
    const selectedComponentData = componentSelectors.selectedComponentData(state, props);
    const selectedComponent = componentSelectors.selectedComponentId(state, props);
    if (!selectedComponentData) {
        return [];
    }

    let componentKey;
    if (selectedComponentData.base) {
        componentKey = 'reportingComponent';
    } else {
        componentKey = selectedComponentData.componentKey;
    }

    const SettingsProvider = dashboardComponents[componentKey].settingsProvider;
    const DataProvider = dashboardComponents[componentKey].provider;

    const settingsProvider =
        SettingsProvider && SettingsProvider.fromSelector(state, selectedComponent);
    const dataProvider = DataProvider && DataProvider.fromSelector(state, selectedComponent);

    return [settingsProvider, dataProvider];
}

const mapStateToProps = (state, props) => {
    const selectedComponentData = componentSelectors.selectedComponentData(state, props);
    const selectedComponent = componentSelectors.selectedComponentId(state, props);
    const [settingsProvider, dataProvider] = componentProviders(state, props);

    return {
        dataProvider: settingsProvider,
        componentDataProvider: dataProvider,
        dashboardSize: dashboardSelectors.dashboardSize(state, props),
        globalParams: dashboardSelectors.activeDashboardGlobalParams(state, props),
        selectedComponent,
        selectedComponentData,
        selectedLayoutData: componentSelectors.selectedLayoutData(state, props),
    };
};

const mapActionsToProps = {
    updateComponentSpec: componentActions.updateComponentSpec,
};

export default connect(mapStateToProps, mapActionsToProps)(ComponentSettingsContainer);
