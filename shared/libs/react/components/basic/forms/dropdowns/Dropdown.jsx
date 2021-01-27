import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {Flex, Box} from '@rebass/grid';

import ExtraPropTypes from 'utils/extra-prop-types';

import Popover, {PopoverPlacementMode, calculatePosition} from 'components/basic/Popover';

const DropdownState = {
    Open: 'open',
    Opening: 'opening',
    Closed: 'closed',
};

export const DropdownOpenLocation = PopoverPlacementMode;
export const DropdownOpenMode = {
    Click: 1,
    ContextMenuClick: 2,
    Hover: 4,
};

const undefaultAndClearSelection = handler => e => {
    e.preventDefault();
    e.stopPropagation();

    // Clear the selection, because right clicking on text will automatically select it.
    if (document.selection && document.selection.empty) {
        document.selection.empty();
    } else if (window.getSelection) {
        let sel = window.getSelection();
        sel.removeAllRanges();
    }

    handler(e);
};

export default class Dropdown extends Component {
    static propTypes = {
        render: (props, propName, componentName, ...rest) => {
            if (!props.render && !props.content) {
                return new Error(oneLine`
                    One of props 'render' or 'content' was not specified in
                    '${componentName}'.
                `);
            }

            return PropTypes.func(props, propName, componentName, ...rest);
        },
        content: (props, propName, componentName, ...rest) => {
            if (!props.render && !props.content) {
                return new Error(oneLine`
                    One of props 'render' or 'content' was not specified in
                    '${componentName}'.
                `);
            }

            return PropTypes.node(props, propName, componentName, ...rest);
        },
        className: PropTypes.string,
        disabled: PropTypes.bool,
        children: PropTypes.node,
        openWith: PropTypes.number,
        openLocation: ExtraPropTypes.valueFromEnum(DropdownOpenLocation),
        hoverOpenDelay: PropTypes.number,
        onClickOutside: PropTypes.func,
        positionSettings: PropTypes.object,
        onClosed: PropTypes.func.isRequired,
        parentRef: PropTypes.object,
    };

    static defaultProps = {
        disabled: false,
        openWith: DropdownOpenMode.Click,
        openLocation: DropdownOpenLocation.RelativeParent,
        onClickOutside: () => true,
        onClosed: () => {},
    };

    state = {
        state: DropdownState.Closed,
    };

    ticking = false;
    delayHoverHandle = null;

    componentDidMount() {
        document.addEventListener('mousedown', this.handleClickOutside, false);
        document.addEventListener('scroll', this.handleScroll, true);
    }

    componentWillUnmount() {
        document.removeEventListener('mousedown', this.handleClickOutside, false);
        document.removeEventListener('scroll', this.handleScroll, true);
    }

    handleScroll = () => {
        if (!this.ticking) {
            window.requestAnimationFrame(() => {
                if (this.state.state == DropdownState.Open) {
                    const wrapperRect = this.wrapper.current.getBoundingClientRect();

                    // Check if another element is on top of the wrapper, if so, close
                    const element = document.elementFromPoint(
                        wrapperRect.x + wrapperRect.width / 2,
                        wrapperRect.y + wrapperRect.height / 2,
                    );

                    if (this.wrapper.current.contains(element) || this.popover.contains(element)) {
                        const {x: newX, y: newY, minWidth} = calculatePosition(
                            wrapperRect,
                            this.popover.getBoundingClientRect(),
                            {openLocation: this.props.openLocation, ...this.props.positionSettings},
                        );

                        this.setState({x: newX, y: newY, minWidth});
                    } else {
                        this.setState({state: DropdownState.Closed});
                    }
                }
                this.ticking = false;
            });

            this.ticking = true;
        }
    };

    handleClickOutside = ({target}) => {
        if (this.state.state === DropdownState.Closed) {
            return;
        }

        let clickedInside = this.wrapper.current.contains(target) || this.popover.contains(target);
        if (!clickedInside) {
            const shouldClose = this.props.onClickOutside();
            if (shouldClose) {
                this.setState({state: DropdownState.Closed});
                this.props.onClosed();
            }
        }
    };

