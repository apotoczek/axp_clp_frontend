/**
 * - [ ] Clean up (comments / remove inline styles / etc)
 */
import React, {useCallback, useState, useRef, useEffect} from 'react';
import AttributeTree, {gatherSubtreeIds} from 'bison/utils/AttributeTree';
import MemberItem from './MemberItem';
import {ContextNav, MembersWrapper} from './elements';
import {ErrorMessage} from './forms';
import {Flex, Box} from '@rebass/grid';
import {MemberForm} from './forms';
import {RootButton} from './buttons';
import {EntityMetaScope} from 'src/libs/Enums';
import DropdownList from 'components/basic/forms/dropdowns/DropdownList';
import TextInput from 'components/basic/forms/input/TextInput';
import InfoBox from 'src/libs/react/components/InfoBox';
import {H4, HelpText} from 'components/basic/text';
import memoize from 'lodash.memoize';

import uuid from 'uuid/v4';
import PropTypes from 'prop-types';

const validateMemberName = value => {
    return !value && 'Member name must not be empty.';
};

const validateAttributeName = value => {
    return !value && 'Attribute name must not be empty.';
};

const AttributeHelperText = () => (
    <Box width={1 / 2} ml={1}>
        <Flex alignItems='center' justifyContent='center'>
            <InfoBox>
                <p>Attributes can have multiple levels.</p>
                <p>
                    For example, you can have a <strong>Sector</strong> attribute where{' '}
                    <strong>Information Technology</strong> is an item.
                </p>
                <p>
                    <strong>Information Technology</strong> can have <strong>Industry</strong>{' '}
                    sub-items like <strong>Software & Services</strong> and{' '}
                    <strong>Semiconductors</strong>.
                </p>
            </InfoBox>
        </Flex>
    </Box>
);

const scopes = [
    {label: 'All', value: null},
    {label: 'Fund', value: EntityMetaScope.Fund},
    {label: 'Portfolio', value: EntityMetaScope.Portfolio},
    {label: 'Company', value: EntityMetaScope.Company},
    {label: 'Cash Flow', value: EntityMetaScope.CashFlow},
    {label: 'Deal', value: EntityMetaScope.Deal},
];

