import React from 'react';
import {css} from 'styled-components';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import {CSSTransition} from 'react-transition-group';
import {Flex} from '@rebass/grid';

import styled from 'styled-components';

const modalRoot = document.getElementById('modal-root');

const PositionModes = {
    CENTER: 'center',
    // TODO Implement other placements
    // LEFT: 'left',
    // RIGHT: 'right'
};

const AnimationModes = {
    // TODO Implement animations
    // FROM_BOTTOM: 'from_bottom',
    // FROM_TOP: 'from_top',
    // FROM_LEFT: 'from_left',
    // FROM_RIGHT: 'from_right',
    NONE: 'none',
};

const InnerWrapper = styled(Flex)`
    display: table;
    margin: 0 auto;

    background: ${({theme}) => theme.modal.bg};
    border-radius: 3px;

    padding: 16px;

    &.modal-enter {
        transform: translate(0, 30px);
        opacity: 0;
    }

    &.modal-enter-active {
        transform: translate(0, 75px);
        opacity: 1;
        transition: transform 450ms, opacity 450ms ease-out;
    }

    &.modal-exit {
        transform: translate(0, 75px);
        opacity: 1;
    }

    &.modal-exit-active {
        transform: translate(0, 30px);
        opacity: 0;
        transition: transform 450ms, opacity 450ms ease-out;
    }

    transform: translate(0, 75px);

    box-shadow: 0 3px 6px rgba(0, 0, 0, 0.16), 0 3px 6px rgba(0, 0, 0, 0.23);
`;

export default class Modal extends React.Component {
    static propTypes = {
        position: PropTypes.oneOf(Object.values(PositionModes)),
        animation: PropTypes.oneOf(Object.values(AnimationModes)),
        children: PropTypes.node,
        openStateChanged: PropTypes.func,
        isOpen: PropTypes.bool.isRequired,
        onExitAnimationComplete: PropTypes.func,
    };

    static defaultProps = {
        openStateChanged: () => {},
        position: PositionModes.CENTER,
        animation: AnimationModes.NONE,
    };

    constructor(props) {
        super(props);
        this.element = document.createElement('div');
        this.element.style.cssText = oneLine`
            left: 0;
            top: 0;
            position: absolute;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            z-index: 9001;
        `;
    }

    _closeModal = () => {
        this.props.openStateChanged(false);
    };

    handleClickOutside = event => {
        if (this.props.isOpen === false) {
            return;
        }

        if (event.target === this.element) {
            this._closeModal();
        }
    };

    componentDidMount() {
        if (this.props.isOpen) {
            modalRoot.appendChild(this.element);
        }

        document.addEventListener('mousedown', this.handleClickOutside, false);
    }

    componentWillUnmount() {
        if (modalRoot.contains(this.element)) {
            modalRoot.removeChild(this.element);
        }

        document.removeEventListener('mousedown', this.handleClickOutside, false);
    }

    componentDidUpdate(prevProps, _prevState) {
        if (this.props.isOpen === true && prevProps.isOpen !== this.props.isOpen) {
            modalRoot.appendChild(this.element);
        }
    }

    onExitAnimationComplete = () => {
        if (modalRoot.contains(this.element)) {
            modalRoot.removeChild(this.element);
        }

        if (this.props.onExitAnimationComplete) {
            this.props.onExitAnimationComplete();
        }
    };

    renderContent = () => {
        if (typeof this.props.render === 'function') {
            return this.props.render({toggleModal: () => this._closeModal()});
        }

        return this.props.children;
    };

    render() {
        const children = (
            <CSSTransition
                in={this.props.isOpen}
                timeout={450}
                classNames='modal'
                onExited={this.onExitAnimationComplete}
                unmountOnExit
            >
                <InnerWrapper>{this.renderContent()}</InnerWrapper>
            </CSSTransition>
        );
        return ReactDOM.createPortal(children, this.element);
    }
}

export const ModalHeader = styled(Flex)`
    border-bottom: 1px solid ${({theme}) => theme.modal.headerBorder};
    padding-bottom: 8px;
    margin-bottom: 16px;
`;

export const ModalContent = styled(Flex)`
    @media only screen and (max-width: 1024px) {
        width: 960px;
    }

    @media only screen and (min-width: 1025px) and (max-width: 1350px) {
        width: 960px;
    }

    @media only screen and (min-width: 1351px) and (max-width: 1920px) {
        width: 1280px;
    }

    @media only screen and (min-width: 1921px) {
        width: 1600px;
    }

    max-height: calc(100vh - 175px);

    ${props =>
        props.fullHeight &&
        css`
            height: calc(100vh - 250px);
        `};

    ${props =>
        props.scroll &&
        css`
            overflow-y: auto;
        `}
`;
