import React from 'react';

import AttributeTree from 'bison/utils/AttributeTree';
import {Box, Flex} from '@rebass/grid';
import {Link} from 'components/basic/text';
import styled from 'styled-components';
import Dropdown from 'components/basic/forms/dropdowns/Dropdown';

const Wrapper = styled(Flex)`
    white-space: no-wrap;
`;

const DropdownBorder = styled.div`
    background-color: ${({theme}) => theme.textBlock.sectionBorder};
    max-width: 450px;

    border: 1px solid ${({theme}) => theme.textBlock.sectionBorder};
    border-radius: 3px;
    box-shadow: 2px 2px 3px rgba(0, 0, 0, 0.2);

    color: ${({theme}) => theme.textBlock.bg};
    font-size: 14px;

    &.fade-appear {
        opacity: 0;
    }

    &.fade-appear-active {
        opacity: 1;
        transition: opacity 100ms ease-in-out;
    }
`;

const DropdownContent = styled.div`
    background-color: ${({theme}) => theme.textBlock.bg};
    color: ${({theme}) => theme.textBlock.fg};
`;

const Row = styled(Box)`
    padding: 15px;
    height: 50px;
    min-width: 250px;
    display: flex;
    justify-content: center;
    font-size: 12px;

    flex-direction: column;
    &:nth-child(odd) {
        background-color: ${({theme}) => theme.memberLabelBoxTooltip.oddBg};
    }
    &:nth-child(even) {
        background-color: ${({theme}) => theme.memberLabelBoxTooltip.evenBg};
    }
`;

const InlineDropdown = styled(Dropdown)`
    margin-left: 2px;
    display: inline-block;
    cursor: pointer;
`;

const MemberName = styled.span`
    color: #ffffff;
`;

const attributeMemberTooltip = (parent, children) => {
    if (children.length > 0) {
        return (
            <Row key={parent.uid}>
                <Box pb={2}>
                    <strong>{parent.name}:</strong>
                </Box>
                <Box ml={2}>
                    {children.map((child, idx) => {
                        const prefix = idx !== 0 ? ', ' : '';
                        return <span key={child.uid}>{prefix + child.name}</span>;
                    })}
                </Box>
            </Row>
        );
    }
    return (
        <Row key={parent.uid}>
            <Box>
                <strong>{parent.name}</strong>
            </Box>
        </Row>
    );
};

const _parentMembers = (values, tree, parentLevel) => {
    const parents = {};
    for (const memberUid of values) {
        const parentUid = tree.getLineageIds(memberUid)[parentLevel];
        const childrenUids = parents[parentUid] || [];
        if (memberUid !== parentUid) {
            childrenUids.push(memberUid);
        }
        parents[parentUid] = childrenUids;
    }
    return parents;
};

function handleAttributeMemberTooltip(member_name, childrenUids, tree) {
    const parents = _parentMembers(childrenUids, tree, 1);
    const content = (
        <DropdownBorder>
            <Box ml={2}>
                <MemberName>{member_name}</MemberName>
            </Box>
            <DropdownContent>
                {Object.entries(parents).map(([parentUid, innerChildrenUids]) => {
                    const parent = tree.getMember(parentUid);
                    const children = innerChildrenUids.map(childUid => tree.getMember(childUid));
                    return attributeMemberTooltip(parent, children);
                })}
            </DropdownContent>
        </DropdownBorder>
    );
    return (
        <InlineDropdown content={content}>
            <Link>({childrenUids.length}+)</Link>
        </InlineDropdown>
    );
}

export default function MemberLabelBox({attribute, values}) {
    const tree = new AttributeTree(attribute.members);
    const parents = _parentMembers(values, tree, 0);
    return (
        <Wrapper>
            {Object.entries(parents).map(([parentUid, childrenUids], idx) => {
                const parent = tree.getMember(parentUid);
                const prefix = idx !== 0 ? ', ' : '';
                return (
                    <span key={parentUid}>
                        {prefix + parent.name}
                        {childrenUids.length > 0 &&
                            handleAttributeMemberTooltip(parent.name, childrenUids, tree)}
                    </span>
                );
            })}
        </Wrapper>
    );
}
