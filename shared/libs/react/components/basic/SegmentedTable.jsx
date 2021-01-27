import React from 'react';
import styled, {css} from 'styled-components';

import PropTypes from 'prop-types';

import {extract_data} from 'src/libs/Utils';

import {darken} from 'polished';
import Popover, {calculatePosition} from 'components/basic/Popover';
import RoundCheckbox from 'components/basic/forms/RoundCheckbox';

const Wrapper = styled.div`
    overflow: auto;
`;

const Table = styled.table`
    width: 100%;
`;

const HeaderRow = styled.tr`
    background-color: ${({theme}) => theme.segmentedTable.headerBg};
    color: #ffffff;
`;

const BodyRow = styled.tr`
    color: ${({theme}) => theme.segmentedTable.rowFg};
    background-color: ${({theme}) => theme.segmentedTable.rowBg};

    &:nth-child(odd) {
        background-color: ${({theme}) => theme.segmentedTable.oddRowBg};
    }

    cursor: ${props => (props.clickable ? 'pointer' : 'auto')};
    user-select: none;
`;

const HeaderCell = styled.th`
    padding: 12px 10px;
    color: ${({theme}) => theme.segmentedTable.headerFg};
    vertical-align: middle;
    text-align: ${props => (props.textAlign ? props.textAlign : 'left')};
    white-space: nowrap;
    font-weight: 700;
    font-size: ${props => (props.fontSize ? props.fontSize : '11px')};
    text-transform: uppercase;
    letter-spacing: 1px;
    border: none;
    background-color: ${props => (props.backgroundColor ? props.backgroundColor : 'transparent')};
`;

const StyledCell = styled.td`
    border: 1px solid #6c7786;
    font-size: 13px;
    padding: 12px 10px;
    color: ${({theme}) => theme.segmentedTable.rowFg};
    vertical-align: middle;
    text-align: ${props => (props.textAlign ? props.textAlign : 'left')};
    white-space: nowrap;
    background-color: ${props => (props.backgroundColor ? props.backgroundColor : 'transparent')};
    cursor: ${props => (props.allowEdit ? 'pointer' : 'auto')};

    ${props =>
        props.width &&
        css`
            width: ${props.width};
        `}

    ${props =>
        props.tooltip &&
        css`
            position: relative;
            cursor: pointer;

            &::after {
                content: '';
                position: absolute;
                top: 0;
                right: 0;
                border-color: transparent;
                border-style: solid;
                border-width: 5px;
                border-right-color: ${props.backgroundColor
                    ? darken(0.2, props.backgroundColor)
                    : '#000000'};
                border-top-color: ${props.backgroundColor
                    ? darken(0.2, props.backgroundColor)
                    : '#000000'};
            }
        `}
    ${props =>
        props.allowEdit &&
        css`
            &:hover {
                background-color: ${props =>
                    props.backgroundColor ? darken(0.05, props.backgroundColor) : '#C9DCEC'};
            }
        `};
`;

const TooltipContent = styled.div`
    background: ${({theme}) => theme.segmentedTable.tooltipBg};
    min-width: 224px;
    max-height: 300px;
    overflow-y: auto;

    border-radius: 4px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.16), 0 1px 3px rgba(0, 0, 0, 0.23);

    color: ${({theme}) => theme.segmentedTable.tooltipFg};

    &::after {
        bottom: 100%;
        right: 30px;
        border: solid transparent;
        content: ' ';
        height: 0;
        width: 0;
        position: absolute;
        pointer-events: none;
        border-bottom-color: ${({theme}) => theme.segmentedTable.tooltipBg};
        border-width: 10px;
        margin-left: -10px;
    }
`;

const MenuItem = styled.div`
    border-bottom: 1px solid #e4e8ee;
    color: #212428;

    padding: 6px 8px;
    font-size: 12px;

    cursor: pointer;

    &:hover {
        background: #ffffff;
    }

    &:first-child {
        border-top-left-radius: 4px;
        border-top-right-radius: 4px;
    }

    &:last-child {
        border-bottom-left-radius: 4px;
        border-bottom-right-radius: 4px;
        border-bottom: none;
    }
`;

const DropdownState = {
    Open: 'open',
    Opening: 'opening',
    Closed: 'closed',
};

