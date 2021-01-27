import React from 'react';
import styled from 'styled-components';
import Icon from 'components/basic/Icon';
import {Flex} from '@rebass/grid';
import {H1, Description} from 'components/basic/text';

const Wrapper = styled(Flex)`
    width: 100%;
    height: 100%;

    overflow: hidden;

    justify-content: center;
    align-items: center;
    flex-direction: column;

    color: ${props => (props.dark && '#212428') || '#F5F5F5'};
`;

export default function Error({title, body, icon = 'attention'}) {
    return (
        <Wrapper>
            <Icon name={icon} size={100} />
            <H1>{title}</H1>
            <Description>{body}</Description>
        </Wrapper>
    );
}
