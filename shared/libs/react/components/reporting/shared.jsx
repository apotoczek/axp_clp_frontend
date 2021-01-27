import React from 'react';
import {Box, Flex} from '@rebass/grid';
import {H1, H2, Description} from 'components/basic/text';
import {Page, Content} from 'components/layout';
import {LightTheme} from 'themes';
import styled from 'styled-components';
import Button from 'components/basic/forms/Button';
import NumberInput from 'components/basic/forms/input/NumberInput';
import DropdownList from 'components/basic/forms/dropdowns/DropdownList';
import {epoch_to_date} from 'src/libs/Utils';

export const RequestColors = {
    success: '#3AC376',
    warning: '#F39C12',
    danger: '#C33A3A',
};

const UploadColors = {
    PROCESSING: '#FFA500',
    PROCESSED: '#39BEE5',
    APPROVED: '#3AC376',
};

export const WizardStep = {
    Start: 1,
    ReviewUpload: 2,
    SubmitReport: 3,
    AcknowledgeReport: 4,
};

export const UploadStep = {
    Upload: 1,
    ViewSubmission: 2,
};

export const SubmissionStatus = {
    Pending: 1,
    Approved: 2,
    Rejected: 3,
};

export const RequestStatus = {
    Pending: 1,
    Requested: 2,
    Due: 3,
    Overdue: 4,
    PendingApproval: 5,
    ChangesRequested: 6,
    Approved: 7,
};

export const UploadStatus = {
    Processing: 1,
    Processed: 2,
    Approved: 3,
};

export const RequestStatusOptions = [
    {
        label: 'Awaiting Submission',
        value: 1,
        statuses: [RequestStatus.Pending, RequestStatus.Requested],
        state: 'warning',
    },
    {
        label: 'Pending Approval',
        value: 2,
        statuses: [RequestStatus.PendingApproval],
        state: 'warning',
    },
    {
        label: 'Due',
        value: 3,
        statuses: [RequestStatus.Due, RequestStatus.Overdue],
        state: 'danger',
    },
    {
        label: 'Approved',
        value: 4,
        statuses: [RequestStatus.Approved],
        state: 'success',
    },
    {
        label: 'Changes Requested',
        value: 5,
        statuses: [RequestStatus.ChangesRequested],
        state: 'danger',
    },
];

export const formatRequestStatus = (statusText, state) => {
    const color = RequestColors[state] || '#FEFEFE';

    return <span style={{color: color}}>{statusText}</span>;
};

export const formatUploadStatus = value => {
    const upperValue = value.toUpperCase();

    const color = UploadColors[upperValue] || '#FEFEFE';

    return <span style={{color: color}}>{upperValue}</span>;
};

export function genRequestDefaults(request) {
    const today = new Date();

    if (request) {
        const dueDate = new Date(request.due_date * 1000);

        return {
            templateUid: request.template.uid,
            dueDate: dueDate > today ? dueDate : today,
        };
    }

    return {
        templateUid: null,
        dueDate: today,
    };
}

const ReportingMetaWrapper = styled(Flex)`
    color: #000000;
    flex: 1;
    margin-bottom: 10px;

    &:last-child {
        margin-bottom: 0;
    }
`;

const ReportingMetaLabel = styled.span`
    font-weight: 700;
    text-transform: uppercase;
    font-size: 13px;
    letter-spacing: 1px;
    width: 150px;
`;

const ReportingMetaValue = styled(Box)`
    flex: 1;
    font-size: 14px;
    color: #444444;
`;

export const ModalButton = styled(Button)`
    text-align: center;
`;

export const ReportingMeta = ({value, label}) => (
    <ReportingMetaWrapper>
        <ReportingMetaLabel>{label}</ReportingMetaLabel>
        <ReportingMetaValue>{value}</ReportingMetaValue>
    </ReportingMetaWrapper>
);

export const MetaInfo = styled(Box)`
    font-size: 15px;
    letter-spacing: 1px;
    color: #666e7c;
    line-height: 22px;
`;

export const MetaValue = styled.span`
    color: #444444;
    margin-left: 10px;
`;

export const ModalHeader = styled(Flex)`
    border-bottom: 1px solid ${({theme}) => theme.modal.headerBorder};
    min-height: 67px;
`;

export const Heading = ({label, description, children}) => (
    <Box mb={2} p={2}>
        <H2>{label}</H2>
        <Description>{description || children}</Description>
    </Box>
);

export const TableSection = ({heading, children, ...rest}) => (
    <Flex flex={1} flexDirection='column' {...rest}>
        <Box px={2} pb={1}>
            <H2>{heading}</H2>
        </Box>
        <Box flex={1}>{children}</Box>
    </Flex>
);

