import React from 'react';
import {Flex} from '@rebass/grid';
import {Input} from './inputs';
import {RemoveButton, Link} from './buttons';
import {ErrorMessage} from './forms';
import ConfirmDropdown from 'src/libs/react/components/basic/forms/dropdowns/ConfirmDropdown';

import PropTypes from 'prop-types';

import styled from 'styled-components';

const EditForm = styled(Flex)`
    border: 1px solid #e5e5e5;
    align-items: center;
    justify-content: center;
    &:hover {
        border: 1px solid #cccccc;
    }
    &:focus-within {
        border: 1px solid #cccccc;
    }
`;

const Weighted = styled.span`
    font-weight: 400;
`;
const MemberItem = ({
    member,
    updatedName,
    addChild,
    childCount,
    onRemove,
    onChange,
    onSave,
    onCancel,
    showOptions,
    error,
    locked,
}) => {
    const childText = childCount ? `sub items (${childCount})` : '+ sub item';

    const nameIsDirty = updatedName !== undefined;
    const name = nameIsDirty ? updatedName : member.name;
    const borderColor = error ? '#F11' : 'unset';
    const userSelect = locked ? 'none' : 'unset';

    return (
        <>
            <EditForm
                mt={1}
                style={{
                    border: `1px solid ${borderColor}`,
                    userSelect,
                    borderRadius: '3px',
                }}
                flexAlign='center'
                alignItems='center'
                flexGrow={1}
                position='relative'
            >
                <form
                    style={{display: 'flex', flexGrow: 1}}
                    onSubmit={e => {
                        e.stopPropagation();
                        e.preventDefault();
                        return onSave(e);
                    }}
                >
                    <Input
                        hasError={!!error}
                        style={{border: 'none'}}
                        value={name}
                        onChange={onChange}
                        disabled={locked}
                    />
                </form>
                <Flex
                    px='4px'
                    fontSize='12px'
                    alignItems='center'
                    justifyContent='flex-end'
                    width='80px'
                >
                    {nameIsDirty ? (
                        <div>
                            <Link onClick={onSave} style={{marginRight: '4px'}} color='#2cd67b'>
                                save
                            </Link>
                            <Link onClick={onCancel} color='#bbb'>
                                cancel
                            </Link>
                        </div>
                    ) : (
                        <Link style={{display: !showOptions && 'none'}} onClick={addChild}>
                            {childText}
                        </Link>
                    )}
                </Flex>
                <ConfirmDropdown
                    onConfirm={onRemove}
                    text={
                        childCount > 0 ? (
                            <span>
                                Delete <Weighted>{name}</Weighted> and its {childCount} sub-items?
                            </span>
                        ) : (
                            <span>
                                Delete <Weighted>{name}</Weighted>?
                            </span>
                        )
                    }
                    subText='This action cannot be undone.'
                >
                    <RemoveButton />
                </ConfirmDropdown>
            </EditForm>
            <ErrorMessage message={error} />
        </>
    );
};

MemberItem.propTypes = {
    addChild: PropTypes.func.isRequired,
    childCount: PropTypes.number.isRequired,
    error: PropTypes.string,
    locked: PropTypes.bool.isRequired,
    member: PropTypes.shape({
        uid: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        parent_uid: PropTypes.oneOfType([v => v === null, PropTypes.string]),
    }),
    onCancel: PropTypes.func.isRequired,
    onChange: PropTypes.func.isRequired,
    onRemove: PropTypes.func.isRequired,
    onSave: PropTypes.func.isRequired,
    showOptions: PropTypes.bool.isRequired,
    updatedName: PropTypes.string,
};

export default MemberItem;
