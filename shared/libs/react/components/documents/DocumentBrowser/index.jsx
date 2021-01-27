import React from 'react';
import PropTypes from 'prop-types';

import styled from 'styled-components';
import {Flex} from '@rebass/grid';
import Toolbar, {ToolbarItem} from 'components/basic/Toolbar';
import TextInput from 'components/basic/forms/input/TextInput';

import ContextMenu from 'components/basic/ContextMenu';
import ConfirmModal from './ConfirmModal';
import DirectoryPickerModal from './DirectoryPickerModal';
import DirectoryNameModal from './DirectoryNameModal';
import DirectoryContents from './DirectoryContents';
import DirectoryBreadcrumbs from './DirectoryBreadcrumbs';
import {getEntries, getSelectedDirectory, ModalTypes} from './shared';

export const shortUid = uid => uid.replace(/^([\da-f]{8})(?:-[\da-f]{4}){4}(?:[\da-f]{8})$/i, '$1');

const Wrapper = styled(Flex)`
    height: 100%;
    flex-direction: column;
    position: relative;
`;

const SearchContainer = styled.div`
    margin: 16px;
    margin-bottom: 0;
`;

function freetextSearch(root, text) {
    const words = text
        .spacify()
        .split(' ')
        .remove('');
    const rules = words
        .map(word =>
            [
                [
                    _ => 1,
                    word
                        .split('')
                        .filter(v => !v.isBlank())
                        .join('.*'),
                ],
                [_ => 10, word],
                [_ => 30, `[\\W^]${word}[\\W$]`],
                [_ => 100, `^${word}$`],
                [_ => 300, text],
                [_ => 900, `^${text}$`],
            ].map(([s, w]) => [s, RegExp(w, 'i')]),
        )
        .flat();
    const matches = [];
    function aux(root, rules, path) {
        const score = rules.sum(([points, rule]) =>
            rule.test(root.entry.name) ? points(root.entry.name) : 0,
        );
        if (score > 0) {
            matches.push([score, {...root, children: undefined, absolutePath: path}]);
        }
        if (root.children) {
            Object.values(root.children).forEach(v => aux(v, rules, [...path, v.entry.uid]));
        }
    }
    aux(root, rules, []);
    const sortedMatches = matches
        .filter(
            ([_, {entry}]) => !entry.system,
            // ).unique(  // Deduplication is disabled, uncomment this to enable it
            //     ([_, {entry}]) => entry.dashboard_uid || entry.uid
        )
        .sort(([scoreA, _a], [scoreB, _b]) => scoreB - scoreA);
    return sortedMatches;
}

