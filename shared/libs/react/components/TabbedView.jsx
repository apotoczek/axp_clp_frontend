import React from 'react';
import PropTypes from 'prop-types';
import styled, {css} from 'styled-components';
import {Flex} from '@rebass/grid';

import {usePartiallyAppliedCallback} from 'utils/hooks';

import {H5} from 'components/basic/text';

const TabHeader = styled(Flex)`
    align-items: center;
    justify-content: center;
    background: #edeff3;
    border: 1px solid #e1e5ed;
    border-radius: 3px 3px 0 0;
    padding: 8px 12px;
    margin-right: 2px;
    margin-bottom: -1px;
    z-index: 10;
    user-select: none;

    cursor: pointer;

    ${props =>
        props.active &&
        css`
            border-bottom: none;
            background: #ffffff;
        `}
`;

const TabContent = styled(Flex)`
    background: #ffffff;
    border: 1px solid #e1e5ed;
    padding: 12px;
    flex: 1;
`;

function TabHeaders({tabs, activeTab, onClickTab}) {
    return (
        <Flex>
            {React.Children.map(tabs, (tab, i) => {
                if (!tab) {
                    return null;
                }

                return (
                    <TabHeader
                        key={tab.props.id}
                        active={activeTab ? activeTab == tab.props.id : i === 0}
                        onClick={onClickTab(tab.props.id)}
                    >
                        {tab.props.headerChildren || <H5>{tab.props.name}</H5>}
                    </TabHeader>
                );
            })}
        </Flex>
    );
}

TabbedView.propTypes = {
    children: PropTypes.node.isRequired,
    activeTab: PropTypes.any.isRequired,
    onTabChanged: PropTypes.func,
};

export default function TabbedView({children, activeTab, onTabChanged = () => {}}) {
    const onClickTab = usePartiallyAppliedCallback(tabId => onTabChanged(tabId), []);

    return (
        <Flex flex={1} flexDirection='column'>
            <TabHeaders tabs={children} activeTab={activeTab} onClickTab={onClickTab} />
            <TabContent>
                {React.Children.map(children, (child, i) => {
                    if (!child) {
                        return null;
                    }

                    if (!activeTab && i === 0) {
                        return child;
                    }

                    if (child.props.id === activeTab) {
                        return child;
                    }

                    return null;
                })}
            </TabContent>
        </Flex>
    );
}

Tab.propTypes = {
    id: PropTypes.any.isRequired,
    name: PropTypes.string,
    headerChildren: PropTypes.node,
};

export function Tab({children}) {
    return <>{children}</>;
}
