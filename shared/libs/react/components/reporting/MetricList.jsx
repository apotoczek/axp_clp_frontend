import React from 'react';
import styled, {css} from 'styled-components';
import {Flex} from '@rebass/grid';
import Icon from 'components/basic/Icon';

import PropTypes from 'prop-types';

import {DragSource, DropTarget} from 'react-dnd';

const Type = 'metric';

const itemSource = {
    beginDrag(props) {
        return {
            index: props.index,
        };
    },
};

const itemTarget = {
    hover(props, monitor, component) {
        if (!component) {
            return null;
        }
        const dragIndex = monitor.getItem().index;
        const hoverIndex = props.index;

        // Don't replace items with themselves
        if (dragIndex === hoverIndex) {
            return;
        }

        const domNode = component.node.current;

        // Determine rectangle on screen
        const hoverBoundingRect = domNode.getBoundingClientRect();
        // Get vertical middle
        const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
        // Determine mouse position
        const clientOffset = monitor.getClientOffset();
        // Get pixels to the top
        const hoverClientY = clientOffset.y - hoverBoundingRect.top;
        // Only perform the move when the mouse has crossed half of the items height
        // When dragging downwards, only move when the cursor is below 50%
        // When dragging upwards, only move when the cursor is above 50%
        // Dragging downwards
        if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
            return;
        }
        // Dragging upwards
        if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
            return;
        }
        // Time to actually perform the action
        props.onMove(dragIndex, hoverIndex);
        // Note: we're mutating the monitor item here!
        // Generally it's better to avoid mutations,
        // but it's good here for the sake of performance
        // to avoid expensive index searches.
        monitor.getItem().index = hoverIndex;
    },
};

const sourceCollect = (connect, monitor) => {
    return {
        connectDragSource: connect.dragSource(),
        isDragging: monitor.isDragging(),
    };
};

const targetCollect = (connect, monitor) => {
    return {
        connectDropTarget: connect.dropTarget(),
        isDraggedOver: monitor.isOver(),
    };
};

const sortableStyles = ({isDragging, isDraggedOver}) => ({
    opacity: isDragging ? 0 : 1,
    pointerEvents: isDraggedOver ? 'none' : 'auto',
});

class ListItemWrapper extends React.Component {
    node = React.createRef();

    render() {
        const {connectDragSource, connectDropTarget, ...rest} = this.props;

        return connectDragSource(
            connectDropTarget(
                <div style={sortableStyles(this.props)} ref={this.node}>
                    <Item {...rest} />
                </div>,
            ),
        );
    }
}

const SortableItem = DropTarget(
    Type,
    itemTarget,
    targetCollect,
)(DragSource(Type, itemSource, sourceCollect)(ListItemWrapper));

let Container = styled.div`
    border-top-left-radius: 4px;
    border-top-right-radius: 4px;
    overflow: hidden;
    border: 1px solid rgb(190, 194, 213);
`;

let Wrapper = styled.div`
    position: relative;
    color: ${({theme}) => theme.multiSelect.listBoxFg};
    max-height: 290px;
    overflow-x: hidden;
    width: 100%;
    background-color: ${({theme}) => theme.multiSelect.listBoxBg};
`;

const StyledItem = styled(Flex)`
    user-select: none;
    font-size: 0.9em;
    border-bottom: 1px solid ${({theme}) => theme.multiSelect.listItemBorder};
    height: 35px;

    align-items: center;

    ${props =>
        props.index % 2 === 0 &&
        css`
            background-color: ${({theme}) => theme.multiSelect.listItemBgOdd};
        `}
`;

const Header = styled(Flex)`
    height: 30px;
    color: rgb(0, 0, 0);
    background-color: rgb(217, 220, 236);
    font-size: 0.9em;
    font-weight: 600;
    align-items: center;
    border-bottom: 1px solid rgb(190, 194, 213);
`;

const HeaderColumn = styled(Flex)`
    height: 100%;
    align-items: center;
    padding: 0 10px;
    text-transform: uppercase;
`;

const Column = styled(Flex)`
    height: 100%;
    align-items: center;
    border-right: 1px solid ${({theme}) => theme.multiSelect.listItemBorder};
    padding: 0 10px;

    cursor: ${props => (props.isAction ? 'pointer' : 'move')};

    &:last-child {
        border-right: 0;
    }
`;

const SubLabel = styled.div`
    font-size: 0.8em;
    color: ${({theme}) => theme.multiSelect.listItemFadedFg};
    text-transform: uppercase;
`;

const CheckboxIcon = styled(Icon)`
    color: #95a5a6;

    ${props =>
        props.checked &&
        css`
            color: #3ac376;
        `}
`;

const Checkbox = ({checked}) => (
    <CheckboxIcon name={checked ? 'check' : 'check-empty'} checked={checked} />
);

const Item = ({metricName, reportingPeriod, required, index, onToggleRequired, onRemove}) => (
    <StyledItem index={index}>
        <Column width={80} justifyContent='center' onClick={onToggleRequired} isAction>
            <Checkbox checked={required} />
        </Column>
        <Column flex={1} justifyContent='space-between'>
            {metricName}
            <SubLabel>{reportingPeriod}</SubLabel>
        </Column>
        <Column width={40} justifyContent='center' onClick={onRemove} isAction>
            <Icon glyphicon name='remove' />
        </Column>
    </StyledItem>
);
export default class MetricList extends React.Component {
    wrapper = React.createRef();

    static propTypes = {
        scrollOnUpdate: PropTypes.bool.isRequired,
        metrics: PropTypes.arrayOf(
            PropTypes.shape({
                metric: PropTypes.shape({
                    baseMetricName: PropTypes.string.isRequired,
                    reportingPeriod: PropTypes.string.isRequired,
                }),
                required: PropTypes.bool,
            }),
        ).isRequired,
        onMove: PropTypes.func.isRequired,
        onToggleRequired: PropTypes.func.isRequired,
        onRemove: PropTypes.func.isRequired,
    };

    static defaultProps = {
        scrollOnUpdate: true,
        metrics: [],
    };

    componentDidUpdate(prevProps) {
        const {scrollOnUpdate, metrics} = this.props;

        if (scrollOnUpdate && metrics.length !== prevProps.metrics.length) {
            this.wrapper.current.scrollTop = this.wrapper.current.scrollHeight;
        }
    }

    render() {
        const {metrics, onMove, onToggleRequired, onRemove} = this.props;

        return (
            <Container>
                <Header>
                    <HeaderColumn justifyContent='center' width={80}>
                        Required
                    </HeaderColumn>
                    <HeaderColumn flex={1}>Name</HeaderColumn>
                </Header>
                <Wrapper ref={this.wrapper}>
                    {metrics.map((m, index) => (
                        <SortableItem
                            index={index}
                            key={m.metric.uid}
                            metricName={m.metric.baseMetricName}
                            reportingPeriod={m.metric.reportingPeriod}
                            required={m.required}
                            onMove={onMove}
                            onRemove={() => onRemove(index)}
                            onToggleRequired={() => onToggleRequired(index)}
                        />
                    ))}
                </Wrapper>
            </Container>
        );
    }
}
