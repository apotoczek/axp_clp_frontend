import React from 'react';
import styled from 'styled-components';
import {Flex} from '@rebass/grid';

import NumberInput from 'components/basic/forms/input/NumberInput';
import Icon from 'components/basic/Icon';

const ZoomControlWrapper = styled(Flex)`
    background: ${({theme}) => theme.input.wrapperBg};
    color: ${({theme}) => theme.input.labelFg};
    display: flex;
    align-items: center;
    position: absolute;
    right: 24px;
    bottom: 24px;
    width: 200px;

    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.16), 0 1px 3px rgba(0, 0, 0, 0.23);
    border: 1px solid ${({theme}) => theme.input.border};

    z-index: 9000;
`;

export default function ZoomControl({value, onZoomChanged}) {
    return (
        <ZoomControlWrapper flexDirection='row'>
            <Icon
                ml={3}
                pt={1}
                name='zoom-out'
                bisonicon
                size={18}
                button
                disabled={value <= 10}
                onClick={() => onZoomChanged(value - 10)}
            />
            <Icon
                ml={3}
                pt={1}
                name='zoom-in'
                bisonicon
                size={18}
                button
                disabled={value >= 300}
                onClick={() => onZoomChanged(value + 10)}
            />
            <Flex ml={2} flex={2}>
                <NumberInput
                    min={1}
                    max={300}
                    value={value}
                    rightLabel='%'
                    noBorder
                    onValueChanged={onZoomChanged}
                />
            </Flex>
        </ZoomControlWrapper>
    );
}
