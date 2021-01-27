import React, {useRef} from 'react';

import {Box, Flex} from '@rebass/grid';
import styled, {css} from 'styled-components';

import AttributeTree from 'bison/utils/AttributeTree';

import FilterableChecklistDropdown from 'components/basic/forms/dropdowns/FilterableChecklistDropdown';

import Icon from 'components/basic/Icon';

import {Link} from 'components/basic/text';

const AttributeMemberBoxWrapper = css`
    flex: 1;
    margin: 5px;
    padding: 5px;
`;

const FirstMemberBox = styled(Flex)`
    ${AttributeMemberBoxWrapper}
    background: ${({theme}) => theme.attributeModalForm.firstBoxBg};
`;

const SecondMemberBox = styled(Flex)`
    ${AttributeMemberBoxWrapper}
    background: ${({theme}) => theme.attributeModalForm.secondBoxBg};
`;

const ThirdMemberBox = styled(Flex)`
    ${AttributeMemberBoxWrapper}
    border: 1px solid;
    border-left: 3px solid;
    border-color: ${({theme}) => theme.attributeModalForm.secondBoxBg};
    border-left-color: ${({theme}) => theme.attributeModalForm.firstBoxBg};
`;

const FourthMemberBox = styled(Flex)`
    ${AttributeMemberBoxWrapper}
    border: 1px solid;
    border-left: 3px solid;
    border-color: ${({theme}) => theme.attributeModalForm.secondBoxBg};
`;

const DefaultMemberBox = styled(Flex)`
    ${AttributeMemberBoxWrapper}
`;

const NoSelectedValueBox = styled.div`
    height: 200px;
    background: ${({theme}) => theme.attributeModalForm.noSelectedValuesBg};
    display: flex;
    justify-content: center;
    align-items: center;
    color: ${({theme}) => theme.attributeModalForm.noSelectedValuesText};
`;

const NoSelectedValueText = styled.span`
    vertical-align: middle;
`;

const RemoveIconBox = styled(Box)`
    border-left: 1px solid rgba(0, 0, 0, 0.2);
`;

const recursivlyRemoveNodes = (tree, memberUid, selectedMembers, setSelectedMembers) => {
    const memberChildren = tree.getChildrenIds(memberUid);
    for (const child of memberChildren) {
        const innerChildren = tree.getChildrenIds(child);
        if (innerChildren.length > 0) {
            recursivlyRemoveNodes(tree, child, selectedMembers, setSelectedMembers);
        }
        delete selectedMembers[child];
    }
    delete selectedMembers[memberUid];
    setSelectedMembers({...selectedMembers});
};

const MemberDropdown = ({selectedMembers, setSelectedMembers, memberChildren, memberUid, tree}) => {
    const selectedChildrenForMember = selectedMembers[memberUid] || [];
    return (
        <Box flex={1}>
            <FilterableChecklistDropdown
                options={memberChildren}
                values={selectedChildrenForMember}
                valueKey='uid'
                labelKey='name'
                onValueChanged={value => {
                    const index = selectedChildrenForMember.indexOf(value);
                    if (index > -1) {
                        selectedChildrenForMember.splice(index, 1);
                        recursivlyRemoveNodes(tree, value, selectedMembers, setSelectedMembers);
                        setSelectedMembers({
                            ...selectedMembers,
                            [memberUid]: [...selectedChildrenForMember],
                        });
                    } else {
                        setSelectedMembers({
                            ...selectedMembers,
                            [memberUid]: Array.from(new Set([...selectedChildrenForMember, value])),
                        });
                    }
                }}
            >
                <Flex justifyContent='flex-end'>
                    <Link>Set Sub Values</Link>
                    <Icon name='down-dir' buttonDark />
                </Flex>
            </FilterableChecklistDropdown>
        </Box>
    );
};

const layerMemberBoxes = [FirstMemberBox, SecondMemberBox, ThirdMemberBox, FourthMemberBox];

