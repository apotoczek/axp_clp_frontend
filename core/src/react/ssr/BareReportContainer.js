import React, {useRef, useState, useEffect, useMemo} from 'react';
import {createGlobalStyle, css} from 'styled-components';

import backendConnect from 'utils/backendConnect';

import * as dashboardActions from 'actions/dashboards';
import * as endpoints from 'actions/data/endpoints';
import * as requests from 'actions/data/requests';

import {PageFormat} from 'src/libs/Enums';
import {is_set} from 'src/libs/Utils';

import * as dashboardSelectors from 'selectors/dashboards/dashboard';

import dashboardComponents from 'libs/dashboard-components';
import Report from 'components/dashboards/Report';
import EmptyDashboard from 'components/dashboards/EmptyDashboard';
import DashboardLayout from 'libs/multi-page-dashboard-layout';

import {Container, Content, Viewport} from 'components/layout';

import Loader from 'components/basic/Loader';

function BareReportContainer({
    match,
    requests,
    dashboard,
    dashboardNbrOfPages,
    staticLayoutData = [],
    componentData,
    populateValueMap,
    setActiveDashboard,
    triggerRequests,
}) {
    const [containerWidth, setContainerWidth] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const containerRef = useRef(null);
    const templateSettings = (dashboard && dashboard.settings && dashboard.settings.template) || {};
    const {format: pageFormat, componentPadding: gridItemPadding} = templateSettings;

    useEffect(() => {
        populateValueMap().then(() => {
            setActiveDashboard(match.params.uid).then(() => {
                triggerRequests();
                setIsLoading(false);
            });
        });
    }, [match.params.uid, populateValueMap, setActiveDashboard, triggerRequests]);

    useEffect(() => {
        const format = templateSettings.format;

        const containerNode = containerRef.current;

        if (
            containerNode &&
            format === PageFormat.DASHBOARD &&
            containerWidth != containerNode.offsetWidth
        ) {
            setContainerWidth(containerNode.offsetWidth);
        }
    }, [templateSettings.format, containerWidth]);

    const layoutEngine = useMemo(
        () => new DashboardLayout(containerWidth, gridItemPadding, pageFormat),
        [containerWidth, gridItemPadding, pageFormat],
    );

    let pageIndexes;

    if (layoutEngine.pageFormat == PageFormat.DASHBOARD || staticLayoutData.isEmpty()) {
        pageIndexes = [0];
    } else {
        pageIndexes = [...Array(dashboardNbrOfPages).keys()];
    }

    // This fixes the extra page on single page pdf exports, not sure why it's needed
    // The current theory is that scrollbars skew the layout a bit and the overflow: hidden
    // prevents scrolling entirely. For some reason multiple pages are not affected.
    const OnePageFix = createGlobalStyle`
        ${layoutEngine.pageFormat !== PageFormat.DASHBOARD &&
            dashboardNbrOfPages === 1 &&
            css`
                body,
                html {
                    overflow: hidden;
                }
            `}
    `;

    const isDashboardLoading =
        requests.dashboard.loading ||
        requests.allVehicles.loading ||
        requests.siteCustomizations.loading ||
        !dashboard ||
        isLoading;
    return (
        <Container ref={containerRef}>
            <OnePageFix />
            {isDashboardLoading ? (
                <Loader />
            ) : (
                <Viewport>
                    <Content>
                        {!is_set(staticLayoutData, true) ? (
                            <EmptyDashboard />
                        ) : (
                            <Report
                                layoutEngine={layoutEngine}
                                pageIndexes={pageIndexes}
                                staticLayoutData={staticLayoutData}
                                componentData={componentData}
                                dashboardComponents={dashboardComponents}
                                pageBgColor={dashboard.settings.template.backgroundColor}
                                bare
                            />
                        )}
                    </Content>
                </Viewport>
            )}
        </Container>
    );
}

const data = props => ({
    dashboard: endpoints.call('dataprovider/dashboard', {dashboard_uid: props.match.params.uid}),
    allVehicles: endpoints.call('dataprovider/user_vehicles', {}),
    dashboards: requests.fetchDashboards(),
    siteCustomizations: requests.fetchSiteCustomizations(),
});

const mapStateToProps = state => ({
    dashboard: dashboardSelectors.activeDashboard(state),
    staticLayoutData: dashboardSelectors.activeLayoutData(state, true, true),
    componentData: dashboardSelectors.activeComponentData(state),
    dashboardNbrOfPages: dashboardSelectors.dashboardNbrOfPages(state),
});

const dispatchToProps = {
    setActiveDashboard: dashboardActions.setActiveDashboard,
    populateValueMap: dashboardActions.populateValueMap,
};

export default backendConnect(data, {}, mapStateToProps, dispatchToProps)(BareReportContainer);
