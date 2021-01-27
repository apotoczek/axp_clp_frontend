import React from 'react';

import Modal, {ModalContent, ModalHeader} from 'components/basic/Modal';
import {Box, Flex} from '@rebass/grid';
import styled from 'styled-components';

import Button from 'components/basic/forms/Button';

import {Label} from 'components/basic/forms/base';
import MemberLabelBox from 'components/datamanager/company/MemberLabelBox';

import {Description} from 'components/basic/text';

const Footer = styled(Flex)`
    min-height: 100px;
    margin-top: 15px;
    margin-bottom: 8px;
`;

const MemberBox = styled(Flex)`
    padding: 12px 15px;
    margin: 5px 0;
    border: 1px solid ${({theme}) => theme.input.border};
    color: ${({theme}) => theme.multiLevelSelector.memberBoxFg};
    align-items: center;
`;

export default function DeleteAttributeModal({
    isOpen,
    toggleModal,
    attributes,
    company,
    selectedAttribute,
    handleDelete,
}) {
    return (
        <Modal isOpen={isOpen} openStateChanged={toggleModal}>
            <ModalContent flexDirection='column' style={{width: '600px'}}>
                <ModalHeader width={1} pb={2} mb={3}>
                    <Box width={2 / 3}>Please confirm...</Box>
                </ModalHeader>
                <MemberBox>
                    <Box mx={3}>
                        <Label>{attributes[selectedAttribute].name}</Label>
                    </Box>
                    <MemberLabelBox
                        attribute={attributes[selectedAttribute]}
                        values={company.attributes[selectedAttribute]}
                    />
                </MemberBox>
                <Description>
                    Are you sure you want to delete these attributes? This action cannot be undone.
                </Description>
                <Footer flexDirection='column'>
                    <Flex justifyContent='flex-end'>
                        <Button
                            mr={1}
                            onClick={() => {
                                toggleModal();
                            }}
                        >
                            Cancel
                        </Button>
                        <Button danger mr={1} onClick={handleDelete}>
                            Delete
                        </Button>
                    </Flex>
                </Footer>
            </ModalContent>
        </Modal>
    );
}
