import React, {useState} from 'react';

import Modal, {ModalContent, ModalHeader} from 'components/basic/Modal';
import {Box, Flex} from '@rebass/grid';
import styled from 'styled-components';

import Button from 'components/basic/forms/Button';
import FilterableDropdownList from 'components/basic/forms/dropdowns/FilterableDropdownList';
import AttributeModalForm from 'components/datamanager/company/AttributeModalForm';
import InfoBox from 'src/libs/react/components/InfoBox';

import {Link} from 'components/basic/text';

import Icon from 'components/basic/Icon';

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

export default function AddAttributeModal({
    isOpen,
    toggleModal,
    attributes,
    scope,
    selectedAttribute,
    setSelectedAttribute,
    handleSave,
    redirectToAttributesPage,
}) {
    const [selectedMembers, setSelectedMembers] = useState({});

    const _getMemberLeafs = (members, res) => {
        for (const member of members) {
            if (selectedMembers[member]?.length > 0) {
                _getMemberLeafs(selectedMembers[member], res);
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

    const disableSave = Object.keys(selectedMembers).length === 0;

    return (
        <Modal isOpen={isOpen} openStateChanged={toggleModal}>
            <ModalContent flexDirection='column' style={{width: '600px'}}>
                <ModalHeader width={1} pb={2} mb={3}>
                    <Box width={2 / 3}>Add Attribute</Box>
                </ModalHeader>
                <Box p={1}>
                    <FilterableDropdownList
                        label='Attribute'
                        options={Object.values(attributes).filter(
                            attribute =>
                                attribute.members.length > 0 &&
                                (attribute.scope === scope || attribute.scope === null),
                        )}
                        value={selectedAttribute}
                        valueKey='uid'
                        labelKey='name'
                        onValueChanged={value => {
                            setSelectedAttribute(value);
                            setSelectedMembers({});
                        }}
                    />
                </Box>
                {selectedAttribute ? (
                    <AttributeModalForm
                        attributes={attributes}
                        selectedAttribute={selectedAttribute}
                        selectedMembers={selectedMembers}
                        setSelectedMembers={setSelectedMembers}
                    />
                ) : null}
                <Footer flexDirection='column' justifyContent='flex-end'>
                    <Flex justifyContent='flex-end'>
                        <Button
                            flex={0}
                            mr={1}
                            onClick={() => {
                                toggleModal();
                                setSelectedAttribute(null);
                                setSelectedMembers({});
                            }}
                        >
                            Cancel
                        </Button>
                        <Button flex={0} primary onClick={_handleSave} disabled={disableSave}>
                            Save
                        </Button>
                    </Flex>
                    <AttributeInfoBox redirectToAttributesPage={redirectToAttributesPage} />
                </Footer>
            </ModalContent>
        </Modal>
    );
}
