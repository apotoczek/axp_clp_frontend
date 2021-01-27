import React from 'react';
import styled from 'styled-components';
import {Box, Flex} from '@rebass/grid';

import ConfirmDropdown from 'components/basic/forms/dropdowns/ConfirmDropdown';
import Button from 'components/basic/forms/Button';

const Action = styled(Button)`
    margin-left: 8px;
    flex: 0 1 auto;
`;

export default function CardActions({
    onViewSchedule,
    onReviewSubmission,
    onDeactivate,
    isRecurring,
}) {
    return (
        <Flex flex={1} justifyContent='flex-end'>
            {onViewSchedule && <Action onClick={onViewSchedule}>View Email Schedule</Action>}
            {onReviewSubmission && (
                <Action onClick={onReviewSubmission} primary>
                    Review
                </Action>
            )}
            <Box>
                {isRecurring ? (
                    <ConfirmDropdown
                        onConfirm={onDeactivate}
                        text='Are you sure you want to deactivate this recurring data request?'
                        subText='This action can not be undone.'
                    >
                        <Action>Deactivate</Action>
                    </ConfirmDropdown>
                ) : (
                    <ConfirmDropdown
                        onConfirm={onDeactivate}
                        text='Are you sure you want to delete this data request?'
                        subText='This action can not be undone.'
                    >
                        <Action>Delete</Action>
                    </ConfirmDropdown>
                )}
            </Box>
        </Flex>
    );
}
