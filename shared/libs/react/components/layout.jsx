import React from 'react';
import styled, {css} from 'styled-components';
import PropTypes from 'prop-types';
import {Box, Flex} from '@rebass/grid';

export const FullHeightPageContent = styled.div`
    /* Compensate for Toolbar if it's visible in the page */
    padding: 16px;
    padding-top: calc(${props => (props.toolbarVisible && 40) || 0}px + 16px);
    overflow-y: auto;

    max-height: 100%;
`;

export const Container = styled.div`
    width: 100%;
    height: 100%;

    position: relative;
`;

export const FullHeightPage = styled.div`
    width: 100%;
    height: calc(100vh - 33px);
`;

export const Section = styled(Box)`
    flex: ${props => props.flex || 1};
`;

export const Viewport = styled(Flex)`
    flex-direction: column;
    height: 100%;
    width: 100%;
    max-height: 100vh;
`;

export const Page = styled(Flex)`
    flex: 1;
    flex-direction: row;
    background-color: ${({theme}) => theme.page.bg};

    overflow-y: auto;
    min-height: 0;
`;

export const Content = styled(Flex)`
    flex: 1;
    flex-direction: column;
    width: 100%;
`;

/*
    This implementation with <Scroll> and <NoHeight> is a workaround
    for an issue arising in Firefox. The issue is that a FlexItem
    does not snap its height correctly if it has children that specify the overflow property.
*/

const InnerScrollableContent = ({hideScroll, children, ...restProps}, ref) => (
    <Scroll ref={ref} hideScroll={hideScroll} {...restProps}>
        <NoHeight>{children}</NoHeight>
    </Scroll>
);
export const ScrollableContent = React.forwardRef(InnerScrollableContent);

const NoHeight = styled.div`
    height: 0;
`;

export const Scroll = styled.div`
    overflow-y: auto;
    flex: 1;

    ${props =>
        props.hideScroll &&
        css`
            /*Firefox*/
            scrollbar-width: none;
            /*Webkit*/
            ::-webkit-scrollbar {
                display: none;
            }
        `}
`;

const CellWrapper = styled.div`
    display: table-cell;
    vertical-align: middle;
    font-size: inherit;
`;

const TableWrapper = styled.div`
    display: table;
    height: 100%;
    width: 100%;
    font-size: inherit;
`;

export const VerticalAlign = ({children, ...rest}) => (
    <TableWrapper {...rest}>
        <CellWrapper>{children}</CellWrapper>
    </TableWrapper>
);

VerticalAlign.propTypes = {
    children: PropTypes.node.isRequired,
};
