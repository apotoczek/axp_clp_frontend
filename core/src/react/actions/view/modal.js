import * as modalSelectors from 'selectors/modal';

import {MODAL_OPEN, MODAL_CLOSE} from 'action-types/view';

export const openModal = key => {
    if (key) {
        return {
            type: MODAL_OPEN,
            payload: {
                key,
                open: true,
            },
        };
    }

    return {
        type: MODAL_OPEN,
        payload: {
            open: true,
        },
    };
};

export const closeModal = () => {
    return {
        type: MODAL_CLOSE,
        payload: {
            open: false,
        },
    };
};

export const toggleModal = key => (dispatch, getState) => {
    if (modalSelectors.isModalWithKeyOpen(key)(getState())) {
        dispatch(closeModal());
    } else {
        dispatch(openModal(key));
    }
};