const ContextMenuItems = {
    Report: {
        Attach: {
            type: ModalTypes.DirectoryPicker,
            menuText: 'Add to folder',
            confirmText: 'Add to this folder',
            genPrompt: ({name}) => `Add '${name}' to...`,
            info: oneLine`
                Note: Only users with read access to this report will be able
                to see it in the folder.  `,
            onAccept: ({actions, entryUid, parentUid}) =>
                actions.addReportToDirectory({
                    dashboardUid: entryUid,
                    parentUid: parentUid,
                }),
        },
        Detach: {
            type: ModalTypes.Confirm,
            menuText: 'Remove from folder',
            confirmText: 'Remove',
            info: oneLine`
                Note: This will not delete the report, but will remove it from
                the folder.`,
            genPrompt: ({name}) => `Remove report '${name}' from this folder?`,
            onAccept: ({actions, entry}) =>
                actions.removeReportFromDirectory({
                    entryUid: entry.uid,
                }),
        },
        Move: {
            type: ModalTypes.DirectoryPicker,
            menuText: 'Move',
            confirmText: 'Move here',
            genPrompt: ({name}) => `Move '${name}' to...`,
            onAccept: ({actions, entryUid, parentUid}) =>
                actions.moveReport({
                    entryUid,
                    parentUid,
                }),
        },
        Delete: {
            type: ModalTypes.Confirm,
            menuText: 'Delete',
            confirmText: 'Delete',
            genPrompt: ({name}) => `Are you sure you want to delete '${name}'?`,
            info: 'Note: This will delete the report for everyone.',
            onAccept: ({actions, entry}) =>
                actions.deleteReport({
                    dashboardUid: entry.dashboard_uid,
                }),
        },
        Duplicate: {
            menuText: 'Make copy',
            action: ({actions, entry}) =>
                actions.duplicateReport({
                    entryUid: entry.uid === entry.dashboard_uid ? undefined : entry.uid,
                    dashboardUid: entry.dashboard_uid,
                }),
        },
        Export: {
            menuText: 'Export as PDF',
            action: ({actions, entry}) =>
                actions.exportReport({
                    dashboardUid: entry.dashboard_uid,
                }),
        },
    },
    Folder: {
        Move: {
            type: ModalTypes.DirectoryPicker,
            menuText: 'Move',
            confirmText: 'Move here',
            genPrompt: ({name}) => `Move '${name}' to...`,
            onAccept: ({actions, entryUid, parentUid}) =>
                actions.moveDirectory({
                    entryUid,
                    parentUid,
                }),
        },
        Delete: {
            type: ModalTypes.Confirm,
            menuText: 'Delete',
            confirmText: 'Delete',
            genPrompt: ({name}) => `Are you sure you want to delete '${name}'?`,
            onAccept: ({actions, entry}) =>
                actions.deleteDirectory({
                    uid: entry.uid,
                }),
        },
        Rename: {
            type: ModalTypes.DirectoryName,
            menuText: 'Rename',
            confirmText: 'Rename',
            genPrompt: ({name}) => `Rename folder '${name}'`,
            onAccept: ({actions, entry, name}) =>
                actions.renameDirectory({
                    uid: entry.uid,
                    name,
                }),
        },
        Export: {
            menuText: 'Export as ZIP',
            action: ({actions, entry}) =>
                actions.exportDirectory({
                    entryUid: entry.uid,
                }),
        },
    },
};

function DocumentContextMenu({contextState, toggleModal, actions}) {
    const {x, y, entity} = contextState;
    let items = [];
    const register = (key, {action, menuText, type, ...config}) => {
        const onClick = action
            ? () => action({actions, entry: entity})
            : toggleModal(type, {entry: entity, ...config});

        items.push({key, onClick, label: menuText});
    };

    if (entity.entry_type === 'report') {
        if (entity.write) {
            if (entity.uid === entity.dashboard_uid) {
                // Unattached report
                register('attach_report', ContextMenuItems.Report.Attach);
            } else {
                // Attached report
                register('move_report', ContextMenuItems.Report.Move);
                register('detach_report', ContextMenuItems.Report.Detach);
            }
            register('export_report', ContextMenuItems.Report.Export);
            register('delete_report', ContextMenuItems.Report.Delete);
        }
        register('duplicate_report', ContextMenuItems.Report.Duplicate);
    } else if (entity.entry_type === 'directory') {
        register('move_folder', ContextMenuItems.Folder.Move);
        register('rename_folder', ContextMenuItems.Folder.Rename);
        register('delete_folder', ContextMenuItems.Folder.Delete);
        register('export_folder', ContextMenuItems.Folder.Export);
    }

    return <ContextMenu posX={x} posY={y} items={items} fixedPosition />;
}

class DocumentBrowser extends React.Component {
    static propTypes = {
        root: PropTypes.object,
    };

    state = {
        modal: undefined,
        context: undefined,
        sorting: undefined,
        searchQuery: '',
        loadingStates: {},
    };

    shouldComponentUpdate({isLoading, root, selectedPath}) {
        if (!isLoading && !getSelectedDirectory(root, selectedPath)) {
            this.setSelectedPath([]);
            return false;
        }
        return true;
    }

