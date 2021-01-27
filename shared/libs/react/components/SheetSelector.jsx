import PropTypes from 'prop-types';
import React from 'react';
import styled, {css, keyframes} from 'styled-components';

import {Wrapper as FormWrapper} from 'components/basic/forms/base';
import DropdownList from 'components/basic/forms/dropdowns/DropdownList';
import MultiDropdownList from 'components/basic/forms/dropdowns/MultiDropdownList';

import Workbook from 'components/excel/Workbook';
import {sheetsType, sheetDataType, sheetDimensionsType} from 'components/excel/Workbook';

import {cellKey} from 'components/excel/Sheet';

const scaleCube = keyframes`
    0%, 70%, 100% {
        transform: scale3d(1, 1, 1);
    }

    35% {
        transform: scale3d(0, 0, 1);
    }
`;

const CubeGrid = styled.div`
    width: 40px;
    height: 40px;
    margin: 100px auto;
`;

const Cube = styled.div`
    width: 33%;
    height: 33%;
    background-color: #333333;
    float: left;
    animation: ${scaleCube} 1.3s infinite ease-in-out;

    :nth-child(1) {
        animation-delay: 0.2s;
    }
    :nth-child(2) {
        animation-delay: 0.3s;
    }
    :nth-child(3) {
        animation-delay: 0.4s;
    }
    :nth-child(4) {
        animation-delay: 0.1s;
    }
    :nth-child(5) {
        animation-delay: 0.2s;
    }
    :nth-child(6) {
        animation-delay: 0.3s;
    }
    :nth-child(7) {
        animation-delay: 0s;
    }
    :nth-child(8) {
        animation-delay: 0.1s;
    }
    :nth-child(9) {
        animation-delay: 0.2s;
    }
`;

const Spinner = () => (
    <CubeGrid>
        <Cube />
        <Cube />
        <Cube />
        <Cube />
        <Cube />
        <Cube />
        <Cube />
        <Cube />
        <Cube />
    </CubeGrid>
);
const MetricSelectorWrapper = styled.div`
    position: relative;
    display: flex;
    flex: 1;
    width: 100%;
`;

const Toolbar = styled.div`
    position: absolute;
    right: 0;
    top: 0;
    z-index: 1000;
`;

const ToolbarItem = styled.div`
    width: ${props => (props.width ? `${props.width}px` : '300px')};
    display: inline-block;

    :first-child {
        margin-right: 10px;
    }

    :last-child {
        margin-left: 10px;
        width: 150px;
    }

    > * {
        margin: 0;
        width: 100%;
    }
`;

const ToolbarDropdown = styled(DropdownList)`
    border: 0;

    &:hover {
        border: 0;
    }
`;

const ToolbarMultiDropdown = styled(MultiDropdownList)`
    border: 0;

    &:hover {
        border: 0;
    }
`;

const ToolbarButton = styled(FormWrapper)`
    text-align: center;
    box-sizing: border-box;

    background: #414956;
    color: #ffffff;

    border: 0;

    &:hover {
        border: 0;
        background: #373e49;
    }

    ${props =>
        props.disabled &&
        css`
            pointer-events: none;
            opacity: 0.5;
        `}

    ${props =>
        props.success &&
        css`
            background-color: #5bc588;
            color: #ffffff;

            :hover {
                background-color: #4da875;
            }
        `}

    cursor: pointer;
`;

const Container = styled.div`
    height: 100%;
    width: 100%;
    display: flex;
    flex-direction: column;
`;

const Header = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
`;

const PreviewButton = styled(FormWrapper)`
    flex: 1 0 0;
    border-radius: 0;
    background-color: #5bc588;
    color: #ffffff;

    :hover {
        background-color: #4da875;
        color: #ffffff;
    }

    text-align: center;

    ${props =>
        props.disabled &&
        css`
            pointer-events: none;
            opacity: 0.5;
        `}

    cursor: pointer;
`;

const CancelButton = styled(FormWrapper)`
    flex: 1 0 0;
    border-radius: 0;
    text-align: center;
    cursor: pointer;
`;

const SheetLabel = styled(FormWrapper)`
    flex: 8 0 0;
    border-radius: 0;
    background-color: #fdfdfd;
    color: #555555;
    :hover {
        background-color: #fdfdfd;
        color: #555555;
    }
    cursor: pointer;
