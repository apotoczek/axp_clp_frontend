import React from 'react';
import PropTypes from 'prop-types';
import {Flex} from '@rebass/grid';
import styled from 'styled-components';
import {Link} from 'react-router-dom';

const A = styled.a`
    text-decoration: none;
    &:hover {
        text-decoration: none;
    }
`;

export const NonRouterLink = ({to, ...rest}) => <A href={to} {...rest} />;

import Icon from 'components/basic/Icon';

const Button = styled.button`
    display: inline-block;
    height: 100%;
    padding: 6px 15px;

    font-size: 14px;
    text-align: center;
    white-space: nowrap;
    vertical-align: middle;

    border: 0;
    border-radius: 0;

    touch-action: manipulation;
    user-select: none;
    cursor: pointer;

    color: ${({theme}) => theme.toolBarFg};

    background-color: transparent;
    border-top: 1px solid ${({theme}) => theme.toolBarBg};

    &:hover {
        background-color: ${({theme}) => theme.toolBarHover};
    }

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    &:focus {
        outline: none;
    }
`;

const Item = ({icon, glyphicon, children, ...rest}) => (
    <Button {...rest}>
        {icon && <Icon name={icon} glyphicon={glyphicon} right />}
        {children}
    </Button>
);
Item.propTypes = {
    icon: PropTypes.string,
    children: PropTypes.node,
};

export const ToolbarItem = ({to, linkComponent: LinkComponent = Link, ...rest}) => {
    if (to) {
        return (
            <LinkComponent to={to}>
                <Item {...rest} />
            </LinkComponent>
        );
    }

    return <Item {...rest} />;
};

ToolbarItem.propTypes = {
    to: PropTypes.string,
};

const ToolbarWrapper = styled(Flex)`
    background-color: ${({theme}) => theme.toolBarBg};
    height: 40px;
`;

export default function Toolbar({children}) {
    const leftChildren = React.Children.map(children, child =>
        child && child.props.right ? null : child,
    );
    const rightChildren = React.Children.map(children, child =>
        child && child.props.right ? child : null,
    );

    return (
        <ToolbarWrapper>
            <Flex flex={1}>{leftChildren}</Flex>
            <Flex>{rightChildren}</Flex>
        </ToolbarWrapper>
    );
}
