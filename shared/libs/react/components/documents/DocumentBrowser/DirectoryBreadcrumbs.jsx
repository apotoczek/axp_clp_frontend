import React from 'react';
import styled from 'styled-components';

import {interleave} from 'src/libs/Utils';

import {getSelectedDirectory} from './shared';

const BreadcrumbContainer = styled.div`
    font-size: 16px;
    margin: 16px;
`;

const Breadcrumb = styled.button`
    height: 25px;
    color: ${({theme}) => theme.directoryIndex.breadcrumbFg};
    background-color: transparent;
    border: none;
    cursor: pointer;
    border-radius: 8px;
    outline: none;
`;

const BreadcrumbArrow = styled.span`
    height: 50px;
    color: ${({theme}) => theme.directoryIndex.breadcrumbSeparatorFg};
    border: none;
    cursor: default;
`;

const addArrows = interleave((_, ix) => (
    <BreadcrumbArrow key={`${ix}_after`}> {'>'} </BreadcrumbArrow>
));

const BreadcrumbItems = ({selectedPath, root, onClick}) => {
    const rootItem = ['root', 'Reports', []];

    const items = [rootItem].concat(
        selectedPath.map((_, idx) => {
            const partialPath = selectedPath.slice(0, idx + 1);
            const node = getSelectedDirectory(root, partialPath);

            return [node.entry.uid, node.entry.name, partialPath];
        }),
    );

    return addArrows(
        items.map(([key, name, path]) => (
            <Breadcrumb key={key} onClick={onClick(path)}>
                {name}
            </Breadcrumb>
        )),
    );
};

const DirectoryBreadcrumbs = ({selectedPath, root, onClick, override}) => {
    return (
        <BreadcrumbContainer>
            {override ? (
                <Breadcrumb>{override}</Breadcrumb>
            ) : (
                <BreadcrumbItems selectedPath={selectedPath} root={root} onClick={onClick} />
            )}
        </BreadcrumbContainer>
    );
};

export default DirectoryBreadcrumbs;
