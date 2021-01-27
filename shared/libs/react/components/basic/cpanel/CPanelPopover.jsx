import React, {Component} from 'react';
import PropTypes from 'prop-types';
import styled, {css} from 'styled-components';

import {CPanelInputMixin} from 'components/basic/cpanel/mixins';
import Icon from 'components/basic/Icon';
import Popover from 'components/basic/Popover';
import {calculateCPanelPosition} from 'src/libs/react/components/basic/Popover';

const PopoverState = {
    Open: 'open',
    Opening: 'opening',
    Closed: 'closed',
};

const CPanelPopoverItemWrapper = styled.button`
    ${CPanelInputMixin}

    border-radius: 3px;
    background: ${({theme, selected}) =>
        selected ? theme.cPanel.popoverItemSelectedBg : 'transparent'};
    color: ${({theme, selected}) =>
        selected ? theme.cPanel.popoverItemSelectedFg : theme.cPanel.popoverFg};
    border: 1px solid
        ${({theme, selected}) =>
            selected ? theme.cPanel.popoverItemSelectedBorder : theme.cPanel.popoverItemBorder};
    text-align: left;
`;

export const CPanelPopoverItem = props => (
    <CPanelPopoverItemWrapper {...props}>
        {props.children}
        {props.selected ? <Icon glyphicon name='ok' right /> : null}
    </CPanelPopoverItemWrapper>
);

CPanelPopoverItem.propTypes = {
    children: PropTypes.node.isRequired,
    selected: PropTypes.bool,
};

export const CPanelPopoverDivider = styled.div`
    height: 2px;
    background: #181a21;
    border-bottom: 1px solid #383f4c;
    width: 100%;
    margin: 12px 0;
`;

export const CPanelPopoverTitle = styled.div`
    font-size: 14px;
    color: #859ed4;
    font-weight: 700;
    letter-spacing: 1px;
    text-transform: uppercase;
`;

const CPanelPopoverWrapper = styled.div`
    display: relative;
`;

const CPanelPopoverContent = styled.div`
    background: ${({theme}) => theme.cPanel.popoverBg};
    padding: 16px;
    min-width: 224px;

    border-radius: 2px;
    border: 1px solid ${({theme}) => theme.cPanel.popoverBorder};
    box-shadow: 0 3px 6px rgba(0, 0, 0, 0.16), 0 3px 6px rgba(0, 0, 0, 0.23);

    color: ${({theme}) => theme.cPanel.popoverFg};
`;

export const CPanelPopoverButton = styled.button`
    ${CPanelInputMixin}

    ${props =>
        props.truncate &&
        css`
            white-space: nowrap;
            text-overflow: ellipsis;
            overflow: hidden;
        `}

    border: none;
    text-align: left;
    opacity: ${props => (props.disabled ? 0.6 : 1.0)};
`;

const PopoverArrow = styled.div`
    top: ${props => (props.top ? `${props.top}px` : '50%')};
    border-width: 10px;
    position: absolute;
    display: block;
    width: 0;
    height: 0;
    border-color: transparent;
    border-style: solid;

    border-right-color: ${({theme}) => theme.cPanel.popoverBorder};

    left: -10px;
    margin-top: -10px;
    border-left-width: 0;
`;

class CPanelPopover extends Component {
    static propTypes = {
        extraOffsetX: PropTypes.number.isRequired,
        children: PropTypes.node.isRequired,
        // You can either pass the content directly, or provide a render fn
        content: PropTypes.element,
        render: PropTypes.func,
    };

    static defaultProps = {
        extraOffsetX: 10,
    };

    constructor(props) {
        super(props);

        this.state = {
            state: PopoverState.Closed,
        };
    }

    componentDidMount() {
        document.addEventListener('mousedown', this.handleClickOutside, false);
    }

    componentDidUpdate() {
        if (this.state.state === PopoverState.Opening) {
            this.onTogglePopover();
        }
    }

    componentWillUnmount() {
        document.removeEventListener('mousedown', this.handleClickOutside, false);
    }

    handleClickOutside = ({target}) => {
        if (this.state.state === PopoverState.Closed) {
            return;
        }

        let clickedInside = this.wrapper.contains(target) || this.popover.contains(target);
        if (!clickedInside) {
            this.setState({state: PopoverState.Closed});
        }
    };

    onTogglePopover = () => {
        if (!this.wrapper) {
            throw oneLine`
                [c-panel-dropdown]: Failed to open dropdown. Ref was
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
            this.setState({state: PopoverState.Opening});
            this.forceUpdate();
            return;
        }

        const {extraOffsetX} = this.props;

        const {x, y, arrowTop} = calculateCPanelPosition(
            this.wrapper.getBoundingClientRect(),
            this.popover.getBoundingClientRect(),
            {offsetX: extraOffsetX},
        );

        const wasOpen = this.state.state === PopoverState.Open;
        this.setState({
            state: wasOpen ? PopoverState.Closed : PopoverState.Open,
            x,
            y,
            arrowTop,
        });
    };

    renderPopoverContent = () => {
        if (typeof this.props.render === 'function') {
            return this.props.render({
                togglePopover: this.onTogglePopover,
            });
        }

        return this.props.content;
    };

    renderPopover = () => {
        if (this.state.state === PopoverState.Closed) {
            return null;
        }

        return (
            <Popover x={this.state.x} y={this.state.y}>
                <PopoverArrow top={this.state.arrowTop} />
                <CPanelPopoverContent
                    ref={ref => (this.popover = ref)}
                    onClick={e => e.stopPropagation()}
                >
                    {this.renderPopoverContent()}
                </CPanelPopoverContent>
            </Popover>
        );
    };

    render() {
        return (
            <CPanelPopoverWrapper ref={ref => (this.wrapper = ref)} onClick={this.onTogglePopover}>
                {this.props.children}
                {this.renderPopover()}
            </CPanelPopoverWrapper>
        );
    }
}

export default CPanelPopover;
