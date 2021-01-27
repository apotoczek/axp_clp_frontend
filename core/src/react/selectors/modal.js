import {createSelector} from 'reselect';

export const modalData = state => state.view.modal;

export const isOpen = createSelector([modalData], modalData => modalData.isOpen);

export const active = createSelector([modalData], modalData => modalData.key);

export const isModalWithKeyOpen = key =>
    createSelector(
        [isOpen, active],
        (open, activeModalKey) => open && (key ? activeModalKey === key : true),
    );