class BodyCell extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            state: DropdownState.Closed,
            showTraceMenu: false,
        };
    }

    componentDidMount() {
        document.addEventListener('mousedown', this.handleClickOutside, false);
    }

    componentWillUnmount() {
        document.removeEventListener('mousedown', this.handleClickOutside, false);
    }

    handleKeyPressed = event => {
        if (event.key === 'Escape') {
            this.setState({state: DropdownState.Closed});
        }
    };

    componentDidUpdate() {
        // If we're currently in the process of opening the popover, we set it
        // to open, since at this point we have the reference to the popover
        // dom node again.
        if (this.state.state === DropdownState.Opening) {
            this.openPopover();
        }
    }

    handleClickOutside = ({target}) => {
        if (this.state.state === DropdownState.Closed) {
            return;
        }

        let clickedInside = this.wrapper.contains(target) || this.popover.contains(target);
        if (!clickedInside) {
            this.closePopover();
        }
    };

    closePopover = () => {
        this.setState({showTraceMenu: false, state: DropdownState.Closed});
    };

    openPopover = _event => {
        if (!this.wrapper) {
            throw oneLine`
                [dropdown]: Failed to open dropdown. Ref was
                ${this.wrapper}. Ensure it's defined before trying to open it.
            `;
        }

        // Get position and size of parent
        // We might not have the popover dom node here, since if we weren't open
        // before, we don't have the refernce to the popover. If this is the
        // case, we put the state into "Opening" and rerender, so that the
        // popover content can be rendered and we can get the reference to it.
        // `componentWillUpdate` takes care of re-updating the state so that
        // we get back to this point again with the reference available.
        if (!this.popover || this.state.state != DropdownState.Opening) {
            // The reason for the this.state.state != check is because
            // now I explicitly use this function to open the popover.
            // The content might change so we need to render once before
            // we start calculating stuff. Otherwise it might calculate
            // pos based on the other content (This is not ideal and we should)
            // probably have two Popovers
            this.setState({state: DropdownState.Opening});
            this.forceUpdate();
            return;
        }

        const {x: newX, y: newY} = calculatePosition(
            this.wrapper.getBoundingClientRect(),
            this.popover.getBoundingClientRect(),
            {offsetY: 3},
        );

        this.setState({
            state: DropdownState.Open,
            x: newX,
            y: newY,
        });
    };

    handleOnClick = _event => {
        if (!this.state.showTraceMenu) {
            this.closePopover();
            this.setState({showTraceMenu: true});
            this.openPopover();
        } else {
            this.closePopover();
        }

        if (this.props.onClick) {
            this.props.onClick();
        }
    };

    handleClickEditValue = () => {
        this.props.onClickEditValue();
        this.closePopover();
    };

    handleClickViewHistory = () => {
        this.props.onClickViewHistory();
        this.closePopover();
    };

    render() {
        const {
            tooltip,
            allowEdit,
            onClick: _onClick,
            onClickViewHistory: _onClickViewHistory,
            onClickEditValue: _onClickEditValue,
            ...rest
        } = this.props;

        if (tooltip || allowEdit) {
            return (
                <StyledCell
                    ref={ref => (this.wrapper = ref)}
                    onMouseEnter={
                        tooltip && !this.state.showTraceMenu ? this.openPopover : undefined
                    }
                    onMouseOut={
                        tooltip && !this.state.showTraceMenu ? this.closePopover : undefined
                    }
                    tooltip={tooltip}
                    onClick={allowEdit ? this.handleOnClick : undefined}
                    allowEdit={allowEdit}
                    {...rest}
                >
                    {this.props.children}
                    {this.renderDropdown()}
                </StyledCell>
            );
        }

        return <StyledCell {...rest} />;
    }

    renderDropdown = () => {
        if (this.state.state === DropdownState.Closed) {
            return null;
        }

        return (
            <Popover x={this.state.x} y={this.state.y} minWidth={this.state.minWidth}>
                <div
                    ref={ref => (this.popover = ref)}
                    onClick={e => e.stopPropagation()}
                    onKeyUp={this.handleKeyPressed.bind(this)}
                >
                    <TooltipContent>
                        {!this.state.showTraceMenu ? (
                            this.props.tooltip
                        ) : (
                            <div>
                                <MenuItem onClick={this.handleClickEditValue}>Edit Value</MenuItem>
                                <MenuItem onClick={this.handleClickViewHistory}>
                                    View Audit Trail
                                </MenuItem>
                            </div>
                        )}
                    </TooltipContent>
                </div>
            </Popover>
        );
    };
}

const columnType = PropTypes.shape({
    key: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    textAlign: PropTypes.oneOf(['left', 'right', 'center']),
    formatter: PropTypes.func,
    tooltipKey: PropTypes.string,
    width: PropTypes.string,
});

const segmentType = PropTypes.shape({
    key: PropTypes.string.isRequired,
    label: PropTypes.string,
    color: PropTypes.shape({
        header: PropTypes.string.isRequired,
        odd: PropTypes.string.isRequired,
        even: PropTypes.string.isRequired,
    }),
    columns: PropTypes.arrayOf(columnType).isRequired,
});

