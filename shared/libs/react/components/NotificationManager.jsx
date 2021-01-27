import React, {useCallback, useState, useMemo} from 'react';
import styled from 'styled-components';
import {Flex} from '@rebass/grid';
import uuid from 'uuid/v4';
import {CSSTransition, TransitionGroup} from 'react-transition-group';

import {NotificationContext} from 'contexts';

import {NotificationType} from 'src/libs/Enums';

import {H5} from 'components/basic/text';
import Icon from 'components/basic/Icon';

export default function NotificationManager({children}) {
    const [notifications, setNotifications] = useState([]);

    const add = useCallback((notification, removeAfter = 5000) => {
        notification.id = uuid();
        setNotifications(prevNotifications => ({
            ...prevNotifications,
            [notification.id]: notification,
        }));
        setTimeout(() => setNotifications(({[notification.id]: _, ...rest}) => rest), removeAfter);
    }, []);

    const context = useMemo(() => ({add}), [add]);
    return (
        <NotificationContext.Provider value={context}>
            {children}
            <NotificationCenter notifications={notifications} />
        </NotificationContext.Provider>
    );
}

const NotificationWrapper = styled(Flex)`
    position: fixed;
    bottom: 16px;
    right: 16px;
    width: 400px;
`;

const Notification = styled(Flex)`
    background-color: ${props => props.theme.notifications[props.type].bg};
    color: ${props => props.theme.notifications[props.type].fg};
    padding-right: 16px;
    border-radius: 3px;

    &.slide-in-enter {
        opacity: 0;
        transform: translateY(50%);
    }

    &.slide-in-enter-active {
        opacity: 1;
        transform: translateY(0);
        transition: transform 350ms ease-in-out, opacity 350ms ease-in-out;
    }

    &.slide-in-exit {
        opacity: 1;
        transform: translateY(0);
    }

    &.slide-in-exit-active {
        opacity: 0;
        transform: translateY(50%);
        transition: transform 350ms ease-in-out, opacity 350ms ease-in-out;
    }
`;

const NotificationText = styled(Flex)`
    padding: 12px;
    /* justify-content: center; */
    flex-direction: column;
`;

const Title = styled(H5)`
    color: inherit;
    font-weight: 700;
    margin-bottom: 4px;
`;

const Message = styled.span`
    color: inherit;
`;

function NotificationCenter({notifications}) {
    return (
        <NotificationWrapper flexDirection='column'>
            <TransitionGroup>
                {Object.entries(notifications).map(([id, notification]) => (
                    <CSSTransition key={id} timeout={350} classNames='slide-in' unmountOnExit>
                        <Notification type={notification.type} mt={2}>
                            <NotificationIcon type={notification.type} />
                            <NotificationText>
                                <Title mb={2}>{notification.title}</Title>
                                <Message>{notification.message}</Message>
                            </NotificationText>
                        </Notification>
                    </CSSTransition>
                ))}
            </TransitionGroup>
        </NotificationWrapper>
    );
}

const IconBox = styled(Flex)`
    justify-content: center;
    background-color: ${props => props.theme.notifications[props.type].darkBg};
    border-top-left-radius: 3px;
    border-bottom-left-radius: 3px;
    color: rgba(255, 255, 255, 0.8);
    padding: 6px 10px;
`;

function NotificationIcon({type}) {
    let icon;
    if (type === NotificationType.Error) {
        icon = <Icon name='remove' glyphicon />;
    } else if (type === NotificationType.Warning) {
        icon = <Icon name='alert' glyphicon />;
    } else if (type === NotificationType.Info) {
        icon = <Icon name='info-sign' glyphicon />;
    } else if (type === NotificationType.Success) {
        icon = <Icon name='ok' glyphicon />;
    }

    return <IconBox type={type}>{icon}</IconBox>;
}
