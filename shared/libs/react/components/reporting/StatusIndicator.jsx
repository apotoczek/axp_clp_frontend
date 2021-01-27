import React from 'react';
import styled from 'styled-components';

import Icon from 'components/basic/Icon';

const StyledIndicator = styled.div`
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 10px;
`;

const IndicatorIcon = styled(Icon)`
    margin-left: 5px;
    margin-top: 2px;
    color: ${({theme, status}) => (status ? theme.text.success : theme.text.error)};
`;

const IndicatorLabel = styled.span`
    color: #efefef;
`;

export default function StatusIndicator({status, label}) {
    return (
        <StyledIndicator status={status}>
            <IndicatorLabel>{label}</IndicatorLabel>
            <IndicatorIcon status={status} glyphicon name={status ? 'ok' : 'remove'} />
        </StyledIndicator>
    );
}