class SegmentedTable extends React.Component {
    state = {
        selected: {},
    };

    static defaultProps = {
        enableSelection: false,
    };

    static propTypes = {
        onSelectionChanged: PropTypes.func,
        onClickCell: PropTypes.func,
        rows: PropTypes.arrayOf(PropTypes.object).isRequired,
        segments: PropTypes.arrayOf(segmentType).isRequired,
        enableSelection: PropTypes.bool.isRequired,
    };

    setSelected(selected) {
        const {onSelectionChanged, rows} = this.props;

        this.setState({selected});

        if (typeof onSelectionChanged === 'function') {
            onSelectionChanged(rows.filter(r => selected[r.key]));
        }
    }

    selectAll() {
        if (this.allSelected()) {
            this.setSelected({});
        } else {
            const selected = {};

            for (const r of this.props.rows) {
                selected[r.key] = true;
            }

            this.setSelected(selected);
        }
    }

    toggleSelected(key) {
        const {selected} = this.state;

        if (selected[key]) {
            const newSelected = {...selected};
            delete newSelected[key];
            this.setSelected(newSelected);
        } else {
            this.setSelected({...selected, [key]: true});
        }
    }

    allSelected() {
        const {rows} = this.props;
        const {selected} = this.state;

        return Object.values(selected).length === rows.length;
    }

    isRowClickable() {
        const {enableSelection, onClickCell} = this.props;
        return enableSelection || typeof onClickCell === 'function';
    }

    handleClickCell(cell) {
        const {onClickCell} = this.props;
        if (typeof onClickCell === 'function') {
            onClickCell(cell);
        }
    }

    render() {
        const {segments, rows, enableSelection, allowEdit} = this.props;
        const {selected} = this.state;

        return (
            <Wrapper>
                <Table>
                    <thead>
                        <HeaderRow>
                            {enableSelection && <HeaderCell></HeaderCell>}
                            {segments.map(s => {
                                return (
                                    <HeaderCell
                                        key={s.key}
                                        backgroundColor={s.color && s.color.header}
                                        colSpan={s.columns.length}
                                        textAlign='center'
                                        fontSize='13px'
                                    >
                                        {s.label}
                                    </HeaderCell>
                                );
                            })}
                        </HeaderRow>
                        <HeaderRow>
                            {enableSelection && (
                                <HeaderCell>
                                    <RoundCheckbox
                                        checked={this.allSelected()}
                                        onClick={() => this.selectAll()}
                                    />
                                </HeaderCell>
                            )}
                            {segments.map(s =>
                                s.columns.map(c => (
                                    <HeaderCell
                                        key={`${s.key}${c.key}`}
                                        backgroundColor={s.color && s.color.header}
                                        textAlign={c.textAlign}
                                    >
                                        {c.label}
                                    </HeaderCell>
                                )),
                            )}
                        </HeaderRow>
                    </thead>
                    <tbody>
                        {rows.map((row, rowIdx) => {
                            const colorKey = (rowIdx + 1) % 2 === 0 ? 'even' : 'odd';

                            return (
                                <BodyRow
                                    key={row.key}
                                    clickable={this.isRowClickable()}
                                    onClick={() => enableSelection && this.toggleSelected(row.key)}
                                >
                                    {enableSelection && (
                                        <BodyCell width='1%'>
                                            <RoundCheckbox checked={!!selected[row.key]} />
                                        </BodyCell>
                                    )}
                                    {segments.map(s =>
                                        s.columns.map(c => {
                                            let backgroundColor = s.color
                                                ? s.color[colorKey]
                                                : undefined;

                                            return (
                                                <BodyCell
                                                    tooltip={
                                                        c.tooltipKey &&
                                                        extract_data(c.tooltipKey, row)
                                                    }
                                                    key={`${s.key}${c.key}${row.key}`}
                                                    backgroundColor={backgroundColor}
                                                    textAlign={c.textAlign}
                                                    width={c.width}
                                                    onClick={
                                                        !c.preventEdit
                                                            ? () => this.handleClickCell(row[c.key])
                                                            : undefined
                                                    }
                                                    allowEdit={allowEdit && !c.preventEdit}
                                                    onClickEditValue={() =>
                                                        this.props.onClickEditValue(s, row, c)
                                                    }
                                                    onClickViewHistory={() =>
                                                        this.props.onClickViewHistory(s, row, c)
                                                    }
                                                >
                                                    {c.formatter ? c.formatter(row) : row[c.key]}
                                                </BodyCell>
                                            );
                                        }),
                                    )}
                                </BodyRow>
                            );
                        })}
                    </tbody>
                </Table>
            </Wrapper>
        );
    }
}

export default SegmentedTable;