`;

export default class MetricSelector extends React.Component {
    static propTypes = {
        sheets: sheetsType,
        sheetData: sheetDataType,
        sheetDimensions: sheetDimensionsType,
        sheetName: PropTypes.string,
        metrics: PropTypes.objectOf(PropTypes.string).isRequired,
        timeFrames: PropTypes.objectOf(PropTypes.string).isRequired,
        onSettingsChanged: PropTypes.func,
        onClickPreview: PropTypes.func,
        onClickCancel: PropTypes.func,
    };

    static defaultProps = {
        sheets: [],
        sheetData: [],
        sheetDimensions: [],
        sheetName: '',
    };

    constructor(props, context) {
        super(props, context);

        this.types = {
            as_of: 'As of Date',
            metric: 'Metric',
            meta_group: 'Meta Group',
            meta_field: 'Meta Field',
            meta_value: 'Meta Value',
        };

        this.state = {
            activeSheet: 0,
            sheetSettings: {},
            sheetSelection: {},
        };
    }

    componentDidMount() {
        this.setActiveSheet(0);
    }

    setActiveSheet = idx => {
        if (!this.state.sheetSelection[idx]) {
            this.selectCell(0, 0, idx);
        }

        this.setState({activeSheet: idx});
    };

    selectCell = (row, column, sheetIdx) => {
        const {sheetSelection} = this.state;

        if (sheetIdx === undefined) {
            sheetIdx = this.state.activeSheet;
        }

        const newSheetSelection = {...sheetSelection};

        const activeSelection = newSheetSelection[sheetIdx] || {};

        if (activeSelection.row === row && activeSelection.column === column) {
            this.workbook.scrollToCell(row, column);
        } else {
            newSheetSelection[sheetIdx] = {row, column};
            this.setState({sheetSelection: newSheetSelection});
        }
    };

    updateSettings = (row, column, valueKey, value) => {
        const {sheetSettings, activeSheet} = this.state;

        const activeSettings = {...sheetSettings[activeSheet]};

        const key = cellKey(row, column);

        activeSettings[key] = {
            ...activeSettings[key],
            [valueKey]: value,
        };

        const newSheetSettings = {
            ...sheetSettings,
            [activeSheet]: activeSettings,
        };

        this.setState({sheetSettings: newSheetSettings});

        this.handleSettingsChanged(newSheetSettings);
    };

    clearSettings = (row, column) => {
        const {sheetSettings, activeSheet} = this.state;

        const key = cellKey(row, column);

        if (sheetSettings[activeSheet] && sheetSettings[activeSheet][key]) {
            const newSheetSettings = {...sheetSettings};

            delete newSheetSettings[activeSheet][key];

            this.setState({sheetSettings: newSheetSettings});

            this.handleSettingsChanged(newSheetSettings);
        }
    };

    handleClickDone = () => {
        const {onClickPreview} = this.props;

        if (typeof onClickPreview === 'function') {
            onClickPreview();
        }
    };

    handleClickCancel = () => {
        const {onClickCancel} = this.props;

        if (typeof onClickCancel === 'function') {
            onClickCancel();
        }
    };

    handleSettingsChanged = newSettings => {
        const {onSettingsChanged} = this.props;

        if (typeof onSettingsChanged === 'function') {
            onSettingsChanged(newSettings);
        }
    };

    clearSelection = () => {
        const {sheetSelection, activeSheet} = this.state;

        const newSheetSelection = {...sheetSelection};

        delete newSheetSelection[activeSheet];

        this.setState({sheetSelection: newSheetSelection});
    };

    cellType = (row, column) => {
        const rowData = this.props.sheetData[this.state.activeSheet][row] || {};
        const content = rowData[column] || {};

        return content.type;
    };

    renderSettings(activeSelection, activeSettings) {
        const {row, column} = activeSelection;

        const values = activeSettings[cellKey(row, column)];

        const dropdowns = this.renderDropdowns(activeSelection, activeSettings);

        if (dropdowns) {
            return (
                <Toolbar>
                    {dropdowns}
                    <ToolbarItem>
                        <ToolbarButton
                            disabled={!values}
                            onClick={() => this.clearSettings(row, column)}
                        >
                            Clear
                        </ToolbarButton>
                    </ToolbarItem>
                </Toolbar>
            );
        }
    }

    renderTypeDropdown(activeSelection, activeSettings) {
        const {row, column} = activeSelection;

        const values = activeSettings[cellKey(row, column)];

        return (
            <ToolbarItem key='type'>
                <ToolbarDropdown
                    label='Type'
                    manualValue={values && this.types[values.type]}
                    options={Object.entries(this.types).map(([value, label]) => ({value, label}))}
                    onValueChanged={value => this.updateSettings(row, column, 'type', value)}
                />
            </ToolbarItem>
        );
    }

    renderMetricDropdown(activeSelection, activeSettings) {
        const {metrics, timeFrames, asOfDates} = this.props;

        const {row, column} = activeSelection;

        const values = activeSettings[cellKey(row, column)];

        const valueLabels = {
            metric: values && values.metric && metrics[values.metric],
            timeFrame: values && values.timeFrame && timeFrames[values.timeFrame],
            asOfDate: values && values.asOfDate && asOfDates[values.asOfDate],
        };

        return (
            <ToolbarItem key='metric' width={500}>
                <ToolbarMultiDropdown
                    label='Metric'
                    values={valueLabels}
                    multiOptions={{
                        metric: Object.entries(metrics).map(([value, label]) => ({value, label})),
                        timeFrame: Object.entries(timeFrames).map(([value, label]) => ({
                            value,
                            label,
                        })),
                        asOfDate: Object.entries(asOfDates).map(([value, label]) => ({
                            value,
                            label,
                        })),
                    }}
                    onValueChanged={(key, value) => this.updateSettings(row, column, key, value)}
                />
            </ToolbarItem>
        );
    }

    renderMetaDropdown(activeSelection, activeSettings) {
        const {groups, fields, asOfDates} = this.props;

        const {row, column} = activeSelection;

        const values = activeSettings[cellKey(row, column)];

        const valueLabels = {
            group: values && values.group && groups[values.group].label,
            field: values && values.field && fields[values.field].label,
            asOfDate: values && values.asOfDate && asOfDates[values.asOfDate],
        };

        return (
            <ToolbarItem key='meta_value' width={500}>
                <ToolbarMultiDropdown
                    label='Meta Value'
                    values={valueLabels}
                    multiOptions={{
                        group: Object.entries(groups).map(([value, obj]) => ({
                            value,
                            label: obj.label,
                        })),
                        field: Object.entries(fields).map(([value, obj]) => ({
                            value,
                            label: obj.label,
                        })),
                        asOfDate: Object.entries(asOfDates).map(([value, label]) => ({
                            value,
                            label,
                        })),
                    }}
                    onValueChanged={(key, value) => this.updateSettings(row, column, key, value)}
                />
            </ToolbarItem>
        );
    }

    renderDropdowns(activeSelection, activeSettings) {
        const {row, column} = activeSelection;

        const values = activeSettings[cellKey(row, column)];

        const type = values && values.type;

        let content = [this.renderTypeDropdown(activeSelection, activeSettings)];

        if (type === 'metric') {
            content.push(this.renderMetricDropdown(activeSelection, activeSettings));
        } else if (type === 'meta_value') {
            content.push(this.renderMetaDropdown(activeSelection, activeSettings));
        }

        return content;
    }

    getColors(sheetSettings) {
        const colors = {};

        for (const [idx, settings] of Object.entries(sheetSettings)) {
            colors[idx] = {};

            for (const [cellKey, {type, ...opts}] of Object.entries(settings)) {
                if (['meta_group', 'meta_field', 'as_of'].indexOf(type) > -1) {
                    colors[idx][cellKey] = '#4da875';
                } else if (type === 'metric') {
                    const {metric, timeFrame, asOfDate} = opts;
                    colors[idx][cellKey] = metric && timeFrame && asOfDate ? '#4da875' : '#f4b858';
                } else if (type === 'meta_value') {
                    const {group, field, asOfDate} = opts;
                    colors[idx][cellKey] = group && field && asOfDate ? '#4da875' : '#f4b858';
                }
            }
        }

        return colors;
    }

    validSettings(sheetSettings) {
        let seenAsOf = false;
        let seenMetric = false;
        let seenMeta = false;

        for (const settings of Object.values(sheetSettings)) {
            for (const {type, ...opts} of Object.values(settings)) {
                if (type === 'as_of') {
                    seenAsOf = true;
                } else if (type === 'metric') {
                    seenMetric = true;
                    const {metric, timeFrame, asOfDate} = opts;
                    if (!metric || !timeFrame || !asOfDate) {
                        return false;
                    }
                } else if (type === 'meta_value') {
                    seenMeta = true;
                    const {group, field, asOfDate} = opts;
                    if (!group || !field || !asOfDate) {
                        return false;
                    }
                }
            }
        }

        return seenAsOf && (seenMetric || seenMeta);
    }

    render() {
        const {
            sheets,
            sheetData,
            sheetDimensions,
            sheetName,
            isLoading,
            onClickPreview,
            onClickCancel,
        } = this.props;
        const {activeSheet, sheetSelection, sheetSettings} = this.state;

        const activeSelection = sheetSelection[activeSheet];
        const activeSettings = sheetSettings[activeSheet] || {};

        if (isLoading) {
            return <Spinner />;
        }

        return (
            <Container>
                <Header>
                    <SheetLabel>{sheetName}</SheetLabel>
                    <PreviewButton
                        disabled={!this.validSettings(sheetSettings)}
                        onClick={onClickPreview}
                    >
                        Preview
                    </PreviewButton>
                    <CancelButton onClick={onClickCancel}>Cancel</CancelButton>
                </Header>
                <MetricSelectorWrapper>
                    {activeSelection && this.renderSettings(activeSelection, activeSettings)}
                    <Workbook
                        ref={ref => (this.workbook = ref)}
                        sheets={sheets}
                        sheetData={sheetData}
                        sheetDimensions={sheetDimensions}
                        sheetSelection={sheetSelection}
                        sheetCellColors={this.getColors(sheetSettings)}
                        activeSheet={activeSheet}
                        onClickCell={this.selectCell}
                        onSheetChanged={this.setActiveSheet}
                    />
                </MetricSelectorWrapper>
            </Container>
        );
    }
}