const AttributeMemberBox = ({
    layerDepth,
    selectedMembers,
    setSelectedMembers,
    name,
    uid,
    tree,
    selectedMember,
    index,
    memberChildren = [],
}) => {
    const members = selectedMembers[selectedMember];
    const MemberBox = layerMemberBoxes[layerDepth - 1] || DefaultMemberBox;
    return (
        <MemberBox>
            <Flex flex={1} justifyContent='space-between'>
                <span>{name}</span>
                {memberChildren.length > 0 ? (
                    <MemberDropdown
                        selectedMembers={selectedMembers}
                        setSelectedMembers={setSelectedMembers}
                        memberChildren={memberChildren}
                        memberUid={uid}
                        tree={tree}
                    />
                ) : null}
            </Flex>
            <RemoveIconBox>
                <Icon
                    name='remove'
                    glyphicon
                    buttonDark
                    right
                    onClick={() => {
                        members.splice(index, 1);
                        recursivlyRemoveNodes(tree, uid, selectedMembers, setSelectedMembers);
                    }}
                />
            </RemoveIconBox>
        </MemberBox>
    );
};

const RootMemberDropdown = ({attribute, tree, selectedMembers, setSelectedMembers, parentRef}) => {
    const options = attribute.members.filter(option => !option.parent_uid);
    const selectedRootMembers = selectedMembers['root'] || [];
    return (
        <Box>
            <FilterableChecklistDropdown
                options={options}
                values={selectedRootMembers}
                valueKey='uid'
                labelKey='name'
                onValueChanged={value => {
                    const index = selectedRootMembers.indexOf(value);
                    if (index > -1) {
                        selectedRootMembers.splice(index, 1);
                        recursivlyRemoveNodes(tree, value, selectedMembers, setSelectedMembers);
                        setSelectedMembers({...selectedMembers, root: [...selectedRootMembers]});
                    } else {
                        setSelectedMembers({
                            ...selectedMembers,
                            root: Array.from(new Set([...selectedRootMembers, value])),
                        });
                    }
                }}
                parentRef={parentRef}
            >
                <Flex flex={1}>
                    <Link>Set Attribute Values</Link>
                    <Icon name='down-dir' buttonDark />
                </Flex>
            </FilterableChecklistDropdown>
        </Box>
    );
};

const AttributeMemberLayer = ({members, parentId, selectedMembers, setSelectedMembers, tree}) => {
    return members.map((memberUid, index) => {
        const selectedMember = tree.getMember(memberUid);
        const memberChildren = tree.getChildren(memberUid);
        const layerDepth = tree.getLineageIds(memberUid).length;
        return (
            <Box key={memberUid}>
                <AttributeMemberBox
                    layerDepth={layerDepth}
                    selectedMembers={selectedMembers}
                    setSelectedMembers={setSelectedMembers}
                    name={selectedMember.name}
                    uid={memberUid}
                    tree={tree}
                    selectedMember={parentId}
                    index={index}
                    memberChildren={memberChildren}
                />
                {selectedMembers[memberUid]?.length > 0 ? (
                    <Box ml={3}>
                        <AttributeMemberLayer
                            members={selectedMembers[memberUid]}
                            parentId={memberUid}
                            selectedMembers={selectedMembers}
                            setSelectedMembers={setSelectedMembers}
                            tree={tree}
                        />
                    </Box>
                ) : null}
            </Box>
        );
    });
};

export default function AttributeModalForm({
    attributes,
    selectedAttribute,
    selectedMembers,
    setSelectedMembers,
}) {
    const attribute = attributes[selectedAttribute];
    const tree = new AttributeTree(attribute.members);
    const rootBoxRef = useRef();

    return (
        <div>
            {selectedAttribute ? (
                <>
                    <Flex mt={2} justifyContent='space-between' ref={rootBoxRef}>
                        <Box>Attribute Values</Box>
                        <RootMemberDropdown
                            attribute={attribute}
                            tree={tree}
                            selectedAttribute={selectedAttribute}
                            selectedMembers={selectedMembers}
                            setSelectedMembers={setSelectedMembers}
                            parentRef={rootBoxRef}
                        />
                    </Flex>
                    <hr />
                </>
            ) : null}
            <Box>
                {selectedMembers['root']?.length > 0 ? (
                    <AttributeMemberLayer
                        members={selectedMembers['root']}
                        parentId='root'
                        selectedMembers={selectedMembers}
                        setSelectedMembers={setSelectedMembers}
                        tree={tree}
                    />
                ) : (
                    <NoSelectedValueBox>
                        <NoSelectedValueText>No Attribute Values Selected</NoSelectedValueText>
                    </NoSelectedValueBox>
                )}
            </Box>
        </div>
    );
}
