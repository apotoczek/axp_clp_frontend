import React from 'react';

import styled, {css} from 'styled-components';
import {Box} from '@rebass/grid';

import {ScrollableContent} from 'components/layout';
import Icon from 'components/basic/Icon';

import {SYSTEM_DIRECTORY_UIDS} from 'src/libs/Constants';

const IndexContainer = styled(Box)`
    padding: 0 15px 15px;
    height: 100%;
    min-height: 250px;
    flex: 3;
    display: flex;
    flex-direction: row;
    position: relative;
`;

const IndexTable = styled.div`
    background-color: ${({theme}) => theme.directoryIndex.tableBg};
    display: flex;
    flex-direction: column;
    flex: 1;
    color: ${({theme}) => theme.directoryIndex.tableFg};
    border: 1px solid ${({theme}) => theme.directoryIndex.tableBorder};
    cursor: default;
    user-select: none;
    width: 100%;
`;

const IndexRowMixin = `
    display: flex;
    border-width: 0 0 1px;
    border-style: solid;
    align-items: center;
`;

const IndexHeading = styled.div` ${IndexRowMixin}
    background-color: ${({theme}) => theme.directoryIndex.headerBg};
    color: ${({theme}) => theme.directoryIndex.headerFg};
    border-color: ${({theme}) => theme.directoryIndex.headerBorder};
`;

const IndexEntry = styled.a`
    ${IndexRowMixin}
    cursor: pointer;
    color: ${({theme}) => theme.directoryIndex.rowFg};
    border-color: ${({theme}) => theme.directoryIndex.rowSeparator};
    font-size: 12px;

    &:hover {
        color: inherit;
        text-decoration: none;
        background-color: ${({theme}) => theme.directoryIndex.rowActiveBg};
    }

    &:nth-child(even) {
        background-color: ${({theme}) => theme.directoryIndex.rowAltBg};
    }

    ${({disabled}) =>
        disabled &&
        css`
            pointer-events: none;
            cursor: default;
            opacity: 0.5;
        `}
`;

const IndexColumn = styled.div`
    flex: 1;
    padding: ${({compact}) => (compact ? '5px' : '10px')};
    white-space: nowrap;
    overflow-x: hidden;
    text-overflow: ellipsis;
    ${({onClick}) => (onClick ? 'cursor: pointer;' : '')}
    line-height: initial;
`;
const Type = styled(IndexColumn)`
    flex: none;
    display: flex;
    align-items: center;
    width: 40px;
`;
const Name = styled(IndexColumn)`
    flex: 5;
`;
const Owner = styled(IndexColumn)`
    flex: 2;
`;
const SystemOwned = styled.i`
    color: ${({theme}) => theme.directoryIndex.systemOwnedFg};
`;
const Dots = styled(IndexColumn)`
    flex: none;
    width: 40px;
    overflow: visible;
    position: relative;
    text-align: center;
    padding: 5px;
`;
const SortingDirection = styled.span`
    float: left;
    padding-right: 4px;
`;

const ResultPath = styled.div`
    color: ${({theme}) => theme.directoryIndex.searchResultPathFg};
    width: 100%;
    padding: 5px;
    white-space: nowrap;
    overflow-x: hidden;
    text-overflow: ellipsis;
`;

const fileIconMap = {
    directory: 'folder',
    report: 'form',
};

const undefault = fn => e => {
    (fn || (_ => _))(e);
    e.preventDefault();
    e.stopPropagation();
};

function getIconName(entity) {
    if (entity.entry.system) {
        switch (entity.entry.uid) {
            case SYSTEM_DIRECTORY_UIDS.Owned:
                return 'google-sheets';
            case SYSTEM_DIRECTORY_UIDS.Shared:
                return 'collaborate';
        }

        return 'folder';
    }

    return fileIconMap[entity.entry.entry_type];
}

function getOwner(entity) {
    if (entity.entry.system) {
        return <SystemOwned>System folder</SystemOwned>;
    }

    return entity.entry.owner ? (
        <span>{entity.entry.owner}</span>
    ) : (
        <SystemOwned>Unknown</SystemOwned>
    );
}

const SortingArrow = ({item, sorting: [sortItem, direction]}) => {
    return item === sortItem ? <SortingDirection className={`sort-${direction}`} /> : <span />;
};

const IndexRow = ({entity, showPath, nameOnly, clickEntry, clickDots, loading = false}) => (
    <IndexEntry
        key={entity.entry.uid}
        onClick={clickEntry(entity.entry, entity.absolutePath)}
        disabled={loading}
        onContextMenu={undefault(clickDots && !entity.entry.system && clickDots(entity.entry))}
    >
        <Type compact={nameOnly}>
            {loading ? (
                <Icon name='cog' glyphicon size={20} left spin />
            ) : (
                <Icon name={getIconName(entity)} size={25} bisonicon left />
            )}
        </Type>
        <Name compact={nameOnly}>
            {entity.entry.name}
            {showPath ? (
                <ResultPath>{`${entity.path.slice(0, -1).join(' / ')}` || '/'}</ResultPath>
            ) : (
                undefined
            )}
        </Name>
        {!nameOnly ? <Owner>{getOwner(entity)}</Owner> : undefined}
        {!nameOnly ? (
            <Dots>
                {!entity.entry.system ? (
                    <Icon
                        glyphicon
                        name='option-vertical'
                        onClick={undefault(clickDots(entity.entry))}
                    />
                ) : (
                    undefined
                )}
            </Dots>
        ) : (
            undefined
        )}
    </IndexEntry>
);

function DirectoryContents({
    entries,
    clickEntry,
    clickDots,
    sorting,
    setSort,
    nameOnly = false,
    showPath = false,
    loadingStates,
}) {
    return (
        <IndexContainer>
            <IndexTable>
                <IndexHeading>
                    <Type compact={nameOnly}></Type>
                    <Name compact={nameOnly} onClick={setSort ? setSort('name') : undefined}>
                        {sorting ? <SortingArrow item='name' sorting={sorting} /> : undefined}
                        Name
                    </Name>
                    {!nameOnly ? (
                        <Owner onClick={setSort ? setSort('owner') : undefined}>
                            {sorting ? <SortingArrow item='owner' sorting={sorting} /> : undefined}
                            Owner
                        </Owner>
                    ) : (
                        undefined
                    )}
                    {!nameOnly ? <Dots></Dots> : undefined}
                </IndexHeading>
                <ScrollableContent>
                    {entries.map(entity => (
                        <IndexRow
                            key={entity.entry.uid}
                            entity={entity}
                            showPath={showPath}
                            nameOnly={nameOnly}
                            clickEntry={clickEntry}
                            clickDots={clickDots}
                            loading={loadingStates ? loadingStates[entity.entry.uid] : false}
                        />
                    ))}
                </ScrollableContent>
            </IndexTable>
        </IndexContainer>
    );
}

export default DirectoryContents;
