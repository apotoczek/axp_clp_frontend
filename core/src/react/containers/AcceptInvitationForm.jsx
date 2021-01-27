import React, {useCallback, useState} from 'react';
import {useParams} from 'react-router-dom';
import styled from 'styled-components';
import {Box, Flex} from '@rebass/grid';
import {oneLine} from 'common-tags';

import config from 'config';

import {useBackendData, useBackendEndpoint} from 'utils/backendConnect';

import {Viewport, Page} from 'components/layout';
import Loader from 'src/libs/react/components/basic/Loader';
import {H1, H2, Description, HelpText, Link} from 'components/basic/text';
import Button from 'components/basic/forms/Button';

import Input from 'components/basic/forms/input/Input';
import TextInput from 'components/basic/forms/input/TextInput';
import Icon from 'components/basic/Icon';
import TextDropdown from 'components/basic/forms/dropdowns/TextDropdown';

const Header = styled(Box)`
    text-align: center;
`;

const ContentWrapper = styled(Box)`
    padding: 20px 0;
    background-color: #414957;
    box-shadow: 0 2px 2px rgba(0, 0, 0, 0.3);
    border-radius: 2px;
`;

const EmailHelpText = styled(HelpText)`
    font-size: 15px;
`;

const EMAIL_TEXT_CONTENT = oneLine`
    To verify your identity, please enter the email
    address to which you recieved the invitation.
`;

function Form({invitationData, email, emailError, onEmailChanged, onAccept}) {
    const {
        inviting_client_name,
        company_name,
        first_name,
        last_name,
        is_existing_user,
    } = invitationData;

    const isValidEmail = email && email.length;

    const name = `${first_name} ${last_name}`;

    const acceptBtnTxt = is_existing_user
        ? 'Accept Invitation & Continue'
        : 'Accept Invitation & Sign Up';

    return (
        <>
            <Header px={4}>
                <img src={config.logo_urls.vertical} style={config.public_logo_style} alt='Logo' />
                <H2>Invitation to submit data to</H2>
                <H1>{inviting_client_name}</H1>
                <Description>
                    You have been invited to submit data to &quot;{inviting_client_name}&quot;.
                    <br />
                    Review the information below and click &quot;{acceptBtnTxt}&quot; to accept the
                    invitation.
                </Description>
            </Header>
            <Flex m={4} flexDirection='column'>
                <Input mb={2} leftLabel='Your Company' value={company_name} />
                <Input mb={2} leftLabel='Your Name' value={name} />
                <Flex mt={3} justifyContent='center'>
                    <EmailHelpText>
                        Verify your email address
                        <TextDropdown content={EMAIL_TEXT_CONTENT}>
                            <Icon name='help-circled' />
                        </TextDropdown>
                    </EmailHelpText>
                </Flex>
                <TextInput
                    mb={2}
                    leftLabel='Email'
                    value={email}
                    onValueChanged={onEmailChanged}
                    placeholder='Enter your email address here'
                    error={emailError && 'Invalid email'}
                />
                <Button primary disabled={!isValidEmail} onClick={onAccept}>
                    {acceptBtnTxt}
                </Button>
            </Flex>
        </>
    );
}

function Accepted({email, isExisting, onClickSignIn}) {
    return isExisting ? (
        <AcceptedExisting onClickSignIn={onClickSignIn} />
    ) : (
        <AcceptedNewUser email={email} />
    );
}

function AcceptedNewUser({email}) {
    return (
        <>
            <Header px={4} pb={4}>
                <img src={config.logo_urls.vertical} style={config.public_logo_style} alt='Logo' />
                <H2>Invitation Accepted</H2>
                <Description>
                    An activation email has been sent to &quot;{email}&quot;
                    <br />
                    Click the link in the email to activate your account
                </Description>
            </Header>
        </>
    );
}

function AcceptedExisting({onClickSignIn}) {
    return (
        <>
            <Header px={4} pb={4}>
                <img src={config.logo_urls.vertical} style={config.public_logo_style} alt='Logo' />
                <H2>Invitation Accepted</H2>
                <Description>
                    Sign in to your account to continue
                    <br />
                    <Link onClick={onClickSignIn}>Click here to sign in now</Link>
                </Description>
            </Header>
        </>
    );
}

function InvalidToken() {
    return (
        <Viewport>
            <Page justifyContent='space-around' alignItems='center'>
                <ContentWrapper width={[1, 1, 1 / 2, 1 / 3]}>
                    <Header px={4} pb={4}>
                        <img
                            src={config.logo_urls.vertical}
                            style={config.public_logo_style}
                            alt='Logo'
                        />
                        <H2>Invitation not found</H2>
                        <Description>
                            The invitation you tried to access does not exist, has already been
                            accepted, or has been withdrawn
                        </Description>
                    </Header>
                </ContentWrapper>
            </Page>
        </Viewport>
    );
}

export default function AcceptInvitationForm() {
    const {uid: token_uid} = useParams();
    const [email, setEmail] = useState('');
    const [accepted, setAccepted] = useState(false);

    const {data, error: dataError, isLoading: isDataLoading} = useBackendData(
        'reporting/get-invitation-data',
        {token_uid},
        {requiredParams: ['token_uid']},
    );

    const {
        error: submitError,
        isLoading: isAccepting,
        triggerEndpoint: acceptInvitation,
    } = useBackendEndpoint('reporting/actions/accept-invitation', {
        statusCheck: false,
        action: true,
    });

    const handleAccept = useCallback(() => {
        acceptInvitation({
            token_uid,
            email,
        }).then(() => {
            setAccepted(true);
        });
    }, [acceptInvitation, email, token_uid]);

    const handleClickSignIn = useCallback(() => {
        window.location.replace(config.sign_in_url);
    }, []);

    if (isDataLoading || isAccepting) {
        return <Loader />;
    }

    const error = dataError || submitError;

    if (error == 'invalid_token') {
        return <InvalidToken />;
    }

    return (
        <Viewport>
            <Page justifyContent='space-around' alignItems='center'>
                <ContentWrapper width={[1, 1, 1 / 2, 1 / 3]}>
                    {accepted ? (
                        <Accepted
                            email={email}
                            isExisting={data.is_existing_user}
                            onClickSignIn={handleClickSignIn}
                        />
                    ) : (
                        <Form
                            invitationData={data}
                            email={email}
                            emailError={submitError && submitError === 'invalid_email'}
                            onEmailChanged={setEmail}
                            onAccept={handleAccept}
                        />
                    )}
                </ContentWrapper>
            </Page>
        </Viewport>
    );
}
