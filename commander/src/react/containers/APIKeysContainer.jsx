import React from 'react';
import styled from 'styled-components';
import {Box, Flex} from '@rebass/grid';

import Loader from 'components/basic/Loader';
import * as api from 'api';

import Modal, {ModalContent} from 'components/basic/Modal';
import {H1, Italic} from 'components/basic/text';
import Button from 'components/basic/forms/Button';
import CPanel, {CPanelSection, CPanelSectionTitle} from 'components/basic/cpanel/base';
import CPanelInput from 'components/basic/cpanel/CPanelInput';
import DataTable from 'components/basic/DataTable';
import Icon from 'components/basic/Icon';
import List from 'components/basic/forms/dropdowns/List';
import TextInput from 'components/basic/forms/input/TextInput';

const Content = styled(Flex)`
    flex: 1 0 auto;
`;

const Page = styled(Flex)`
    height: 100%;
`;

function NewAPIKeyModal({options, onCreateAPIKey, isOpen, toggleModal, filter, onFilterChanged}) {
    return (
        <Modal isOpen={isOpen} openStateChanged={toggleModal}>
            <ModalContent alignItems='center' flexDirection='column'>
                <Box width={600}>
                    <H1>Generate new api key</H1>
                    <Italic>
                        Generate an api key by clicking a row in the list. Use the text field to
                        search for a user.
                    </Italic>
                    <TextInput
                        my={2}
                        placeholder='Search by name or email'
                        value={filter}
                        onValueChanged={onFilterChanged}
                    />
                    <List
                        keyKey='uid'
                        labelKey='name'
                        subLabelKey='email'
                        valueKey='uid'
                        items={options}
                        onItemClick={value => onCreateAPIKey(value)}
                    />
                </Box>
            </ModalContent>
        </Modal>
    );
}

function Table({rows, onClickDelete}) {
    return (
        <DataTable
            rows={rows}
            columns={[
                {
                    key: 'user_name',
                    label: 'User name',
                },
                {
                    key: 'api_key_uid',
                    label: 'UID of the key entry (not the api key)',
                },
                {
                    key: 'api_key',
                    label: 'The actual api key',
                },
                {
                    key: 'api_key_uid',
                    label: 'Action',
                    width: 100,
                    cellRenderer: function DeleteCell({rowData}) {
                        return (
                            <Button danger onClick={() => onClickDelete(rowData.api_key_uid)}>
                                <Flex justifyContent='space-between'>
                                    <Box>Delete</Box>
                                    <Icon glyphicon name='trash' />
                                </Flex>
                            </Button>
                        );
                    },
                },
            ]}
        />
    );
}

export default class APIKeys extends React.Component {
    state = {
        loading: true,
        apiKeys: [],
        searchString: '',
        createNewModalOpen: false,
        users: [],
        filter: '',
    };

    componentDidMount() {
        this.fetchAPIKeys();
        this.fetchUsers();
    }

    fetchAPIKeys() {
        this.setState({loading: true});
        api.callEndpoint('/cobalt-api/list_api_keys', {
            filters: {
                string_filter: this.state.filter,
            },
        })
            .then(response => {
                this.setState({
                    apiKeys: response.entries || [],
                    loading: false,
                });
            })
            .catch(() => {
                this.setState({
                    apiKeys: [],
                    loading: false,
                });
            })
            .expired.then(() => this.fetchAPIKeys());
    }

    fetchUsers() {
        api.callEndpoint('/commander/list_users', {
            results_per_page: 10,
            order_by: [{name: 'last_name'}],
            filters: {
                string_filter: this.state.filter,
                show_disabled: false,
            },
        })
            .then(response => {
                this.setState({
                    users: response.results || [],
                });
            })
            .catch(() => {
                this.setState({user: []});
            })
            .expired.then(() => this.fetchUsers());
    }

    handleSearchStringChanged(event) {
        this.setState({searchString: event.target.value});
    }

    handleDeleteKey(uid) {
        api.callActionEndpoint('/cobalt-api/delete_api_key', {uid}).then(() =>
            api.dataThing.statusCheck(),
        );
    }

    handleCreateKey(userUid) {
        api.callActionEndpoint('/cobalt-api/create_api_key', {user: userUid}).then(() => {
            this.toggleModal();
            api.dataThing.statusCheck();
        });
    }

    handleFilterChanged(value) {
        this.setState({filter: value});
        this.fetchUsers();
    }

    filteredKeys() {
        const {searchString, apiKeys} = this.state;
        if (!searchString) {
            return apiKeys;
        }
        const search = searchString.toLowerCase();
        return apiKeys.filter(key => key.user_name.toLowerCase().includes(search));
    }

    toggleModal() {
        this.setState(state => ({createNewModalOpen: !state.createNewModalOpen}));
    }

    render() {
        return (
            <Page>
                <CPanel width={230}>
                    <CPanelSection>
                        <CPanelSectionTitle>Search</CPanelSectionTitle>
                        <CPanelInput
                            placeholder='Search'
                            onChange={event => this.handleSearchStringChanged(event)}
                        />
                    </CPanelSection>
                </CPanel>
                <Content flexDirection='column'>
                    <Flex p={2}>
                        <Box flex={1}>
                            <H1>API Keys</H1>
                        </Box>
                        <Button onClick={() => this.toggleModal()} mr={2} primary>
                            <Icon name='plus' left />
                            New API Key
                        </Button>
                    </Flex>
                    {this.state.loading ? (
                        <Loader />
                    ) : (
                        <Table
                            rows={this.filteredKeys()}
                            onClickDelete={this.handleDeleteKey.bind(this)}
                        />
                    )}
                </Content>
                <NewAPIKeyModal
                    onCreateAPIKey={userUid => this.handleCreateKey(userUid)}
                    isOpen={this.state.createNewModalOpen}
                    toggleModal={() => this.toggleModal()}
                    options={this.state.users}
                    filter={this.state.filter}
                    onFilterChanged={value => this.handleFilterChanged(value)}
                />
            </Page>
        );
    }
}
