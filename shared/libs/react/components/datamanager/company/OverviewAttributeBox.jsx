import React from 'react';
import {Box, Flex} from '@rebass/grid';
import {Label} from 'components/basic/forms/base';
import styled from 'styled-components';
import Icon from 'components/basic/Icon';

import MemberLabelBox from 'components/datamanager/company/MemberLabelBox';

const MemberBox = styled(Flex)`
    padding: 12px 15px;
    margin: 5px 0;
    border: 1px solid ${({theme}) => theme.input.border};
    color: ${({theme}) => theme.multiLevelSelector.memberBoxFg};
    background: ${({theme}) => theme.expandedTableRow.fg};
    justify-content: space-between;
    align-items: center;
`;

export default function OverviewAttributeBox({
    attribute,
    values,
    toggleEditModal,
    toggleDeleteModal,
    writeAccess,
}) {
    return (
        <Flex key={attribute.uid} flexDirection='row' alignItems='center'>
            <MemberBox flex={1}>
                <Flex>
                    <Box mx={3}>
                        <Label>{attribute.name}</Label>
                    </Box>
                    <MemberLabelBox attribute={attribute} values={values} />
                </Flex>
                <Icon
                    mx={3}
                    name='edit'
                    glyphicon
                    buttonDark
                    disabled={!writeAccess}
                    onClick={toggleEditModal(attribute.uid)}
                />
            </MemberBox>
            <Icon
                right
                name='option-vertical'
                glyphicon
                buttonDark
                disabled={!writeAccess}
                onClick={toggleDeleteModal(attribute.uid)}
            />
        </Flex>
    );
}
