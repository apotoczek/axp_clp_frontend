import React from 'react';

import Box from '@material-ui/core/Box';

import Typography from 'material-ui-cobalt/Typography';

import SignInForm from './SignInForm';

// @ts-ignore
import steppedAway from 'img/stepped_away.svg';

export default function AutoSignOut() {
    const message = (
        <>
            <Box mb={5}>
                <img src={steppedAway} />
            </Box>
            <Box mb={5}>
                <Typography variant='h3' color='primary.light' fontWeight='light'>
                    Looks like you stepped away.
                </Typography>
            </Box>
            <Box maxWidth={0.75}>
                <Typography variant='subtitle1' color='primary.very-light'>
                    We have signed you out to keep your account secure.
                </Typography>
            </Box>
        </>
    );

    return <SignInForm messageChildren={message} />;
}
