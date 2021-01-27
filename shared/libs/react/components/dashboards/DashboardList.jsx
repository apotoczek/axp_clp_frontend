import React from 'react';
import {withRouter} from 'react-router';
import styled from 'styled-components';
import {Link} from 'react-router-dom';
import PropTypes from 'prop-types';

import * as Utils from 'src/libs/Utils';

import Loader from 'components/basic/Loader';

const Name = styled.div`
    padding-bottom: 8px;

    font-family: Lato, sans-serif;
    font-weight: 700;
    font-size: 15px;
    color: #ffffff;
    letter-spacing: 0.62px;
`;

// const Screenshot = styled.img`
//     background-color: #fefefe;
//     width: 100%;
//     height: 240px;
//     border-radius: 2px;
// `;

const Description = styled.p`
    font-family: Lato, sans-serif;
    font-weight: 300;
    font-size: 12px;
    color: #b6b6b6;
    line-height: 18px;

    overflow: hidden;
    text-overflow: ellipsis;

    margin: 0;
    padding: 8px 0;

    height: 70px;
`;

const Meta = styled.p`
    font-family: Lato, sans-serif;
    font-weight: 700;
    font-size: 11px;
    letter-spacing: 1px;
    color: #5b5b5b;

    margin: 0;
    padding: 0;
`;

const ListItemWrapper = styled.div`
    display: inline-block;
    position: relative;

    background: #2b3039;

    cursor: ${props => (props.edit ? 'pointer' : '')};

    width: 300px;
    overflow: auto;

    margin: 0 16px 16px 0;
    padding: 16px;

    border: 2px ${props => (props.edit ? 'solid' : 'none')};
    border-radius: 1px;
    border-color: ${props => (props.edit ? (props.selected ? '#F95532' : 'gray') : 'none')};

    &:hover {
        padding-left: 14px;
        border-left: 2px solid #f95532;
        color: inherit;

        transition: all 100ms ease-in-out;
    }
`;

const DashboardListItem = ({link_to, name, description, userName, selected, edit, onSelect}) => {
    if (!edit) {
        return (
            <Link to={link_to}>
                <ListItemWrapper edit={edit}>
                    <Name>{name}</Name>
                    {/* <Screenshot /> */}
                    <Description>{description || 'Description of dashboard'}</Description>
                    <Meta>Created by: {userName}</Meta>
                </ListItemWrapper>
            </Link>
        );
    }
    return (
        <ListItemWrapper edit={edit} selected={selected} onClick={onSelect}>
            <Name>{name}</Name>
            {/* <Screenshot /> */}
            <Description>{description || 'Description of dashboard'}</Description>
            <Meta>Created by: {userName}</Meta>
        </ListItemWrapper>
    );
};

const PageWrapper = styled.div`
    padding: 24px;
    flex: 1;
`;

DashboardListItem.propTypes = {
    link_to: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
};

const DashboardList = ({
    dashboards,
    loading,
    match,
    edit,
    selectedUid,
    onRemoveDashboard,
    onCopyDashboard,
    onSelectDashboard,
}) => {
    if (loading) {
        return <Loader />;
    }

    const dashboardListItems = dashboards.map(({uid, name, user_name, description}) => (
        <DashboardListItem
            key={uid}
            name={name}
            description={description}
            userName={user_name}
            link_to={Utils.joinUrl(match.url, uid)}
            onRemove={() => onRemoveDashboard(uid)}
            renderRemove
            onCopy={() => onCopyDashboard(uid)}
            edit={edit}
            selected={uid === selectedUid}
            onSelect={() => onSelectDashboard(uid)}
        />
    ));

    return <PageWrapper>{dashboardListItems}</PageWrapper>;
};

DashboardList.propTypes = {
    match: PropTypes.shape({
        url: PropTypes.string.isRequired,
    }).isRequired,
    dashboards: PropTypes.arrayOf(
        PropTypes.shape({
            name: PropTypes.string.isRequired,
            uid: PropTypes.string.isRequired,
            description: PropTypes.string,
        }),
    ).isRequired,
    onRemoveDashboard: PropTypes.func.isRequired,
    onCopyDashboard: PropTypes.func.isRequired,
    loading: PropTypes.bool.isRequired,
};

export default withRouter(DashboardList);
