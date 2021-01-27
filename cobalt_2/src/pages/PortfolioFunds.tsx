import React from 'react';
import styled from 'styled-components';

import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Grid from '@material-ui/core/Grid';
import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';

const FullPage = styled(Grid)`
    height: 100%;
`;

const FormBackground = styled(Box)`
    background: #1a3a67;
    background: linear-gradient(0deg, #1a3a67 0%, #091e42 100%);
`;

const LeftPanel = styled(Grid)`
    background: #1b3966;
    background: linear-gradient(90deg, #1b3966 0%, #1d3e7a 100%);
`;

const DarkTextField = styled(TextField)`
    & .MuiFilledInput-root {
        color: #ffffff;
        background-color: rgba(255, 255, 255, 0.05);
    }

    & .MuiFilledInput-root:focus-within {
        background-color: rgba(255, 255, 255, 0.15);
    }

    & .MuiInputLabel-root {
        color: #ffffff;
    }

    & .MuiFilledInput-underline::after {
        border-bottom: 2px solid #ffffff;
    }

    & .MuiFilledInput-underline::before {
        border-bottom: 1px solid #ffffff;
    }
`;

const Footer = styled(Grid)`
    height: 73px;
    background: #0a1f42;
`;

export interface SignInProps {}

export default class SignIn extends React.Component<SignInProps, {}> {
    render() {
        return (
            <FullPage container>
                <LeftPanel
                    container
                    item
                    xs={8}
                    alignItems='center'
                    justify='center'
                    direction='column'
                    spacing={4}
                >
                    <Grid item>
                        <Typography variant='h1' color='primary'>
                            Welcome Back
                        </Typography>
                    </Grid>
                    <Grid item>
                        <Typography variant='h6' color='primary'>
                            Expert Tip:
                        </Typography>
                        <Typography variant='subtitle1' color='textSecondary'>
                            Lorem ipsum dolor sit amet, consectetur Data Collection Activity
                            adipiscing elit. Proin felis ante, gravida!
                        </Typography>
                    </Grid>
                </LeftPanel>
                <Grid container item direction='column' xs={4}>
                    <FormBackground
                        display='flex'
                        flex={1}
                        alignItems='center'
                        justifyContent='center'
                    >
                        <Grid container xs={8} direction='column' spacing={3}>
                            <Grid item>
                                <DarkTextField
                                    fullWidth
                                    variant='filled'
                                    label='Email'
                                    size='small'
                                />
                            </Grid>
                            <Grid item>
                                <DarkTextField
                                    fullWidth
                                    variant='filled'
                                    label='Password'
                                    size='small'
                                    type='password'
                                    color='primary'
                                />
                            </Grid>
                            <Grid item>
                                <Button
                                    fullWidth
                                    variant='contained'
                                    color='primary'
                                    disableElevation
                                    size='large'
                                >
                                    Log In
                                </Button>
                            </Grid>
                        </Grid>
                    </FormBackground>
                    <Footer container alignItems='center' justify='flex-end'>
                        <Grid item>Terms of Use</Grid>
                        <Grid item>Privacy Policy</Grid>
                    </Footer>
                </Grid>
            </FullPage>
        );
    }
}
