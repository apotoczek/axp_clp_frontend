import React from 'react';

import Box from '@material-ui/core/Box';

import Typography from 'material-ui-cobalt/Typography';

import SignInForm from './SignInForm';

// @ts-ignore
import signOut from 'img/sign_out.svg';

export default function SignOut() {
    const message = (
        <>
            <Box mb={5}>
                <img src={signOut} />
            </Box>
            <Box mb={5}>
                <Typography variant='h3' color='primary.light' fontWeight='light'>
                    You have signed out
                </Typography>
            </Box>
            <Box maxWidth={0.75}>
                <Typography variant='subtitle1' color='primary.very-light'>
                    Enjoy your day!
                </Typography>
            </Box>
        </>
    );

    return <SignInForm messageChildren={message} />;
}
