import React from 'react';
import PropTypes from 'prop-types';

import {connect} from 'react-redux';

import * as modalSelectors from 'selectors/modal';
import * as modalActions from 'actions/view/modal';

import Modal from 'components/basic/Modal';

class ModalContainer extends React.Component {
    static propTypes = {
        isModalOpen: PropTypes.bool.isRequired,
        modalKey: PropTypes.string.isRequired,
    };

    handleOpenStateChanged = _ => {
        const {toggleModal, modalKey} = this.props;
        toggleModal(modalKey);
    };

    isOpen = () => {
        const {isModalOpen, activeModal, modalKey} = this.props;
        return isModalOpen && activeModal == modalKey;
    };

    render() {
        return (
            <Modal
                isOpen={this.isOpen()}
                openStateChanged={this.handleOpenStateChanged}
                render={this.props.render || (() => this.props.children)}
            />
        );
    }
}

const mapStateToProps = (state, props) => ({
    isModalOpen: modalSelectors.isOpen(state, props),
    activeModal: modalSelectors.active(state, props),
});

const dispatchToProps = {
    toggleModal: modalActions.toggleModal,
};

export default connect(mapStateToProps, dispatchToProps)(ModalContainer);
