import React from 'react';
import PropTypes from 'prop-types';

import ReactDOM from 'react-dom';

const popoverRoot = document.getElementById('popover-root');

export const PopoverPlacementMode = {
    MouseCoordinate: 'mouseCoordinate',
    RelativeParent: 'relativeParent',
};

export const calculateCPanelPosition = (
    wrapperBoundingRect,
    popoverBoundingRect,
    settings = {},
) => {
    const {offsetX = 0} = settings;

    const {
        left: parentX,
        top: parentY,
        width: parentWidth,
        height: parentHeight,
    } = wrapperBoundingRect;
    const {
        // width: popoverWidth,
        height: popoverHeight,
    } = popoverBoundingRect;

    // Calculate new Y position, make sure it's not outside of the client.
    let newY;
    const parentMidY = parentY + parentHeight / 2;
    const halfPopoverHeight = popoverHeight / 2;
    if (parentMidY - halfPopoverHeight < 16) {
        newY = 16;
    } else if (parentY + halfPopoverHeight > window.innerHeight - 16) {
        newY = window.innerHeight - popoverHeight - 16;
    } else {
        newY = parentMidY - halfPopoverHeight;
    }

    const newX = parentX + parentWidth + offsetX;

    return {
        x: newX,
        y: newY,
        arrowTop: parentMidY - newY,
    };
};

function relativeMouseLocation(relative, popover, _settings) {
    // Calculate new Y position, make sure it's not outside of the client.
    let y = relative.y;
    if (y + popover.height > window.innerHeight) {
        // If the popover expands below the windows height,
        y = y - (y + popover.height - window.innerHeight);
    }

    // Calculate new X position, make sure it's not outside of the client.
    let x = relative.x;
    if (x + popover.width > window.innerWidth) {
        x = x - popover.width;
    }

    return {x, y};
}

function relativeParentLocation(parent, popover, settings) {
    const {offsetY = 0} = settings;
    // Calculate new Y position, make sure it's not outside of the client.
    let y;
    if (parent.y + parent.height + popover.height > window.innerHeight) {
        // If we place the popover below the parent it will not be fully visible
        // therefore place it above
        y = parent.y - popover.height - offsetY;
    } else {
        y = parent.y + parent.height + offsetY;
    }

    // Calculate new X position, make sure it's not outside of the client.
    let x = parent.x;
    if (parent.x + popover.width > window.innerWidth) {
        x = parent.x + parent.width - popover.width;
    }

    return {x, y};
}

export function calculatePosition(relativeBoundingRect, popoverBoundingRect, settings = {}) {
    const {placementMode = PopoverPlacementMode.RelativeParent} = settings;

    if (placementMode === PopoverPlacementMode.MouseCoordinate) {
        return {
            ...relativeMouseLocation(relativeBoundingRect, popoverBoundingRect, settings),
            minWidth: relativeBoundingRect.width,
        };
    } else if (placementMode === PopoverPlacementMode.RelativeParent) {
        return {
            ...relativeParentLocation(relativeBoundingRect, popoverBoundingRect, settings),
            minWidth: relativeBoundingRect.width,
        };
    }
    throw 'Invalid popover open location. Cannot calculate open location properly.';
}

class Popover extends React.Component {
    static propTypes = {
        x: PropTypes.number.isRequired,
        y: PropTypes.number.isRequired,
        children: PropTypes.node.isRequired,
        minWidth: PropTypes.number,
    };

    static defaultProps = {
        y: 0,
        x: 0,
    };

    constructor(props) {
        super(props);
        this.element = document.createElement('div');
        this.element.style.top = `${props.y}px`;
        this.element.style.left = `${props.x}px`;
        this.element.style.position = 'fixed';

        if (props.minWidth) {
            this.element.style.minWidth = `${props.minWidth}px`;
        }

        // You know, because over 9000, also because modals are z-index 9001.
        this.element.style.zIndex = '9002';
        popoverRoot.appendChild(this.element);
    }

    componentDidUpdate() {
        const {x, y, minWidth} = this.props;
        this.element.style.left = `${x}px`;
        this.element.style.top = `${y}px`;

        if (minWidth) {
            this.element.style.minWidth = `${minWidth}px`;
        }
    }

    componentWillUnmount() {
        popoverRoot.removeChild(this.element);
    }

    render() {
        return ReactDOM.createPortal(this.props.children, this.element);
    }
}

export default Popover;