export const EditingSection = ({heading, description, children, ...rest}) => (
    <Flex p={3} flex={1} flexDirection='column' {...rest}>
        <Box mb={2} p={2} width={[1, 1, 3 / 4]}>
            <H1>{heading}</H1>
            {description && <Description>{description}</Description>}
        </Box>
        <Flex flex={1} flexDirection='column'>
            {children}
        </Flex>
    </Flex>
);

export const ListPage = ({children, cpanel, ...rest}) => (
    <LightTheme>
        <Page {...rest}>
            {cpanel}
            <Content p={4}>{children}</Content>
        </Page>
    </LightTheme>
);

export const EditingPage = ({children, ...rest}) => (
    <LightTheme>
        <Page {...rest}>
            <Content>{children}</Content>
        </Page>
    </LightTheme>
);

export const TinyButton = styled(Button)`
    font-size: 12px;
    padding: 2px 9px;

    color: #ffffff;
    background-color: #2c3039;

    &:hover {
        background-color: #212428;
        top: 0;
        border: none;
    }

    letter-spacing: 0.5px;
    border: none;
    box-shadow: none;
    /*border-radius: 4px;*/

    text-align: center;
`;

export const DeleteButton = styled(TinyButton)`
    background-color: #c33a3a;
    color: #f5f5f5;

    &:hover {
        background-color: #a03131;
    }
`;

const StyledNumberInput = styled(NumberInput)`
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
    border-left-color: transparent;
`;

const StyledDropdown = styled(DropdownList)`
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
    border-right-color: transparent;
`;

export class RelativeDatePicker extends React.Component {
    static propTypes = {};

    static defaultProps = {
        base: 'after',
        days: 0,
    };

    handleDaysChanged = days => {
        const {base, onValueChanged} = this.props;

        if (typeof onValueChanged === 'function') {
            onValueChanged({base, days});
        }
    };

    handleBaseChanged = base => {
        const {days, onValueChanged} = this.props;

        if (typeof onValueChanged === 'function') {
            onValueChanged({base, days});
        }
    };

    render() {
        const {timeMarker, label, base, days} = this.props;

        const bases = {
            before: `Days before ${timeMarker}`,
            after: `Days after ${timeMarker}`,
        };

        const selectedBase = base && bases[base];

        return (
            <Flex>
                <Box width={2 / 3}>
                    <StyledDropdown
                        leftLabel={label}
                        manualValue={selectedBase}
                        options={Object.entries(bases).map(([value, label]) => ({value, label}))}
                        onValueChanged={this.handleBaseChanged}
                    />
                </Box>
                <Box width={1 / 3}>
                    <StyledNumberInput
                        value={days}
                        rightLabel='Days'
                        onValueChanged={this.handleDaysChanged}
                    />
                </Box>
            </Flex>
        );
    }
}

const DateHead = styled(Box)`
    display: inline-block;
    padding: 10px;
    background-color: ${({theme}) => theme.dateBox.headBg};
    color: ${({theme}) => theme.dateBox.headFg};
`;
const DateValue = styled(Box)`
    display: inline-block;
    background-color: ${({theme}) => theme.dateBox.valueBg};
    color: ${({theme}) => theme.dateBox.valueFg};
    padding: 10px;
    margin-right: 15px;
`;
const formatDate = ts =>
    epoch_to_date(ts).toLocaleString(undefined, {month: 'numeric', day: 'numeric'});

export function CustomPeriodNotification({fiscalYearEnd, fiscalQuarters, companyName}) {
    if (fiscalQuarters) {
        return (
            <Box py={2}>
                <Description>
                    {companyName} has <b>non-standard</b> fiscal quarter end dates
                </Description>
                <Box mt={2}>
                    <DateHead>Q1</DateHead>
                    <DateValue>{formatDate(fiscalQuarters.quarter_one)}</DateValue>
                    <DateHead>Q2</DateHead>
                    <DateValue>{formatDate(fiscalQuarters.quarter_two)}</DateValue>
                    <DateHead>Q3</DateHead>
                    <DateValue>{formatDate(fiscalQuarters.quarter_three)}</DateValue>
                    <DateHead>Q4</DateHead>
                    <DateValue>{formatDate(fiscalQuarters.quarter_four)}</DateValue>
                </Box>
            </Box>
        );
    } else if (fiscalYearEnd) {
        return (
            <Box py={2}>
                <Description>
                    {companyName} has <b>non-standard</b> fiscal year end
                </Description>
                <Box mt={2}>
                    <DateHead>FYE</DateHead>
                    <DateValue>{formatDate(fiscalYearEnd)}</DateValue>
                </Box>
            </Box>
        );
    }
}
