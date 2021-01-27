import React from 'react';
import styled, {css} from 'styled-components';

import Icon from 'components/basic/Icon';
import {Box, Flex} from '@rebass/grid';

import FilterableDropdownList from 'components/basic/forms/dropdowns/FilterableDropdownList';

const Row = styled(Flex)`
    border: 1px solid ${({theme}) => theme.reportingMandates.tableRowBorder};
    border-top: 0;
    color: ${({theme, enabled}) =>
        enabled ? theme.reportingMandates.tableRowFg : theme.reportingMandates.tableRowDisabledFg};
    background-color: ${({theme}) => theme.reportingMandates.tableRowBg};
`;

const Header = styled(Flex)`
    font-size: 12px;
    color: ${({theme}) => theme.reportingMandates.tableHeaderFg};
    border-bottom: 1px solid ${({theme}) => theme.reportingMandates.tableHeaderBorder};
    background-color: ${({theme}) => theme.reportingMandates.tableHeaderBg};
    text-transform: uppercase;
    letter-spacing: 0.86px;
`;

const Badge = styled.span`
    background-color: ${({theme, enabled}) =>
        enabled ? theme.reportingMandates.badgeBg : theme.reportingMandates.badgeDisabledBg};
    color: ${({theme}) => theme.reportingMandates.badgeFg};
    padding: 3px 2px 3px 7px;
    border-radius: 2px;
    font-size: 14px;
    margin-right: 5px;
`;

const Column = styled(Flex)`
    padding: 5px;

    ${({disabled}) =>
        disabled &&
        css`
            opacity: 0.5;
            pointer-events: none;
        `}
`;

const HeaderColumn = styled(Column)`
    padding: 10px 5px;
    &:last-child {
        padding-right: 15px;
    }
    &:first-child {
        padding-left: 15px;
    }
`;

const Label = styled(Box)`
    font-size: 14px;
`;

const EmptyLabel = styled(Label)`
    font-style: italic;
`;

const RemoveIcon = styled(Icon)`
    cursor: pointer;
`;

const NotificationTableForm = ({notifications, users, onNotificationChanged}) => {
    const addUser = notification => uid => {
        const newUsers = [
            ...notification.users,
            {uid: uid, name: users.find(u => u.uid === uid).name},
        ];

        onNotificationChanged({
            ...notification,
            users: newUsers,
        });
    };

    const removeUser = (notification, idx) => {
        const newUsers = [
            ...notification.users.slice(0, idx),
            ...notification.users.slice(idx + 1),
        ];

        onNotificationChanged({
            ...notification,
            users: newUsers,
        });
    };

    const userOptions = notification => {
        const existing = new Set(notification.users.map(({uid}) => uid));

        return users.filter(({uid}) => !existing.has(uid));
    };

    return (
        <Flex flexDirection='column' width={1}>
            <Header width={1}>
                <HeaderColumn width={250}>Notification</HeaderColumn>
                <HeaderColumn flex={1}>Users</HeaderColumn>
                <HeaderColumn width={150}>Action</HeaderColumn>
            </Header>
            <Box flex={1}>
                {notifications.map(notification => (
                    <Row key={notification.event_type} enabled={notification.users.length}>
                        <Column width={250} alignItems='center'>
                            <Label ml={10}>{notification.name}</Label>
                        </Column>
                        <Column flex={1} alignItems='center'>
                            <Box flex={1}>
                                {notification.users.length ? (
                                    notification.users.map((user, idx) => (
                                        <Badge enabled key={user.uid}>
                                            {user.name}
                                            <RemoveIcon
                                                name='cancel-circled'
                                                onClick={() => removeUser(notification, idx)}
                                            />
                                        </Badge>
                                    ))
                                ) : (
                                    <EmptyLabel>Add users to enable notification</EmptyLabel>
                                )}
                            </Box>
                        </Column>
                        <Column width={150} alignItems='center'>
                            <FilterableDropdownList
                                small
                                success
                                valueKey='uid'
                                labelKey='name'
                                leftLabel='Add User'
                                options={userOptions(notification)}
                                onValueChanged={addUser(notification)}
                            />
                        </Column>
                    </Row>
                ))}
            </Box>
        </Flex>
    );
};

export default NotificationTableForm;
