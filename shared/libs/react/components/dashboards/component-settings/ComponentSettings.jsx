import React, {Component, useState} from 'react';
import PropTypes from 'prop-types';
import {CSSTransition} from 'react-transition-group';
import styled, {css} from 'styled-components';
import {Flex} from '@rebass/grid';

import dashboardComponents from 'libs/dashboard-components';

import {H3} from 'components/basic/text';
import Loader from 'components/basic/Loader';
import Icon from 'components/basic/Icon';

import DashboardComponent from 'components/dashboards/DashboardComponent';
import TopBar from 'components/dashboards/TopBar';
import {BarButton} from 'components/dashboards/buttons';

// TODO (Simon 30 Sep 2019) This import is dangerously close to circular.
// Fix me by moving ComponentSettings
import {Column, Columns} from 'containers/dashboards/EditReportContainer/shared';

const ComponentPreviewTitle = styled(H3)`
    margin: 0;
`;

const Header = styled(Flex)`
    background: ${({theme}) => theme.dashboard.componentPreview.headerBg};
`;

const ComponentPreviewWrapper = styled(Flex)`
    background: ${({theme}) => theme.dashboard.componentPreview.bg};
    box-shadow: ${({theme}) => theme.dashboard.componentPreview.dropShadow};
    border-radius: 3px;
    flex-direction: column;

    position: fixed;
    right: 12px;
    bottom: 12px;

    width: ${props => `${props.width + 32}px` || 'auto'};
    max-width: 40%;

    &.component-preview-enter {
        transform: translate(0, 20px);
        opacity: 0;
    }

    &.component-preview-enter-active {
        transform: translate(0, 0);
        opacity: 1;
        transition: transform 450ms ease-out, opacity 450ms ease-out;
    }

    &.component-preview-exit {
        transform: translate(0, 0);
        opacity: 1;
    }

    &.component-preview-exit-active {
        transform: translate(0, 20px);
        opacity: 0;
        transition: transform 450ms ease-out, opacity 450ms ease-out;
    }
`;

const ComponentWrapper = styled.div`
    background: #ffffff;

    max-height: 350px;
    min-height: 100px;
    padding: 6px;

    ${props =>
        props.collapsed &&
        css`
            height: 0;
            min-height: 0;
            padding: 0;
        `}

    width: 100%;

    overflow: auto;
`;

function ComponentPreview({
    width,
    height,
    componentKey,
    componentData,
    selectedComponent,
    settings,
}) {
    const [collapsed, setCollapsed] = useState(false);

    let derivedComponentKey = componentKey;
    if (componentData.base && !componentKey) {
        derivedComponentKey = 'reportingComponent';
    }

    return (
        <ComponentPreviewWrapper width={width}>
            <Header p={3}>
                <ComponentPreviewTitle>Component Preview</ComponentPreviewTitle>
                <Flex justifyContent='flex-end' flex={1}>
                    <Icon
                        name={collapsed ? 'plus' : 'minus'}
                        glyphicon
                        button
                        onClick={() => setCollapsed(!collapsed)}
                    />
                </Flex>
            </Header>
            <ComponentWrapper collapsed={collapsed}>
                <DashboardComponent
                    componentSpec={dashboardComponents[derivedComponentKey]}
                    componentId={selectedComponent}
                    componentKey={derivedComponentKey}
                    height={height}
                    width={width}
                    isEditing
                    {...settings}
                />
            </ComponentWrapper>
        </ComponentPreviewWrapper>
    );
}

class ComponentSettings extends Component {
    static propTypes = {
        selectedComponent: PropTypes.string,
        selectedComponentData: PropTypes.object,
        selectedLayoutData: PropTypes.object,
        dashboardSize: PropTypes.object.isRequired,
        provider: PropTypes.object,
        componentProvider: PropTypes.object,
        hidePreview: PropTypes.bool,

        onSettingsChanged: PropTypes.func.isRequired,
        onChangeColumn: PropTypes.func.isRequired,

        globalParams: PropTypes.object,
        active: PropTypes.bool,
        columnRef: PropTypes.shape({
            current: PropTypes.instanceOf(Element),
        }),
    };

    render() {
        const {selectedLayoutData, selectedComponentData, selectedComponent} = this.props;
        if (!selectedComponentData || !selectedLayoutData || !selectedComponent) {
            return <Loader />;
        }

        let componentKey;
        if (this.props.componentProvider && this.props.componentProvider.isReportingComponent()) {
            componentKey = 'reportingComponent';
        } else {
            componentKey = selectedComponentData.componentKey;
        }

        const dashboardComponent = dashboardComponents[componentKey];
        const SettingsComponent = dashboardComponent.settingsComponent;
        const componentLabel = dashboardComponent.label;

        if (!SettingsComponent) {
            return null;
        }

        return (
            <Column flex='1 0 100%' flexDirection='column' pb='350px' ref={this.props.columnRef}>
                <TopBar borderLeft>
                    <BarButton onClick={() => this.props.onChangeColumn(Columns.EDITOR)} ml={2}>
                        <Icon name='chevron-left' glyphicon left />
                        Close
                    </BarButton>
                </TopBar>
                <Flex pl={3} mt={3}>
                    <H3>{componentLabel} Settings</H3>
                </Flex>
                <SettingsComponent
                    key={selectedComponent}
                    componentProvider={this.props.componentProvider}
                    onSettingsChanged={this.props.onSettingsChanged}
                    provider={this.props.provider}
                    globalParams={this.props.globalParams}
                />
                <CSSTransition
                    in={!this.props.hidePreview && this.props.active}
                    timeout={500}
                    classNames='component-preview'
                    unmountOnExit
                >
                    <ComponentPreview
                        width={this.props.layoutEngine.innerWidth(selectedLayoutData.w)}
                        height={this.props.layoutEngine.innerHeight(selectedLayoutData.h)}
                        componentKey={selectedComponentData.componentKey}
                        componentData={selectedComponentData}
                        selectedComponent={this.props.selectedComponent}
                        settings={selectedComponentData.settings}
                    />
                </CSSTransition>
            </Column>
        );
    }
}

export default ComponentSettings;
