import React from 'react';
import styled from 'styled-components';

import * as Constants from 'src/libs/Constants';
import {gen_formatter} from 'src/libs/Formatters';
import Icon from 'components/basic/Icon';
import {Box, Flex} from '@rebass/grid';

import Checkbox from 'components/basic/forms/Checkbox';

import {CPanelSectionTitle, CPanelButton} from 'components/basic/cpanel/base';
import {CPanelInputWrapper} from 'components/basic/cpanel/CPanelInput';

import CPanelPopover, {
    CPanelPopoverButton,
    CPanelPopoverDivider,
    CPanelPopoverItem,
} from 'components/basic/cpanel/CPanelPopover';
import {CPanelElementMixin} from 'components/basic/cpanel/mixins';

const PopoverChecklist = ({options, selectedValue, onValueChanged}) => (
    <CPanelPopover
        render={({togglePopover}) => (
            <div>
                {options.map(opt => (
                    <CPanelPopoverItem
                        key={opt.value}
                        selected={opt.value === selectedValue}
                        onClick={() => onValueChanged(opt.value)}
                    >
                        {opt.label}
                    </CPanelPopoverItem>
                ))}
                <CPanelPopoverDivider />
                <CPanelButton onClick={togglePopover}>Close</CPanelButton>
            </div>
        )}
    >
        <CPanelPopoverButton active={!!selectedValue}>
            Format <Icon name='plus' right />
        </CPanelPopoverButton>
    </CPanelPopover>
);
const Wrapper = styled(Flex)`
    flex-direction: column;
    height: 100%;
`;

const ScrollContainer = styled(Box)`
    overflow-y: auto;
    height: 0;
    flex: 1;
    width: 100%;
`;

const CapturedCellWrapper = styled.div`
    ${CPanelElementMixin}

    border: 1px solid ${({theme}) => theme.cPanelPopoverItemBorder};

    color: ${({theme}) => theme.cPanelButtonFg};
    line-height: 1.5;
    font-size: 12px;

    padding: 5px 10px;

    cursor: pointer;

    :hover {
        border-color: ${({theme}) => theme.cPanelInputBorder};
    }
`;

const Label = styled.div`
    font-weight: 500;
    color: #95a5a6;
    letter-spacing: 0.86px;
    font-size: 12px;
    text-transform: uppercase;
    user-select: none;
`;

const Spec = styled.div`
    font-family: Lato, sans-serif;
    color: ${props => (props.finished ? '#3AC376' : '#F39C12')};
    font-size: 11px;
    user-select: none;
`;

const Value = styled.div`
    font-family: Lato, sans-serif;
    color: #fefefe;
    font-size: 13px;
    user-select: none;
`;

const CapturedCell = ({cell, ...rest}) => {
    const spec = [];

    if (cell.metricName) {
        spec.push(cell.metricName);
    }

    if (cell.timeFrameName) {
        spec.push(cell.timeFrameName);
    }

    if (cell.asOfDate) {
        spec.push(cell.asOfDate);
    }

    const formatter = gen_formatter(cell.format);

    let formattedValue;

    if (typeof cell.value == 'string') {
        formattedValue = cell.value;
    } else {
        formattedValue = formatter(cell.value);
    }

    const label = spec.join(' - ');
    const isFinished = cell.metric && cell.timeFrame && cell.asOfDate;

    return (
        <CapturedCellWrapper {...rest}>
            <Label>
                {cell.sheetName} - {cell.cellTitle}
            </Label>
            <Value>{formattedValue}</Value>
            <Spec finished={isFinished}>{label}</Spec>
        </CapturedCellWrapper>
    );
};

class MetricSelectorCpanel extends React.Component {
    state = {
        pointInTimeValue: false,
        formatValue: undefined,
        nameValue: '',
    };

    handleFormatChanged = value => {
        this.setState({formatValue: value});
    };

    handleNameChanged = event => {
        this.setState({nameValue: event.target.value});
    };

    handlePointInTimeChanged = value => {
        this.setState({pointInTimeValue: value});
    };

    handleCreateMetric = () => {
        const {formatValue, nameValue, pointInTimeValue} = this.state;
        const {onCreateMetric} = this.props;

        if (typeof onCreateMetric === 'function') {
            onCreateMetric({
                name: nameValue,
                format: formatValue,
                pointInTime: pointInTimeValue,
            });
        }

        this.clearForm();
    };

    clearForm = () => {
        this.setState({formatValue: undefined, nameValue: '', pointInTimeValue: false});
    };

    formValid = () => {
        const {formatValue, nameValue} = this.state;

        return formatValue !== undefined && nameValue.length > 0;
    };

    render() {
        const {formatValue, nameValue, pointInTimeValue} = this.state;
        const {capturedMetrics, onClickCaptured} = this.props;

        return (
            <Wrapper>
                <Box mb={20}>
                    <CPanelSectionTitle>Create Metric</CPanelSectionTitle>
                    <CPanelInputWrapper
                        placeholder='Name...'
                        value={nameValue}
                        onChange={this.handleNameChanged}
                        active={nameValue.length > 0}
                    />
                    <Checkbox
                        small
                        label='Point in Time'
                        onValueChanged={this.handlePointInTimeChanged}
                        checked={pointInTimeValue}
                    />
                    <PopoverChecklist
                        options={Constants.format_options}
                        selectedValue={formatValue}
                        onValueChanged={this.handleFormatChanged}
                    />
                    <CPanelButton disabled={!this.formValid()} onClick={this.handleCreateMetric}>
                        Create Metric
                    </CPanelButton>
                </Box>
                <Flex flex={1} flexDirection='column' mb={20}>
                    <CPanelSectionTitle>Captured Metrics</CPanelSectionTitle>
                    <ScrollContainer>
                        {capturedMetrics.map(m => (
                            <CapturedCell
                                key={m.cellTitle}
                                cell={m}
                                onClick={() => onClickCaptured(m)}
                            />
                        ))}
                    </ScrollContainer>
                </Flex>
            </Wrapper>
        );
    }
}

export default MetricSelectorCpanel;
