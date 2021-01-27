import React from 'react';
import PropTypes from 'prop-types';
import {Flex, Box} from '@rebass/grid';
import styled from 'styled-components';

import auth from 'auth';

import {getAppOTPs, approveAppOTP, denyAppOTP} from 'api';

import DataTable from 'components/basic/DataTable';
import {H3} from 'components/basic/text';
import Button from 'components/basic/forms/Button';

const ActionButton = styled(Button)`
    padding-top: 2px;
    padding-bottom: 2px;
`;

function actionCellRenderer({rowData}) {
    if (rowData.denied) {
        return null;
    }

    if (rowData.approved) {
        return rowData.confirm_code;
    }

    return (
        <Flex>
            <Box flex={1} p={1}>
                <ActionButton primary onClick={() => this.approve(rowData)}>
                    Approve
                </ActionButton>
            </Box>
            <Box flex={1} p={1}>
                <ActionButton danger onClick={() => this.deny(rowData)}>
                    Deny
                </ActionButton>
            </Box>
        </Flex>
    );
}

export default class AppOneTimePasswords extends React.Component {
    static propTypes = {
        pluginType: PropTypes.number.isRequired,
    };

    state = {
        otps: [],
        showAppOTPs: false,
    };

    async componentDidMount() {
        let otps = (await getAppOTPs()).filter(otp => otp.plugin_type === this.props.pluginType);
        otps.sort((a, b) => a.modified - b.modified);

        const showAppOTPs = auth.user().permissions.indexOf('login_with_sso') !== -1;

        this.setState({
            otps,
            showAppOTPs,
        });
    }

    updateOTP(otp) {
        let ix = this.state.otps.findIndex(x => x.otp === otp.otp);
        this.setState(state => {
            const otps = state.otps.slice();
            otps.splice(ix, 1, otp);
            return {...state, otps};
        });
    }

    async approve(_otp) {
        const otp = {..._otp, approved: true};
        await this.updateOTP(otp);

        await approveAppOTP(otp);
    }

    async deny(_otp) {
        const otp = {..._otp, denied: true};
        await this.updateOTP(otp);

        await denyAppOTP(otp);
    }

    render() {
        if (!this.state.showAppOTPs) {
            return null;
        }

        let otpRows = this.state.otps.map(otp => {
            return {
                ...otp,
                status: otp.approved
                    ? 'Approved, enter the confirmation code into the plugin'
                    : otp.denied
                    ? 'Denied'
                    : 'Pending',
            };
        });

        return (
            <Box p={4}>
                <Flex p={4}>
                    <Flex flex={4} flexDirection='column'>
                        <H3>Approve App Login</H3>
                        <DataTable
                            pushHeight
                            enableHeaderRow={false}
                            enableColumnToggle={false}
                            defaultSortBy={['modified']}
                            defaultSortDirection={{modified: 'DESC'}}
                            noRowsRenderer={() => '-- No pending app login requests --'}
                            columns={[
                                {
                                    key: 'modified',
                                    format: 'backend_datetime',
                                    width: 150,
                                    minWidth: 150,
                                },
                                {
                                    key: 'status',
                                    width: 475,
                                    minWidth: 475,
                                },
                                {
                                    key: 'action',
                                    cellRenderer: actionCellRenderer.bind(this),
                                },
                            ]}
                            rows={otpRows}
                        />
                    </Flex>
                </Flex>
            </Box>
        );
    }
}
