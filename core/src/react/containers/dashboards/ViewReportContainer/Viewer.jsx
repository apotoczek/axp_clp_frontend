import React, {useRef, useCallback, useState, useEffect, useMemo} from 'react';
import dashboardComponents from 'libs/dashboard-components';
import DashboardLayout from 'libs/multi-page-dashboard-layout';

import Report from 'components/dashboards/Report';

import {ScrollableContent} from 'components/layout';

import {PageFormat} from 'src/libs/Enums';
import ZoomControl from './ZoomControl';

export default function Viewer({
    containerWidth,
    dashboard,
    staticLayoutData,
    componentData,
    dashboardNbrOfPages,
}) {
    const [currentZoom, setCurrentZoom] = useState(100);
    const contentRef = useRef(null);
    const templateSettings = dashboard?.settings?.template ?? {};
    const {format: pageFormat, componentPadding: gridItemPadding} = templateSettings;

    const layoutEngine = useMemo(
        () => new DashboardLayout(containerWidth, gridItemPadding, pageFormat),
        [containerWidth, gridItemPadding, pageFormat],
    );

    const handleZoomChanged = useCallback(
        newZoom => {
            setCurrentZoom(newZoom);

            if (contentRef.current) {
                contentRef.current.scrollTo(0, 0);
            }
        },
        [contentRef],
    );

    useEffect(() => {
        const contentNode = contentRef.current;

        function handleScroll() {
            // There is 8 margin below every page plus an extra 8 at the top
            const yEnd =
                ((layoutEngine.pageHeight + 8) * dashboardNbrOfPages * currentZoom) / 100 + 8;

            if (contentNode.scrollTop + contentNode.offsetHeight > yEnd) {
                // If all pages are visible
                const isChrome = navigator.userAgent.indexOf('Chrome') != -1;
                if (isChrome) {
                    // Chrome is a little special and to ensure we cannot scroll past we do this
                    contentNode.style.overflowY = 'hidden';
                }
                contentNode.scrollTo(0, yEnd - contentNode.offsetHeight);
                if (isChrome) {
                    // If we are in chrome, the overflow was disabled so we enable it again
                    contentNode.style.overflowY = 'scroll';
                }
            }
        }

        if (contentNode) {
            contentNode.addEventListener('scroll', handleScroll);
        }

        return () => {
            if (contentNode) {
                contentNode.removeEventListener('scroll', handleScroll);
            }
        };
    }, [contentRef, currentZoom, layoutEngine, dashboardNbrOfPages]);

    let pageIndexes;

    if (layoutEngine.pageFormat == PageFormat.DASHBOARD || staticLayoutData.isEmpty()) {
        pageIndexes = [0];
    } else {
        pageIndexes = [...Array(dashboardNbrOfPages).keys()];
    }

    return (
        <ScrollableContent hideScroll ref={contentRef}>
            <ZoomControl value={currentZoom} onZoomChanged={handleZoomChanged} />
            <Report
                layoutEngine={layoutEngine}
                pageIndexes={pageIndexes}
                staticLayoutData={staticLayoutData}
                componentData={componentData}
                dashboardComponents={dashboardComponents}
                pageBgColor={dashboard.settings.template.backgroundColor}
                currentZoom={currentZoom}
            />
        </ScrollableContent>
    );
}