function AttributeEditor({
    onUpdateMember,
    onUpdateAttribute,
    onDeleteMember,
    onAddMember,
    attribute,
    members,
    levelLimit = 3,
}) {
    const [activeParent, setActiveParent] = useState(null);
    // Need to update this so that the "Done" button is disabled if there are any errors.
    const [attribName, setAttribName] = useState(attribute.name || '');
    const [currentLevel, setCurrentLevel] = useState(1);
    const [doScroll, setDoScroll] = useState(false);
    const [errors, setErrors] = useState({members: {}});
    const [tree, setTree] = useState(new AttributeTree(members));
    const [levelNames, setLevelNames] = useState(tree.getChildren(null).map(m => m.name));
    const [memberChanges, setMemberChanges] = useState({});
    const [newMemberName, setNewMemberName] = useState('');
    const [scope, setScope] = useState(attribute.scope || null);

    const bottomHolder = useRef();

    const navigateUp = useCallback(() => {
        const member = activeParent && tree.getMember(activeParent);
        setActiveParent(member.parentUid || null);
        setCurrentLevel(currentLevel - 1);
    }, [activeParent, currentLevel, tree]);

    const memberIsLocked = useCallback(
        memberUid => {
            return (
                (Object.keys(errors.members).length > 0 || Object.keys(memberChanges).length > 0) &&
                !Object.keys(errors.members).includes(memberUid) &&
                !Object.keys(memberChanges).includes(memberUid)
            );
        },
        [errors.members, memberChanges],
    );

    const removeMemberError = useCallback(
        memberUid => {
            const members = {...errors.members};
            delete members[memberUid];
            setErrors({...errors, members});
        },
        [errors],
    );

    const setMemberError = useCallback(
        (memberUid, error) => {
            const memberErrors = errors.members;
            setErrors({
                ...errors,
                members: {
                    ...memberErrors,
                    [memberUid]: error,
                },
            });
        },
        [errors],
    );

    const updateNewMemberName = useCallback(
        e => {
            const {value} = e.target;
            if (!!errors.newMemberName && value !== '') {
                const {newMemberName: _, ...rest} = errors;
                setErrors(rest);
            }
            setNewMemberName(value);
        },
        [errors],
    );

    const updateAttributeName = useCallback(
        e => {
            const name = e.target.value;
            if (!!errors.attribName && name !== '') {
                const {attribName: _, ...rest} = errors;
                setErrors(rest);
            }
            setAttribName(name);
        },
        [errors],
    );

    const removeChild = useCallback(
        uid => {
            const member = tree.getMember(uid);

            tree.dropNode(member.uid);
            setTree(tree.clone());
            const affected_uids = gatherSubtreeIds(tree, member.uid);
            onDeleteMember(member.uid, affected_uids);
        },
        [onDeleteMember, tree],
    );

    const setContext = useCallback(
        uid => {
            setActiveParent(uid);
            setNewMemberName('');
            setMemberChanges({});
            const {newMemberName: _, ...rest} = errors;
            setErrors(rest);
        },
        [errors],
    );

    useEffect(() => {
        const names = tree.getChildren(activeParent).map(c => c.name.toLowerCase());
        setLevelNames(names);
    }, [activeParent, tree]);

    useEffect(() => {
        if (doScroll) {
            bottomHolder.current.scrollIntoView({behavior: 'smooth', block: 'start'});
            setDoScroll(false);
        }
    }, [doScroll]);

    const addNewMember = useCallback(() => {
        if (newMemberName === undefined || newMemberName === '') {
            setErrors({...errors, newMemberName: 'Member name must not be empty.'});
            return;
        } else if (levelNames.includes(newMemberName.toLowerCase())) {
            setErrors({
                ...errors,
                newMemberName: 'Member name already exists on this level.',
            });
            return;
        }
        const uid = uuid();
        const member = {
            uid,
            parent_uid: activeParent,
            name: newMemberName,
        };

        const newMembers = [...tree.members, member];
        setTree(new AttributeTree(newMembers));
        onAddMember(member);
        setErrors({...errors, newMemberName: undefined});
        setNewMemberName('');
        setDoScroll(true);
    }, [activeParent, errors, levelNames, newMemberName, onAddMember, tree.members]);

    const subMembers = tree.getChildren(activeParent);
    const context = activeParent && tree.getMember(activeParent);
    const parent = context && tree.getMember(context.parent_uid);
    const onChangeMember = useCallback(
        memoize(memberUid => e => {
            const value = e.target.value;
            const member = tree.getMember(memberUid);
            if (value === member.name) {
                const {[memberUid]: _, ...rest} = memberChanges;
                setMemberChanges(rest);
            } else {
                setMemberChanges({...memberChanges, [memberUid]: e.target.value});
            }

            if (value !== '') {
                removeMemberError(memberUid);
            }
        }),
        [memberChanges, removeMemberError, tree],
    );

    const onChangeSave = useCallback(
        memoize(memberUid => () => {
            const member = tree.getMember(memberUid);
            const newValue = memberChanges[member.uid];
            const validation = validateMemberName(newValue);

            if (validation) {
                setMemberError({});
            }

            if (newValue === '') {
                setMemberError(member.uid, 'Member name must not be empty.');
            } else {
                member.name = newValue;
                onUpdateMember(member.uid, 'name', newValue);
                const {[member.uid]: _, ...rest} = memberChanges;
                setTree(tree.clone());
                setMemberChanges(rest);
            }
        }),
        [memberChanges, onUpdateMember, setMemberError, tree],
    );

    const onChangeCancel = useCallback(
        memoize(memberUid => () => {
            const {[memberUid]: _, ...rest} = memberChanges;
            setMemberChanges(rest);
            removeMemberError(memberUid);
        }),
        [memberChanges],
    );

    const saveAttributeName = useCallback(() => {
        const validation = validateAttributeName(attribName);
        if (validation) {
            setErrors({...errors, attribName: 'Attribute name must not be empty.'});
        }
        onUpdateAttribute('name', attribName);
    }, [attribName, errors, onUpdateAttribute]);

    const saveNewMemberName = useCallback(() => {
        if (newMemberName === '') {
            const {newMemberName: _, ...rest} = errors;
            setErrors(rest);
            setNewMemberName('');
        } else {
            const validation = validateMemberName(newMemberName);
            if (validation) {
                setErrors({...errors, newMemberName: validation});
            }
        }
    }, [errors, newMemberName]);

    return (
        <div>
            <Flex mb={2}>
                <Box width={1 / 2} mr={1}>
                    <H4>Name</H4>
                    <HelpText>Create a name for your attribute item list.</HelpText>
                    <TextInput
                        style={{width: '100%'}}
                        value={attribName}
                        onChange={updateAttributeName}
                        onBlur={saveAttributeName}
                    />
                    <ErrorMessage message={errors.attribName} />
                </Box>
                <Box width={1 / 2} ml={1}>
                    <H4>Scope</H4>
                    <HelpText>Choose the entity type that the attribute applies to.</HelpText>
                    <DropdownList
                        options={scopes}
                        keyKey='value'
                        valueKey='value'
                        labelKey='label'
                        manualValue={(scopes.find(s => s.value === scope) || {}).label}
                        onValueChanged={value => {
                            const scope = parseInt(value);
                            setScope(scope);
                            onUpdateAttribute('scope', scope);
                        }}
                    />
                </Box>
            </Flex>
            <Flex>
                <Box width={1 / 2} mr={1}>
                    <H4>Attribute Items</H4>
                    <Flex flexDirection='column'>
                        {context && (
                            <div>
                                <RootButton
                                    onClick={() => {
                                        setContext(null);
                                        setCurrentLevel(1);
                                    }}
                                />
                                <ContextNav
                                    parent={parent}
                                    context={context}
                                    onNavigateUp={navigateUp}
                                />
                            </div>
                        )}
                        <Flex flexDirection='column' ml={context ? '20px' : 0}>
                            <MemberForm
                                mt={0}
                                onSubmit={addNewMember}
                                onChange={updateNewMemberName}
                                onBlur={saveNewMemberName}
                                value={newMemberName}
                                error={errors.newMemberName}
                            />
                            <MembersWrapper>
                                {subMembers.map(m => {
                                    const childCount = (tree.getChildren(m.uid) || []).length;
                                    return (
                                        <MemberItem
                                            key={m.uid}
                                            member={m}
                                            updatedName={memberChanges[m.uid]}
                                            addChild={() => {
                                                setContext(m.uid);
                                                setCurrentLevel(currentLevel + 1); // This will need to be handled differently
                                            }}
                                            onRemove={() => removeChild(m.uid)}
                                            onChange={onChangeMember(m.uid)}
                                            childCount={childCount}
                                            onSave={onChangeSave(m.uid)}
                                            onCancel={onChangeCancel(m.uid)}
                                            showOptions={currentLevel < levelLimit}
                                            error={errors.members[m.uid]}
                                            locked={memberIsLocked(m.uid)}
                                        />
                                    );
                                })}
                                <div ref={bottomHolder}></div>
                            </MembersWrapper>
                        </Flex>
                    </Flex>
                </Box>
                <AttributeHelperText />
            </Flex>
        </div>
    );
}

AttributeEditor.propTypes = {
    onUpdateMember: PropTypes.func.isRequired,
    onUpdateAttribute: PropTypes.func.isRequired,
    onDeleteMember: PropTypes.func.isRequired,
    onAddMember: PropTypes.func.isRequired,
    attribute: PropTypes.shape({
        name: PropTypes.string,
        uid: PropTypes.string,
        scope: PropTypes.number,
    }),
    members: PropTypes.arrayOf(
        PropTypes.shape({
            uid: PropTypes.string.isRequired,
            name: PropTypes.string.isRequired,
            parent_uid: PropTypes.string,
        }),
    ),
    levelLimit: PropTypes.number,
};

export default AttributeEditor;
