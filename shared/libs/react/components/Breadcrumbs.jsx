import React from 'react';
import PropTypes from 'prop-types';

import styled, {css} from 'styled-components';
import {Link} from 'react-router-dom';

const BreadcrumbLink = styled(Link)`
    text-decoration: none;
    &:hover {
        text-decoration: none;
    }
`;

const A = styled.a`
    text-decoration: none;
    &:hover {
        text-decoration: none;
    }
`;

export const NonRouterLink = ({to, ...rest}) => <A href={to} {...rest} />;

const BreadcrumbItem = styled.div`
    display: inline;
    color: ${({theme}) => theme.breadcrumbFg};

    font-weight: ${props => (props.isLink ? '400' : '200')};
    font-size: 16px;
    line-height: 33px;

    ${({divider}) =>
        divider &&
        css`
        &:after {
            content: '${divider}';
            padding: 5px 10px;
        }
    `}
`;

const BreadcrumbsWrapper = styled.div`
    height: 33px;
    background: ${({theme}) => theme.breadcrumbBg};

    padding: 0 10px;
`;

const ItemWrapper = ({name, linkTo, divider, linkComponent: LinkComponent}) => {
    const item = (
        <BreadcrumbItem isLink={linkTo} divider={divider}>
            {name}
        </BreadcrumbItem>
    );
    if (linkTo) {
        return <LinkComponent to={linkTo}>{item}</LinkComponent>;
    }

    return item;
};

const Breadcrumbs = ({path, urls = [], linkComponent = BreadcrumbLink}) => (
    <BreadcrumbsWrapper>
        {path.map((name, idx) => (
            <ItemWrapper
                key={name}
                name={name}
                linkTo={urls[idx]}
                divider={idx != path.length - 1 ? '/' : undefined}
                linkComponent={linkComponent}
            />
        ))}
    </BreadcrumbsWrapper>
);
Breadcrumbs.propTypes = {
    path: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
    urls: PropTypes.arrayOf(PropTypes.string),
};

export default Breadcrumbs;
