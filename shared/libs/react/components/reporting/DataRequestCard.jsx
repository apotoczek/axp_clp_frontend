import React from 'react';
import styled, {css} from 'styled-components';
import {Box, Flex} from '@rebass/grid';
import {left, right} from 'styled-system';
import CardActions from 'components/reporting/CardActions';

import {gen_date_formatter} from 'src/libs/Formatters';
import {RequestColors} from 'components/reporting/shared';

const DataRequestWrapper = styled(Flex)`
    background-color: ${({theme}) => theme.reportingDataRequest.cardBg};
    border: 1px solid ${({theme}) => theme.reportingDataRequest.cardBorder};
    flex-direction: column;
    height: 200px;
    margin-bottom: 15px;

    &:last-child {
        margin-bottom: 0;
    }
`;

const DataRequestHeader = styled(Flex)`
    height: 50px;
    font-size: 21px;
    padding: 0 15px;
    color: ${({theme}) => theme.reportingDataRequest.cardHeaderFg};
    background-color: ${({theme}) => theme.reportingDataRequest.cardHeaderBg};
    align-items: center;
`;

const DataRequestBody = styled(Flex)`
    padding: 15px;
`;

const ProgressBar = styled(Box)`
    width: 100%;
    height: 20px;
    background-color: #ffffff;
    position: relative;
    border: 1px solid #666e7c;
`;

const Progress = styled(Box)`
    background-color: ${props => props.color || '#3AC376'};
    height: 100%;
`;

const Marker = styled(Box)`
    ${left}
    ${right}
    height: 24px;
    width: 3px;

    background-color: ${props => (props.visible ? '#7787A4' : 'transparent')};
    border: ${props => (props.visible ? '1px solid #2C3039;' : '0')};
    position: absolute;
    top: -2px;
`;

const ProgressWrapper = styled(Box)`
    width: 100%;
    height: 120px;
`;

const ProgressStatus = styled(Flex)`
    width: 100%;
    height: 50px;
    font-size: 20px;
    /*font-weight: 300;*/
    align-items: center;
    color: ${props => props.color || '#FFFFFF;'};
`;

const Annotations = styled(Box)`
    width: 100%;
    position: relative;
    height: 46px;
`;

const AnnotationWrapper = styled(Box)`
    font-size: 12px;
    position: absolute;
    text-transform: uppercase;
    letter-spacing: 0.4px;
    width: 100px;

    bottom: 30px;

    ${props =>
        props.position === 'bottom' &&
        css`
            top: 30px;
            bottom: auto;
        `}

    text-align: left;
    left: 0;

    ${props =>
        props.alignRight &&
        css`
            text-align: right;
            right: 0;
            left: auto;
        `}
`;

const AnnotationLabel = styled(Box)`
    color: #000000;
`;

const AnnotationSubLabel = styled(Box)`
    color: #3644e1;
`;

const Annotation = ({label, subLabel, ...rest}) => (
    <AnnotationWrapper {...rest}>
        <AnnotationLabel>{label}</AnnotationLabel>
        <AnnotationSubLabel>{subLabel}</AnnotationSubLabel>
    </AnnotationWrapper>
);
const DataRequestProgress = ({progress, statusText, color, annotations}) => (
    <ProgressWrapper>
        <Annotations></Annotations>
        <ProgressBar>
            {annotations.map(
                ({
                    right,
                    left,
                    label,
                    subLabel,
                    marker = false,
                    position = 'top',
                    alignRight = false,
                }) => (
                    <Marker key={label} left={left} right={right} visible={marker}>
                        <Annotation
                            position={position}
                            alignRight={alignRight}
                            label={label}
                            subLabel={subLabel}
                        />
                    </Marker>
                ),
            )}
            <Progress width={`${progress}%`} color={color} />
        </ProgressBar>
        <ProgressStatus color={color}>{statusText}</ProgressStatus>
    </ProgressWrapper>
);
const TableWrapper = styled(Flex)`
    height: 100%;
    flex-direction: column;
    color: #000000;
    font-size: 13px;
    width: 350px;
    margin-right: 20px;
`;

