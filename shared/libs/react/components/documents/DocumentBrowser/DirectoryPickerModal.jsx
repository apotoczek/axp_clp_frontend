import React, {useState} from 'react';
import {Flex, Box} from '@rebass/grid';

import {H1} from 'components/basic/text';
import {ModalHeader} from 'components/reporting/shared';
import Modal, {ModalContent} from 'components/basic/Modal';
import {SYSTEM_DIRECTORY_UIDS} from 'src/libs/Constants';
import Button from 'components/basic/forms/Button';

import DirectoryBreadcrumbs from './DirectoryBreadcrumbs';
import DirectoryContents from './DirectoryContents';
import {ModalInfo, getEntries, getSelectedDirectory} from './shared';

const DirectoryPickerModal = ({
    isLoading,
    isOpen,
    toggleModal,
    entry,
    root,
    startPath,
    entrySorter,
    genPrompt,
    actions,
    confirmText,
    onAccept,
}) => {
    const [selectedPath, setSelectedPath] = useState(startPath);
    const clickBreadcrumb = path => () => setSelectedPath(path);
    const current = getSelectedDirectory(root, selectedPath);

    const atParent = (target, current) =>
        current && target && target.parent_uid === current.entry.uid;
    const containsReport = (target, current) => {
        return (
            entry &&
            current &&
            Object.values(current.children).some(
                {
                    report: ({entry}) => entry.dashboard_uid === target.dashboard_uid,
                    directory: ({entry}) => entry.name === target.name,
                }[target.entry_type],
            ) &&
            {
                report: 'This report already exists in this folder.',
                directory: 'A folder by this name already exists in this folder.',
            }[target.entry_type]
        );
    };

    if (!current || isLoading) {
        return null;
    }
    const alreadyContained = containsReport(entry, current);
    const sameDirectory = atParent(entry, current);

    // You can't pick yourself, owned or shared
    const excludeUids = [entry.uid, SYSTEM_DIRECTORY_UIDS.Owned, SYSTEM_DIRECTORY_UIDS.Shared];

    // Don't allow leaves in root for now
    const leafInRoot = entry.entry_type !== 'directory' && current === root;

    const entries = getEntries(current, entrySorter, excludeUids);

    return (
        <Modal openStateChanged={toggleModal} isOpen={isOpen}>
            <ModalContent flexDirection='column' style={{width: '600px'}}>
                <ModalHeader width={1} pb={2} mb={3} marginBottom={0}>
                    <Box width={1}>
                        <H1>{genPrompt ? genPrompt(entry || {}) : ''}</H1>
                    </Box>
                </ModalHeader>
                <Flex mt={3} flexDirection='column'>
                    <DirectoryBreadcrumbs
                        selectedPath={selectedPath}
                        onClick={clickBreadcrumb}
                        root={root}
                    />
                    <DirectoryContents
                        entries={entries}
                        clickEntry={entry => () => {
                            if (entry.entry_type === 'directory') {
                                setSelectedPath([...selectedPath, entry.uid]);
                            }
                        }}
                        clickDots={undefined}
                        nameOnly
                    />
                    {!sameDirectory && alreadyContained ? (
                        <ModalInfo>{alreadyContained}</ModalInfo>
                    ) : (
                        undefined
                    )}
                    <Flex mt={3} alignSelf='flex-end'>
                        <Button mr={1} onClick={toggleModal}>
                            Cancel
                        </Button>
                        <Button
                            primary
                            disabled={sameDirectory || alreadyContained || leafInRoot}
                            onClick={() => {
                                onAccept({
                                    actions,
                                    entryUid: entry.uid,
                                    parentUid: current.entry.uid,
                                });
                                setSelectedPath([]);
                                toggleModal();
                            }}
                        >
                            {confirmText || ''}
                        </Button>
                    </Flex>
                </Flex>
            </ModalContent>
        </Modal>
    );
};

export default DirectoryPickerModal;
