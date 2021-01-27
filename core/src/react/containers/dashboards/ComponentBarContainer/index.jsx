import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {Flex} from '@rebass/grid';

import dashboardComponents from 'libs/dashboard-components';

import * as componentSelectors from 'selectors/dashboards/component';
import * as dashboardSelectors from 'selectors/dashboards/dashboard';

import * as componentActions from 'actions/dashboards/components';

import Icon from 'components/basic/Icon';
import {BarButton} from 'components/dashboards/buttons';
import TopBar from 'components/dashboards/TopBar';

import GeneralComponentSettings from './GeneralComponentSettings';

class ComponentBarContainer extends Component {
    static propTypes = {
        onAddComponentClicked: PropTypes.func.isRequired,
        onComponentSettingsClicked: PropTypes.func.isRequired,
    };

    render() {
        const {selectedComponentData, sharedState = {}, dataProvider} = this.props;
        let settingsComponent = null;
        let enableToolbar = false;
        let enableComponentPaddingSetting = false;
        let ToolbarComponent = null;

        if (selectedComponentData) {
            let componentKey = selectedComponentData.componentKey;
            if (selectedComponentData.base) {
                componentKey = 'reportingComponent';
            }

            ({
                settingsComponent,
                enableToolbar,
                toolbarComponent: ToolbarComponent,
                enableComponentPaddingSetting,
            } = dashboardComponents[componentKey]);
        }

        const showSettings = settingsComponent && !dataProvider.isReportingComponent();

        return (
            <TopBar flexDirection='row' flexWrap='wrap'>
                <Flex flex='1 0 15%' pl={2}>
                    <BarButton onClick={this.props.onAddComponentClicked}>
                        <Icon name='plus' left />
                        Add Component
                    </BarButton>
                </Flex>
                {this.props.selectedComponentData &&
                    enableToolbar &&
                    ToolbarComponent &&
                    showSettings && (
                        <Flex flex='1 0 70%' justifyContent='center'>
                            <ToolbarComponent
                                key={this.props.selectedComponent}
                                componentId={this.props.selectedComponent}
                                onSettingsChanged={this.props.updateComponentSpec}
                                sharedState={sharedState}
                                settingsProvider={this.props.settingsProvider}
                                dataProvider={this.props.dataProvider}
                                toggleComponentSettings={this.props.onComponentSettingsClicked}
                            />
                        </Flex>
                    )}
                <Flex flex='0 0 15%' justifyContent='flex-end'>
                    <GeneralComponentSettings
                        onSettingsChanged={this.props.updateComponentSpec}
                        settingsProvider={this.props.settingsProvider}
                        enableComponentPaddingSetting={enableComponentPaddingSetting}
                    />
                </Flex>
            </TopBar>
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
        dashboardSize: dashboardSelectors.dashboardSize(state, props),
        selectedComponent,
        selectedComponentData,
        settingsProvider,
        dataProvider,
    };
};

const mapActionsToProps = {
    setComponentDimension: componentActions.setComponentDimension,
    updateComponentSpec: componentActions.updateComponentSpec,
};

export default connect(mapStateToProps, mapActionsToProps)(ComponentBarContainer);