    componentWillUnmount() {
        document.removeEventListener('click', this.hideContextMenu);
    }

    getSelectedDirectory() {
        return getSelectedDirectory(this.props.root, this.props.selectedPath);
    }

    setSelectedPath(path) {
        this.props.history.push(`/documents/browse/${path.map(shortUid).join('/')}`);
    }

    setSort = new_field => () => {
        if (!this.state.sorting) {
            return this.setState({sorting: [new_field, 'asc']});
        }
        const [old_field, order] = this.state.sorting;
        if (old_field === new_field) {
            if (order === 'desc') {
                return this.setState({sorting: undefined});
            }
            return this.setState({sorting: [new_field, 'desc']});
        }
        return this.setState({sorting: [new_field, 'asc']});
    };

    toggleModal = (key, params) => () => {
        this.setState(state => ({
            modal: (state.modal && state.modal.key) === key ? undefined : {key: key, ...params},
        }));
    };

    clickEntry = (entry, absolutePath) => () => {
        switch (entry.entry_type) {
            case 'directory':
                this.setState({
                    searchQuery: '',
                });
                this.setSelectedPath(
                    absolutePath ? [...absolutePath] : [...this.props.selectedPath, entry.uid],
                );
                break;
            case 'report':
                this.props.history.push(`/documents/${entry.dashboard_uid}`);
                break;
            default:
                throw Error(
                    `Clicked a directory entry with unknown entry_type ${entry.entry_type}`,
                );
        }
    };

    hideContextMenu = () => {
        this.setState({context: undefined});
        document.removeEventListener('click', this.hideContextMenu);
    };

    openContextMenu = entity => e => {
        this.setState({
            context: {
                x: e.clientX,
                y: e.clientY,
                entity,
            },
        });
        document.addEventListener('click', this.hideContextMenu);
    };

    setSearchQuery = value => {
        this.setState({searchQuery: value});
    };

    handleBreadcrumbClick = path => () => {
        this.setSelectedPath(path);
    };

    setKeyLoading = (key, loading) => {
        this.setState(({loadingStates}) => ({
            loadingStates: {...loadingStates, [key]: loading},
        }));
    };

    wrappedAction = action => params => {
        const key = params.uid || params.entryUid || params.dashboardUid;

        if (key) {
            this.setKeyLoading(key, true);
            action(params)
                .then(() => this.setKeyLoading(key, false))
                .catch(() => this.setKeyLoading(key, false));
        } else {
            action(params);
        }
    };

    getEntrySorter = sorting => (a, b) => {
        const [field, direction] = sorting || ['name', 'asc'];
        if (!sorting) {
            if (a.entry.entry_type !== b.entry.entry_type) {
                // We want directories to appear before non-directories:
                if (a.entry.entry_type === 'directory') {
                    return -1;
                }
                if (b.entry.entry_type === 'directory') {
                    return 1;
                }
            } else if (a.entry.entry_type === 'directory') {
                // We also want system directories to appear first:
                if (a.entry.system != b.entry.system) {
                    return a.entry.system ? -1 : 1;
                }
            }
        }
        // First, try comparing the given field
        return (
            (a.entry[field] || '').localeCompare(b.entry[field] || '') *
                // if descending, invert it
                (direction === 'desc' ? -1 : 1) ||
            // if equal, fall back to second line of comparing names
            (a.entry.name || '').localeCompare(b.entry.name || '')
        );
    };

