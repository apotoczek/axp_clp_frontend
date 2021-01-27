import React, {useState} from 'react';
import {Flex, Box} from '@rebass/grid';

import {H1} from 'components/basic/text';
import {ModalHeader} from 'components/reporting/shared';
import Modal, {ModalContent} from 'components/basic/Modal';
import TextInput from 'components/basic/forms/input/TextInput';
import {DIRECTORY_DISALLOWED_CHARS} from 'src/libs/Constants';
import Button from 'components/basic/forms/Button';

import {ModalInfo} from './shared';

const DirectoryNameModal = ({
    isOpen,
    toggleModal,
    genPrompt,
    current,
    entry,
    onAccept,
    info,
    confirmText,
    actions,
}) => {
    const [name, setName] = useState('');
    const containsName = (v, current) =>
        current && Object.values(current.children).some(({entry}) => entry.name === v.trim());
    const illegalCharacter = v => DIRECTORY_DISALLOWED_CHARS.test(v.trim());
    const isBlank = v => /^\s*$/.test(v);
    return (
        <Modal openStateChanged={toggleModal} isOpen={isOpen}>
            <ModalContent flexDirection='column' style={{width: '600px'}}>
                <ModalHeader width={1} pb={2} mb={3}>
                    <Box width={2 / 3}>
                        <H1>
                            {isOpen &&
                                genPrompt({
                                    name: entry && entry.name,
                                    parentName: current.entry.name,
                                })}
                        </H1>
                    </Box>
                </ModalHeader>
                <Flex mt={3} flexDirection='column'>
                    <TextInput
                        leftLabel='Name'
                        placeholder='Folder name'
                        onValueChanged={setName}
                        debounceValueChange={false}
                        value={name}
                    />
                    {illegalCharacter(name) ? (
                        <ModalInfo>
                            Folder names can not contain slashes, backslashes, line breaks, or tabs.
                        </ModalInfo>
                    ) : (
                        undefined
                    )}
                    {containsName(name, current) ? (
                        <ModalInfo>
                            A folder named &apos;{name.trim()}&apos; already exists in this folder.
                        </ModalInfo>
                    ) : (
                        undefined
                    )}
                    {info ? <ModalInfo> {info} </ModalInfo> : undefined}
                    <Flex mt={3} alignSelf='flex-end' width={250}>
                        <Button mr={1} onClick={toggleModal}>
                            Cancel
                        </Button>
                        <Button
                            primary
                            disabled={
                                illegalCharacter(name) ||
                                containsName(name, current) ||
                                isBlank(name)
                            }
                            onClick={() => {
                                Promise.resolve(
                                    onAccept({actions, name, entry, parentUid: current.entry.uid}),
                                ).then(() => {
                                    setName('');
                                    toggleModal();
                                });
                            }}
                        >
                            {isOpen && confirmText}
                        </Button>
                    </Flex>
                </Flex>
            </ModalContent>
        </Modal>
    );
};

export default DirectoryNameModal;
