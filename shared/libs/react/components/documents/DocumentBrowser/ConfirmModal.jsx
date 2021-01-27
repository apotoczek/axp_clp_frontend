import React from 'react';

import {Flex, Box} from '@rebass/grid';
import {H1} from 'components/basic/text';
import {ModalHeader} from 'components/reporting/shared';
import Modal, {ModalContent} from 'components/basic/Modal';
import Button from 'components/basic/forms/Button';

import {ModalInfo} from './shared';

const ConfirmModal = ({
    isOpen,
    toggleModal,
    genPrompt,
    info,
    entry,
    onAccept,
    confirmText,
    actions,
}) => {
    return (
        <Modal openStateChanged={toggleModal} isOpen={isOpen}>
            <ModalContent flexDirection='column' style={{width: '600px'}}>
                <ModalHeader width={1} pb={2} mb={3}>
                    <Box width={1}>
                        <H1>{genPrompt ? genPrompt(entry || {}) : ''}</H1>
                    </Box>
                </ModalHeader>
                {info ? <ModalInfo>{info}</ModalInfo> : undefined}
                <Flex alignSelf='flex-end'>
                    <Button mr={1} onClick={toggleModal}>
                        Cancel
                    </Button>
                    <Button
                        primary
                        onClick={() => {
                            onAccept({actions, entry});
                            toggleModal();
                        }}
                    >
                        {confirmText || ''}
                    </Button>
                </Flex>
            </ModalContent>
        </Modal>
    );
};

export default ConfirmModal;