    handleKeyPressed = event => {
        if (event.key === 'Escape') {
            this.setState({state: DropdownState.Closed});
            this.props.onClosed();
        }
    };

    componentDidUpdate() {
        // If we're currently in the process of opening the popover, we set it
        // to open, since at this point we have the reference to the popover
        // dom node again.
        if (this.state.state === DropdownState.Opening) {
            this.onTogglePopover();
        }
    }

    onTogglePopover = e => {
        if (e) {
            e.stopPropagation();
        }

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
        if (!this.popover) {
            let relativePosition;
            if (this.props.openLocation === DropdownOpenLocation.RelativeParent) {
                relativePosition = this.wrapper.current.getBoundingClientRect();
            } else if (this.props.openLocation === DropdownOpenLocation.MouseCoordinate) {
                // TODO: This is not fool proof. This assumes the event was sent to this
                // function when the user clicked. If it wasn't we default to top left.
                relativePosition = {x: e?.clientX ?? 0, y: e?.clientY ?? 0};
            }

            this.setState({state: DropdownState.Opening, relativePosition});
            return;
        }

        const {x: newX, y: newY, minWidth} = calculatePosition(
            this.state.relativePosition,
            this.popover.getBoundingClientRect(),
            {placementMode: this.props.openLocation, ...this.props.positionSettings},
        );

        const wasOpen = this.state.state === DropdownState.Open;
        const newDropdownState = wasOpen ? DropdownState.Closed : DropdownState.Open;
        this.setState({state: newDropdownState, x: newX, y: newY, minWidth});

        if (newDropdownState === DropdownState.Closed) {
            this.props.onClosed();
        }
    };

    onMouseEnter = () => {
        if (this.props.disabled || (this.props.openWith & DropdownOpenMode.Hover) === 0) {
            return;
        }

        if (!this.props.hoverOpenDelay) {
            return this.onTogglePopover();
        }

        this.delayHoverHandle = setTimeout(() => {
            this.onTogglePopover();
            this.delayHoverHandle = null;
        }, this.props.hoverOpenDelay);
    };

    onMouseLeave = () => {
        if (this.props.disabled || (this.props.openWith & DropdownOpenMode.Hover) === 0) {
            return;
        }

        if (this.delayHoverHandle) {
            clearTimeout(this.delayHoverHandle);
        }

        return this.setState({state: DropdownState.Closed});
    };

    renderDropdownContent = () => {
        if (typeof this.props.render === 'function') {
            return this.props.render({
                togglePopover: this.onTogglePopover,
            });
        }

        return this.props.content;
    };

    renderDropdown = () => {
        if (this.state.state === DropdownState.Closed) {
            return null;
        }

        return (
            <Popover
                x={this.state.x}
                y={this.state.y}
                maxHeight={20}
                minWidth={this.state.minWidth}
            >
                <Flex
                    ref={ref => (this.popover = ref)}
                    onClick={e => e.stopPropagation()}
                    onMouseDown={e => e.stopPropagation()}
                    onKeyUp={this.handleKeyPressed.bind(this)}
                >
                    {this.renderDropdownContent()}
                </Flex>
            </Popover>
        );
    };

    render() {
        const {
            disabled,
            openWith,
            className,
            children,
            onClickOutside: _onClickOutside,
            onClosed: _onClosed,
            parentRef,
            ...restProps
        } = this.props;

        let clickOpenProps = !disabled && {
            onClick: (openWith & DropdownOpenMode.Click && this.onTogglePopover) || undefined,
            onContextMenu:
                (openWith & DropdownOpenMode.ContextMenuClick &&
                    undefaultAndClearSelection(this.onTogglePopover)) ||
                undefined,
        };

        const wrapperRef = React.createRef();
        if (parentRef) {
            this.wrapper = parentRef;
        } else {
            this.wrapper = wrapperRef;
        }

        return (
            <Flex
                flex={1}
                className={className}
                ref={wrapperRef}
                {...clickOpenProps}
                {...restProps}
            >
                <Box flex={1} onMouseEnter={this.onMouseEnter} onMouseLeave={this.onMouseLeave}>
                    {children}
                </Box>
                {this.renderDropdown()}
            </Flex>
        );
    }
}
