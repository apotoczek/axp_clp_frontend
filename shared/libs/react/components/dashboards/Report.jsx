import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

import ReportPage from 'components/dashboards/ReportPage';
import DashboardLayout from 'libs/multi-page-dashboard-layout';

const ReportWrapper = styled.div`
    transform-origin: top;
    transform: scale(${props => props.scale || 1});
`;

const PageWrapper = styled.div`
    height: ${({pageHeight}) => (pageHeight === Infinity ? '100%' : `${pageHeight}px`)};
    width: ${props => props.pageWidth}px;
    margin: ${props => (props.bare ? '0 auto' : '8px auto')};

    /* Page break to ensure pages don't overflow */
    page-break-after: always;
    overflow: ${props => (props.bare ? 'hidden' : 'visible')};
`;

export default function Report({
    layoutEngine,
    pageIndexes,
    staticLayoutData,
    componentData,
    dashboardComponents,
    pageBgColor,
    currentZoom = 100,
    bare = false,
}) {
    return (
        <ReportWrapper scale={currentZoom / 100}>
            {pageIndexes.map(pageNumber => (
                <PageWrapper
                    bare={bare}
                    key={pageNumber}
                    pageWidth={layoutEngine.pageWidth}
                    pageHeight={layoutEngine.pageHeight}
                >
                    <ReportPage
                        layoutEngine={layoutEngine}
                        layoutData={staticLayoutData.filter(
                            component => (component.pageIdx || 0) == pageNumber,
                        )}
                        componentData={componentData}
                        isEditing={false}
                        components={dashboardComponents}
                        pageBgColor={pageBgColor}
                    />
                </PageWrapper>
            ))}
        </ReportWrapper>
    );
}

Report.propTypes = {
    layoutEngine: PropTypes.instanceOf(DashboardLayout),
    pageIndexes: PropTypes.arrayOf(PropTypes.number),
    staticLayoutData: PropTypes.arrayOf(PropTypes.object),
    componentData: PropTypes.object,
    dashboardComponents: PropTypes.object,
    pageBgColor: PropTypes.string,
    currentZoom: PropTypes.number,
    bare: PropTypes.bool,
};
