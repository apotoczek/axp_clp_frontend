import styled from 'styled-components';

export const ModalTypes = {
    DirectoryName: 1,
    DirectoryPicker: 2,
    Confirm: 3,
};

export function getSelectedDirectory(root, selectedPath) {
    if (selectedPath && selectedPath.length > 0) {
        const selector = `children[${selectedPath.join('].children[')}]`;
        const selected = Object.get(root, selector);
        return selected;
    }
    return root;
}

export function getEntries(selectedDirectory, entrySorter, excludeUids) {
    const entries = Object.values(selectedDirectory.children);

    if (excludeUids) {
        return entries.filter(({entry}) => !excludeUids.includes(entry.uid)).sort(entrySorter);
    }

    return entries.sort(entrySorter);
}

export const ModalInfo = styled.div`
    color: ${({theme}) => theme.directoryIndex.modalInfoFg};
`;
