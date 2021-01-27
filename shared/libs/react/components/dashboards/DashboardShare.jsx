import React from 'react';
import styled from 'styled-components';

import Modal from 'containers/ModalContainer';

import ShareTable from 'components/basic/ShareTable';

import {Flex, Box} from '@rebass/grid';

import Checkbox from 'components/basic/forms/Checkbox';
import DropdownList from 'components/basic/forms/dropdowns/DropdownList';
import FilterableDropdownList from 'components/basic/forms/dropdowns/FilterableDropdownList';
import Button from 'components/basic/forms/Button';
import {H1, H2} from 'components/basic/text';

const Settings = styled.div`
    background-color: #ffffff;
    width: 1024px;
    padding: 12px;
    overflow: scroll;
`;

const NameLabel = styled.span`
    font-weight: 600;
`;

class DashboardShare extends React.Component {
    constructor(params) {
        super(params);
        this.state = {
            permission: 'read',
            shareWithTeam: false,
            shareWithEmail: null,
        };
    }

    resetState() {
        this.setState({
            permission: 'read',
            shareToClient: false,
            shareWithEmail: null,
        });
    }

    handleSubmitShare = toggleModal => () => {
        const {onShare} = this.props;
        onShare(this.state);
        this.resetState();
        toggleModal();
    };

    handleMailChanged = email => {
        this.setState({
            shareWithEmail: email,
        });
    };

    handleShareWithTeam = value => {
        this.setState({
            shareWithTeam: value,
        });
    };

    handlePermissionChanged = value => {
        this.setState({
            permission: value,
        });
    };

    renderCurrentShares = shares => {
        const {onDeleteShare} = this.props;
        return <ShareTable rows={shares} onDeleteShare={onDeleteShare} />;
    };

    renderModalContent = toggleModal => {
        const {dashboard, shares, users} = this.props;
        const {permission, shareWithTeam, shareWithEmail} = this.state;

        const options = [
            {label: 'Read', value: 'read'},
            {label: 'Read & Write', value: 'write'},
            {label: 'Read, Write & Share', value: 'share'},
        ];

        const permissionLabel = (options.find(o => o.value === permission) || {}).label;

        return (
            <Settings>
                <Flex mb={20}>
                    <Box>
                        <H1>
                            Shares for <NameLabel>{dashboard.name}</NameLabel>
                        </H1>
                    </Box>
                </Flex>
                <H2>Current shares</H2>
                <Flex mb={60}>{this.renderCurrentShares(shares)}</Flex>
                <H2>New share</H2>
                <Flex width={1} mb={10}>
                    <Box width={5 / 12} mr={20}>
                        <FilterableDropdownList
                            label='Email'
                            options={users.map(user => ({
                                key: user.uid,
                                value: user.email,
                                label: user.email,
                            }))}
                            onValueChanged={this.handleMailChanged}
                            manualValue={shareWithEmail}
                        />
                    </Box>
                    <Box width={4 / 12} mr={20}>
                        <DropdownList
                            label='Permission'
                            manualValue={permissionLabel}
                            options={options}
                            onValueChanged={this.handlePermissionChanged.bind(this)}
                        />
                    </Box>
                    <Box width={3 / 12}>
                        <Checkbox
                            leftLabel='Share with team'
                            onValueChanged={this.handleShareWithTeam}
                            checked={shareWithTeam}
                        />
                    </Box>
                </Flex>
                <Flex mb={10}>
                    <Box width={0.7} />
                    <Box width={0.15} mr={2}>
                        <Button onClick={() => toggleModal()}>Cancel</Button>
                    </Box>
                    <Box width={0.15}>
                        <Button onClick={this.handleSubmitShare(toggleModal)} primary>
                            Share
                        </Button>
                    </Box>
                </Flex>
            </Settings>
        );
    };

    render() {
        return (
            <Modal
                render={({toggleModal}) => this.renderModalContent(toggleModal)}
                modalKey='share-dashboard'
            />
        );
    }
}

export default DashboardShare;
