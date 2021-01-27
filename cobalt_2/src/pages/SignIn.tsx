import React from 'react';
import {useEffect, useState} from 'react';

import Box from '@material-ui/core/Box';
import Fade from '@material-ui/core/Fade';

import Typography from 'material-ui-cobalt/Typography';

import SignInForm from './SignInForm';

interface ExpertTipCarouselProps {}

function ExpertTipCarousel({children}: React.PropsWithChildren<ExpertTipCarouselProps>) {
    const messageCount = React.Children.count(children);

    const [messageIdx, setMessageIdx] = useState<number>(Math.floor(Math.random() * messageCount));
    const [queuedMessageIdx, setQueuedMessageIdx] = useState<number | null>(null);

    useEffect(() => {
        const tick = () => {
            let newIdx = 0;
            do {
                newIdx = Math.floor(Math.random() * messageCount);
            } while (newIdx === messageIdx);
            setQueuedMessageIdx(newIdx);
        };

        let id = setTimeout(tick, 5000);
        return () => clearTimeout(id);
    }, [messageIdx]);

    const nextMessage = () => {
        if (queuedMessageIdx === null) {
            return;
        }

        setMessageIdx(queuedMessageIdx as number);
        setQueuedMessageIdx(null);
    };

    return (
        <>
            {React.Children.map(children, (child, idx) => {
                return (
                    idx === messageIdx && (
                        <Fade
                            timeout={1400}
                            in={queuedMessageIdx === null && idx === messageIdx}
                            onExited={nextMessage}
                        >
                            <div>
                                <Typography
                                    variant='h6'
                                    color='primary.very-light'
                                    fontWeight='bold'
                                >
                                    Expert Tip:
                                </Typography>
                                <Typography variant='subtitle1' color='primary.very-light'>
                                    {child}
                                </Typography>
                            </div>
                        </Fade>
                    )
                );
            })}
        </>
    );
}

export interface SignInProps {
    messageChildren: React.ReactNode;
}

export default function SignIn() {
    const message = (
        <>
            <Box mb={5}>
                <Typography variant='h1' color='primary.light' fontWeight='light'>
                    Welcome Back
                </Typography>
            </Box>
            <Box width={0.65}>
                <ExpertTipCarousel>
                    <Box>
                        Lorem ipsum dolor sit amet, consectetur{' '}
                        <Box display='inline' fontWeight='bold'>
                            Data Collection Activity{' '}
                        </Box>
                        adipiscing elit. Proin felis ante, gravida!
                    </Box>
                    <Box>
                        Lorem ipsum dolor sit amet, consectetur{' '}
                        <Box display='inline' fontWeight='bold'>
                            Reporting{' '}
                        </Box>
                        adipiscing elit. Proin felis ante, gravida!
                    </Box>
                    <Box>
                        Lorem ipsum dolor sit amet, consectetur{' '}
                        <Box display='inline' fontWeight='bold'>
                            Portfolio{' '}
                        </Box>
                        adipiscing elit. Proin felis ante, gravida!
                    </Box>
                </ExpertTipCarousel>
            </Box>
        </>
    );

    return <SignInForm messageChildren={message} />;
}
