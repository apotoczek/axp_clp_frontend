import React, {useState} from 'react';

import Modal, {ModalContent} from 'components/basic/Modal';
import {Box, Flex} from '@rebass/grid';
import styled from 'styled-components';

import Button from 'components/basic/forms/Button';
import FilterableDropdownList from 'components/basic/forms/dropdowns/FilterableDropdownList';
import AttributeModalForm from 'components/datamanager/company/AttributeModalForm';
import InfoBox from 'src/libs/react/components/InfoBox';

import {Link} from 'components/basic/text';
import Icon from 'components/basic/Icon';

import AttributeTree from 'bison/utils/AttributeTree';

const Footer = styled(Flex)`
    min-height: 100px;
    margin-top: 15px;
    margin-bottom: 8px;
`;

function AttributeInfoBox({redirectToAttributesPage}) {
    return (
        <Box width={1} ml={1}>
            <Flex alignItems='center' justifyContent='center'>
                <InfoBox>
                    <Flex flexDirection='row'>
                        <Box alignSelf='center' width={1 / 3} mr={2}>
                            <Link onClick={redirectToAttributesPage}>
                                New Global Attribute <Icon name='plus' glyphiconp />
                            </Link>
                        </Box>
                        <Box width={2 / 3}>
                            Clicking here will allow you to create a new Global Attribute you can
                            use with all of your Investments across the platform.
                        </Box>
                    </Flex>
                </InfoBox>
            </Flex>
        </Box>
    );
}

export default function EditAttributeModal({
    isOpen,
    toggleModal,
    attributes,
    company,
    selectedAttribute,
    handleSave,
    redirectToAttributesPage,
}) {
    const memberUids = company.attributes[selectedAttribute];
    const initState = {};

    if (memberUids) {
        const attribute = attributes[selectedAttribute];
        const tree = new AttributeTree(attribute.members);
        for (const memberUid of memberUids) {
            const lineage = tree.getLineage(memberUid);
            for (const member of lineage) {
                const parentUid = member.parent_uid || 'root';
                const children = initState[parentUid] || [];
                if (!children.includes(member.uid)) {
                    children.push(member.uid);
                    initState[parentUid] = children;
                }
            }
        }
    }
    const [selectedMembers, setSelectedMembers] = useState(initState);

    const _getMemberLeafs = (members, res) => {
        for (const member of members) {
            if (selectedMembers[member]?.length > 0) {
                res = _getMemberLeafs(selectedMembers[member], res);
            } else {
                res.push(member);
            }
        }
        return res;
    };

    const _handleSave = () => {
        const leafs = _getMemberLeafs(selectedMembers['root'], []);
        handleSave(leafs)();
    };

    return (
        <Modal isOpen={isOpen} openStateChanged={toggleModal}>
            <ModalContent flexDirection='column' style={{width: '600px'}}>
                <Box width={2 / 3}>Edit Attribute</Box>
                <Box py={2}>
                    <FilterableDropdownList
                        label='Attribute'
                        options={[attributes[selectedAttribute]]}
                        value={selectedAttribute}
                        valueKey='uid'
                        labelKey='name'
                        onValueChanged={() => {}}
                        disabled
                    />
                </Box>
                <AttributeModalForm
                    attributes={attributes}
                    selectedAttribute={selectedAttribute}
                    selectedMembers={selectedMembers}
                    setSelectedMembers={setSelectedMembers}
                />
                <Footer flexDirection='column'>
                    <Flex justifyContent='flex-end'>
                        <Button
                            mr={1}
                            onClick={() => {
                                toggleModal();
                                setSelectedMembers({});
                            }}
                        >
                            Cancel
                        </Button>
                        <Button primary onClick={_handleSave}>
                            Save
                        </Button>
                    </Flex>
                    <AttributeInfoBox redirectToAttributesPage={redirectToAttributesPage} />
                </Footer>
            </ModalContent>
        </Modal>
    );
}
