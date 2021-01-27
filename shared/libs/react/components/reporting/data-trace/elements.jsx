import React from 'react';
import styled from 'styled-components';
import {Box, Flex} from '@rebass/grid';
import {toUtcDateString} from 'components/reporting/data-trace/utils';
import Icon from 'components/basic/Icon';

export const QuestionMark = styled.div`
    display: inline-block;
    border-radius: 8px;
    background-color: #4a4a4a;
    color: #ffffff;
    width: 16px;
    height: 16px;
    align-content: center;
    margin-right: 3px;
    &::before {
        content: '?';
        padding-left: 6px;
    }
`;

export const ReadOnlyText = styled.div`
    margin-top: 6px;
    height: 308px;
    line-height: 1.5em;
    font-size: 1.2em;
    font-weight: 300;
    color: #000000;
    padding: 6px 0;
`;

export const BigBlueValue = styled(Box)`
    color: #107aa7;
    font-size: 1.6em;
`;

export const BigGreyValue = styled(Box)`
    color: #516174;
    font-size: 1.6em;
`;

export const Button = styled(Box)`
    text-align: center;
    color: #eaf3fd;
    font-weight: 300;
    cursor: pointer;
    user-select: none;
    background-color: #334050;
    padding: 6px;
    font-size: 1em;
`;

const StyledAsOfDate = styled.div`
    font-size: 0.9em;
    display: inline-flex;
    color: #4a4a4a;
    border: 1px solid rgb(190, 194, 213);
    background-color: #ffffff;
    text-transform: uppercase;
    padding: 4px 8px;
`;

export const BlueText = styled(Box)`
    color: rgb(3, 185, 211);
`;

export const AsOfDate = ({timestamp}) => {
    const date = new Date(timestamp * 1000);

    return (
        <StyledAsOfDate>
            <Box>AS OF DATE</Box>
            <BlueText ml={2}>{toUtcDateString(date)}</BlueText>
        </StyledAsOfDate>
    );
};

export const VerticalSeparator = styled.div`
    border-right: 1px solid #4b5666;
`;

export const StyledRow = styled(Flex)`
    color: #e4e8ee;
`;

export const DateBox = styled(Box)`
    font-size: ${({fontSize}) => fontSize || '1.2em'};
    text-align: right;
    color: #000000;
`;
export const TimeBox = styled(Box)`
    text-align: right;
    color: #4a4a4a;
`;

export const HeadingMixin = `
    margin: 0;
    padding: 0;
`;

export const Title = styled.h1`
    ${HeadingMixin}
    font-weight: 300;
    color: #4a4a4a;
`;

export const Name = styled.h2`
    ${HeadingMixin}
    padding-left: 4px;
    font-size: 2em;
    color: #000000;
`;
export const Version = styled.h2`
    ${HeadingMixin}
    padding-left: 4px;
    font-size: 2em;
    color: #4a4a4a;
`;

export const ScrollableList = styled(Box)`
    overflow-y: auto;
    height: 380px;
`;

export const ModalContent = styled.div`
    padding: 1em 1em 0;
    flex-direction: column;
    flex-grow: 1;
    min-width: 800px;
`;

export const Header = styled(Box)`
    border-bottom: 1px solid #566174;
    color: rgb(68, 68, 68);
`;

export const NoteIcon = styled(Icon)`
    font-size: 30px;
    color: ${({onClick}) => (onClick ? '#1ba1cc' : '#566174')};
    cursor: ${({onClick}) => (onClick ? 'pointer' : 'default')};
`;

export const Footer = styled(Flex)`
    justify-content: flex-end;
    border-top: 1px solid #566174;
    padding-top: 12px;
    margin-top: 12px;
`;

export const GreyLabel = styled.label`
    display: block;
    color: #4a4a4a;
    font-weight: 300;
    text-transform: ${({titleize}) => (titleize ? 'titleize' : 'uppercase')};
    margin-bottom: 8px;
`;

export const EditValueInput = styled.input`
    width: 100%;
    font-size: 1.8em;
    padding: 6px 10px;
    color: #1ba1cc;
    background-color: ${({theme}) => theme.input.wrapperBg};
    font-weight: 300;
    border: 1px solid rgba(86, 97, 116, 0.4);
    outline: none;
`;

export const NoteInput = styled.textarea`
    width: 100%;
    font-size: 1.2em;
    background-color: ${({theme}) => theme.input.wrapperBg};
    padding: 8px;
    color: #000000;
    font-weight: 300;
    border: 1px solid rgba(86, 97, 116, 0.4);
    resize: vertical;
    min-height: 200px;
    outline: none;
`;

export const ModeLink = styled.a`
    color: #4a4a4a;
    text-transform: uppercase;
    text-decoration: none;
    font-size: 0.8em;
    font-weight: 200;
    cursor: pointer;
    &:hover,
    :active {
        color: #000000;
        text-decoration: none;
    }
`;

export const ErrorReason = styled.div`
    color: #ff0000;
`;

export const MetricDescription = ({metricName, versionName}) => (
    <Flex alignItems='center'>
        <Title>Audit Trail - </Title>
        <Name>{metricName}</Name>
        {versionName && <Version>({versionName})</Version>}
    </Flex>
);

export const ModeToggle = ({onClick, children}) => {
    return (
        <ModeLink onClick={onClick}>
            <QuestionMark />
            {children}
        </ModeLink>
    );
};

export const NoHistory = () => (
    <Flex flexDirection='column' alignItems='center'>
        <Box my='100px'>
            <Title>No existing history...</Title>
        </Box>
    </Flex>
);