    renderToolbar() {
        const current = this.getSelectedDirectory();
        return (
            <Toolbar>
                <ToolbarItem
                    key='createDirectory'
                    onClick={this.toggleModal(ModalTypes.DirectoryName, {
                        genPrompt: () => 'New folder',
                        confirmText: 'Create',
                        onAccept: ({actions, name, parentUid}) =>
                            actions.createDirectory({
                                name,
                                parentUid,
                            }),
                    })}
                    icon='plus'
                    glyphicon
                    right
                    disabled={this.state.searchQuery || !current.entry.writable}
                >
                    New Folder
                </ToolbarItem>
                <ToolbarItem
                    key='createReport'
                    onClick={() =>
                        current.entry.system
                            ? this.props.history.push('/documents/create')
                            : this.props.history.push(`/documents/create/${current.entry.uid}`)
                    }
                    icon='plus'
                    glyphicon
                    right
                >
                    New Report
                </ToolbarItem>
            </Toolbar>
        );
    }

    render() {
        const {root, isLoading: loading, selectedPath, actions: baseActions} = this.props;
        const {modal, context, searchQuery, sorting, loadingStates} = this.state;
        const current = this.getSelectedDirectory();

        const actions = {};

        for (const [key, action] of Object.entries(baseActions)) {
            actions[key] = this.wrappedAction(action);
        }

        // This thing is a little workaround for when a directory in the
        // selected path is removed on invalidation
        let isLoading = loading;
        if (!isLoading && !current) {
            isLoading = true;
        }

        const entries = searchQuery
            ? freetextSearch(root, searchQuery).map(([_, v]) => v)
            : isLoading
            ? []
            : getEntries(current, this.getEntrySorter(sorting));

        return (
            <Wrapper>
                <DirectoryNameModal
                    isOpen={!!modal && modal.key === ModalTypes.DirectoryName}
                    toggleModal={this.toggleModal(ModalTypes.DirectoryName)}
                    current={current}
                    info={modal && modal.info}
                    genPrompt={modal && modal.genPrompt}
                    entry={modal && modal.entry}
                    onAccept={modal && modal.onAccept}
                    confirmText={modal && modal.confirmText}
                    actions={actions}
                />

                <ConfirmModal
                    isOpen={!!modal && modal.key === ModalTypes.Confirm}
                    toggleModal={this.toggleModal(ModalTypes.Confirm)}
                    info={modal && modal.info}
                    genPrompt={modal && modal.genPrompt}
                    entry={modal && modal.entry}
                    onAccept={modal && modal.onAccept}
                    confirmText={modal && modal.confirmText}
                    actions={actions}
                />

                <DirectoryPickerModal
                    isLoading={isLoading}
                    isOpen={!!modal && modal.key === ModalTypes.DirectoryPicker}
                    toggleModal={this.toggleModal(ModalTypes.DirectoryPicker)}
                    parentUid={(selectedPath || []).last()}
                    startPath={selectedPath}
                    entry={(modal && modal.entry) || {}}
                    root={root}
                    entrySorter={this.getEntrySorter(sorting)}
                    genPrompt={modal && modal.genPrompt}
                    confirmText={modal && modal.confirmText}
                    onAccept={modal && modal.onAccept}
                    actions={actions}
                />

                {context && (
                    <DocumentContextMenu
                        contextState={context}
                        actions={actions}
                        toggleModal={this.toggleModal}
                        fixedPosition
                    />
                )}
                {!isLoading ? this.renderToolbar() : <Toolbar flex />}

                <SearchContainer>
                    <TextInput
                        leftLabel='Search'
                        placeholder='Find a report or folder'
                        debounceValueChange
                        onValueChanged={this.setSearchQuery}
                        value={searchQuery}
                    />
                </SearchContainer>

                <DirectoryBreadcrumbs
                    selectedPath={selectedPath}
                    root={root}
                    onClick={this.handleBreadcrumbClick}
                    override={searchQuery}
                />

                <DirectoryContents
                    entries={entries}
                    clickEntry={this.clickEntry}
                    clickDots={this.openContextMenu}
                    showPath={!!searchQuery}
                    sorting={!searchQuery && sorting}
                    setSort={!searchQuery && this.setSort}
                    loadingStates={loadingStates}
                />
            </Wrapper>
        );
    }
}

export default DocumentBrowser;