const Row = styled(Flex)`
    &:nth-child(odd) {
        background-color: ${({theme}) => theme.reportingDataRequest.cardHeaderBg};
    }
    padding: 3px 6px;
`;

const Label = styled(Box)`
    flex: 1;
    font-weight: 600;
`;

const Value = styled(Box)`
    flex: 1.5;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
`;

const DataRequestTable = ({rows}) => (
    <TableWrapper>
        {rows.map(row => (
            <Row key={row.label}>
                <Label>{row.label}</Label>
                <Value>{row.value}</Value>
            </Row>
        ))}
    </TableWrapper>
);
const formatDate = gen_date_formatter('{M}/{d}/{yyyy}', 0, 1000, true);

const pickLabel = (a, b) => {
    const preferredLabels = ['Due Date', 'Request Date'];

    for (const label of preferredLabels) {
        if (a === label || b === label) {
            return label;
        }
    }

    return a;
};

export const genTableRows = d => [
    {label: 'As of Date', value: formatDate(d.as_of_date)},
    {label: 'Due Date', value: formatDate(d.due_date)},
    {label: 'Recurring', value: d.recurring ? d.mandate.frequency_text : 'No'},
    {label: 'Template', value: d.template.name},
    {label: 'Email Sequence', value: d.email_sequence ? d.email_sequence.name : 'None'},
];

export const genAnnotations = d => {
    const annotations = [];

    if (d.recurring) {
        annotations.push({
            label: 'Period Start',
            subLabel: formatDate(d.period_start),
            left: 0,
        });
    }

    let values = [
        {
            label: 'Request Date',
            subLabel: formatDate(d.request_date),
            pct: d.progress.request_date,
        },
        {
            label: d.recurring ? 'Period End' : 'As of Date',
            subLabel: formatDate(d.period_end),
            pct: d.progress.period_end,
        },
        {
            label: 'Due Date',
            subLabel: formatDate(d.due_date),
            pct: d.progress.due_date,
        },
    ];

    values.sort((a, b) => a.pct - b.pct);

    values = values.filter(v => v.pct > 0);

    // Don't show labels on the same date
    values = values.reduce((res, next) => {
        if (res.length && res[res.length - 1].pct === next.pct) {
            res[res.length - 1].label = pickLabel(res[res.length - 1].label, next.label);
        } else {
            res.push(next);
        }

        return res;
    }, []);

    if ((values.length && !d.recurring) || (values[0].pct < 80 && values[0].pct > 20)) {
        const first = values.shift();

        annotations.push({
            ...first,
            left: `${first.pct}%`,
            marker: first.pct > 0 && first.pct < 100,
            alignRight: first.pct === 100,
        });
    }

    if (values.length) {
        // All but the last go on the bottom, with every other one right aligned
        for (const [idx, value] of values.slice(0, values.length - 1).entries()) {
            annotations.push({
                ...value,
                left: `${value.pct}%`,
                marker: true,
                position: 'bottom',
                alignRight: idx % 2 === 0,
            });
        }

        annotations.push({
            ...values[values.length - 1],
            right: 0,
            alignRight: true,
        });
    }

    return annotations;
};

function DataRequestCard({dataRequest, onViewSchedule, onReviewSubmission, onDeactivate}) {
    const annotations = genAnnotations(dataRequest);
    const tableRows = genTableRows(dataRequest);

    return (
        <DataRequestWrapper>
            <DataRequestHeader>
                {dataRequest.name}
                <CardActions
                    onViewSchedule={onViewSchedule}
                    onReviewSubmission={onReviewSubmission}
                    onDeactivate={onDeactivate}
                    isRecurring={dataRequest.is_recurring}
                />
            </DataRequestHeader>
            <DataRequestBody>
                <DataRequestTable rows={tableRows} />
                <DataRequestProgress
                    progress={dataRequest.progress.today}
                    statusText={dataRequest.status_text}
                    color={RequestColors[dataRequest.state]}
                    annotations={annotations}
                />
            </DataRequestBody>
        </DataRequestWrapper>
    );
}

export default DataRequestCard;
