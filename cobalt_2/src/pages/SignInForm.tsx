import React from 'react';
import styled from 'styled-components';

import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Grid from '@material-ui/core/Grid';
import Box from '@material-ui/core/Box';

import Link from 'material-ui-cobalt/Link';

// @ts-ignore
import logoTextWhite from 'img/logo_text_white.svg';
// @ts-ignore
import signInWaves from 'img/sign_in_waves.svg';

import {backend} from 'api/cobalt';
import {isSet} from 'utils/utils';

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
    overflow: hidden;
    position: relative;
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

const Footer = styled(Box)`
    height: 73px;
    background: #0a1f42;
`;

const WaveLogo = styled.img`
    position: absolute;
    bottom: 0;
    width: 100%;

    @media screen and (min-width: 1500px) {
        margin-bottom: -32px;
    }
    @media screen and (min-width: 1650px) {
        margin-bottom: -96px;
    }
`;

interface FormProps {
    onSignInSubmit: (event: React.FormEvent | React.MouseEvent) => void;
    email: string;
    password: string;
    onChangeEmail: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    onChangePassword: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

function Form({onSignInSubmit, email, password, onChangeEmail, onChangePassword}: FormProps) {
    return (
        <form onSubmit={onSignInSubmit}>
            <Box mb={6} display='flex' alignItems='center' justifyContent='center'>
                <img src={logoTextWhite} />
            </Box>
            <Box mb={3}>
                <DarkTextField
                    fullWidth
                    variant='filled'
                    label='Email'
                    size='small'
                    value={email}
                    onChange={onChangeEmail}
                />
            </Box>
            <Box mb={3}>
                <DarkTextField
                    fullWidth
                    variant='filled'
                    label='Password'
                    size='small'
                    type='password'
                    color='primary'
                    autoComplete='password'
                    value={password}
                    onChange={onChangePassword}
                />
            </Box>
            <Box mb={3}>
                <Button
                    type='submit'
                    fullWidth
                    variant='contained'
                    color='primary'
                    disableElevation
                    size='large'
                    onClick={onSignInSubmit}
                >
                    Log In
                </Button>
            </Box>
            <Box display='flex' justifyContent='center'>
                <Link variant='caption' color='secondary.light' href='#'>
                    Forgot Password?
                </Link>
            </Box>
        </form>
    );
}

export interface SignInFormProps {
    messageChildren?: React.ReactNode;
}

interface SignInFormState {
    email: string;
    password: string;
}

export default class SignInForm extends React.Component<SignInFormProps, SignInFormState> {
    constructor(props: SignInFormProps) {
        super(props);

        this.state = {
            email: '',
            password: '',
        };
    }

    onSignInSubmit(event: React.FormEvent | React.MouseEvent) {
        event.preventDefault();

        if (!isSet(this.state.email)) {
            return;
        }

        if (!isSet(this.state.password)) {
            return;
        }

        backend.post('auth/sign_in', {
            email: this.state.email,
            password: this.state.password,
        });
    }

    onChangeEmail = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        return this.setState({email: event.target.value});
    };

    onChangePassword = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        return this.setState({password: event.target.value});
    };

    render() {
        return (
            <FullPage container>
                <LeftPanel container item xs={8} alignItems='center'>
                    <Box
                        flex={1}
                        display='flex'
                        alignItems='center'
                        justifyContent='center'
                        flexDirection='column'
                    >
                        {this.props.messageChildren}
                    </Box>
                    <WaveLogo src={signInWaves} />
                </LeftPanel>
                <Grid container item direction='column' xs={4}>
                    <FormBackground
                        display='flex'
                        flex={1}
                        alignItems='center'
                        justifyContent='center'
                    >
                        <Grid container item xs={8} direction='column'>
                            <Form
                                onSignInSubmit={this.onSignInSubmit.bind(this)}
                                email={this.state.email}
                                password={this.state.password}
                                onChangeEmail={this.onChangeEmail}
                                onChangePassword={this.onChangePassword}
                            />
                        </Grid>
                    </FormBackground>
                    <Footer display='flex' alignItems='center' justifyContent='flex-end'>
                        <Box mr={4}>
                            <Link
                                variant='caption'
                                color='secondary.light'
                                href='#'
                                fontWeight='bold'
                            >
                                Terms of Use
                            </Link>
                        </Box>
                        <Box mr={4}>
                            <Link
                                variant='caption'
                                color='secondary.light'
                                href='#'
                                fontWeight='bold'
                            >
                                Privacy Policy
                            </Link>
                        </Box>
                    </Footer>
                </Grid>
            </FullPage>
        );
    }
}
