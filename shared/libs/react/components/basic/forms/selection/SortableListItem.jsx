import React from 'react';
import ListItem from 'components/basic/forms/selection/ListItem';
import {DragSource, DropTarget} from 'react-dnd';

const Type = 'item';

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

class SortableListItem extends React.Component {
    node = React.createRef();

    render() {
        const {connectDragSource, connectDropTarget, ...rest} = this.props;

        return connectDragSource(
            connectDropTarget(
                <div style={sortableStyles(this.props)} ref={this.node}>
                    <ListItem {...rest} />
                </div>,
            ),
        );
    }
}

export default DropTarget(
    Type,
    itemTarget,
    targetCollect,
)(DragSource(Type, itemSource, sourceCollect)(SortableListItem));
