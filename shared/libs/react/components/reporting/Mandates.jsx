import React from 'react';

import {Viewport} from 'components/layout';
import Breadcrumbs, {NonRouterLink} from 'components/Breadcrumbs';

import Toolbar, {ToolbarItem} from 'components/basic/Toolbar';

import {Box} from '@rebass/grid';

import DataTable from 'components/basic/DataTable';

import {is_set, getOptionLabel} from 'src/libs/Utils';
import {
    Heading,
    ListPage,
    EditingPage,
    TableSection,
    EditingSection,
} from 'components/reporting/shared';
import MandateForm from 'components/reporting/mandates/MandateForm';
import NotificationTableForm from 'components/reporting/mandates/NotificationTableForm';

class EditingView extends React.Component {
    constructor(props) {
        super(props);

        const {notifications, relUids, ...mandate} = props.mandate;

        const indexed = {};

        for (const notification of notifications || []) {
            indexed[notification.event_type] = {...notification};
        }

        this.state = {
            mandate,
            relUids,
            notifications: indexed,
            errors: {},
        };
    }

    handleValueChanged = (key, value) => {
        const {mandate} = this.state;

        this.setState({mandate: {...mandate, [key]: value}});
    };

    handleAddRelUid = uid => {
        const {relUids} = this.state;

        this.setState({relUids: [...relUids, uid]});
    };

    handleRemoveRelUid = uid => {
        const {relUids} = this.state;

        const newRelUids = [...relUids];

        newRelUids.splice(newRelUids.indexOf(uid), 1);

        this.setState({relUids: newRelUids});
    };

    handleNotificationChanged = notification => {
        const {notifications} = this.state;

        this.setState({notifications: {...notifications, [notification.event_type]: notification}});
    };

    handleSave = () => {
        const {onSave} = this.props;
        const {notifications, mandate, relUids, errors} = this.state;

        if (!is_set(mandate.name, true)) {
            this.setState({
                errors: {
                    ...errors,
                    name: 'Name is required',
                },
            });

            return;
        }

        onSave({
            ...mandate,
            relUids,
            notifications: Object.values(notifications),
        });
    };

    handleCancel = () => {
        const {onCancel} = this.props;

        onCancel();
    };

    render() {
        const {mandate, notifications, errors} = this.state;
        const {options, breadcrumbs, createNew, mandate: staticMandate} = this.props;

        const breadcrumbLeaf = createNew ? 'Create' : staticMandate.name;

        return (
            <Viewport>
                <Breadcrumbs
                    path={breadcrumbs.concat([breadcrumbLeaf])}
                    urls={['#!/reporting-relationships', '#!/reporting-mandates']}
                    linkComponent={NonRouterLink}
                />
                <Toolbar flex>
                    <ToolbarItem onClick={this.handleCancel} icon='cancel' glyphicon right>
                        Cancel
                    </ToolbarItem>
                    <ToolbarItem onClick={this.handleSave} icon='save' glyphicon right>
                        Save Request
                    </ToolbarItem>
                </Toolbar>
                <EditingPage>
                    <EditingSection
                        heading={createNew ? 'Create Recurring Request' : 'Edit Recurring Request'}
                        description='
                            A data request is the formal process by which you ask
                            your clients to submit their data.

                            Recurring requests enable you to automatically request data
                            every period, removing the need for manual data requests.
                        '
                    >
                        <Box flex={1}>
                            <MandateForm
                                values={mandate}
                                errors={errors}
                                onValueChanged={this.handleValueChanged}
                                options={options}
                            />
                            <Box px={1} pt={4} pb={5}>
                                <Heading label='Internal Notification Settings'>
                                    Use the table below to set up whom on your team should receive
                                    emails when the relevant actions occur.
                                </Heading>
                                <Box px={1}>
                                    <NotificationTableForm
                                        onNotificationChanged={this.handleNotificationChanged}
                                        notifications={Object.entries(notifications).map(
                                            ([_, notification]) => notification,
                                        )}
                                        users={options.users}
                                    />
                                </Box>
                            </Box>
                        </Box>
                    </EditingSection>
                </EditingPage>
            </Viewport>
        );
    }
}

const ListView = ({mandates, options, onNewMandate, onItemClick, breadcrumbs}) => {
    return (
        <Viewport>
            <Breadcrumbs
                path={breadcrumbs}
                urls={['#!/reporting-relationships']}
                linkComponent={NonRouterLink}
            />
            <Toolbar flex>
                <ToolbarItem icon='plus' glyphicon right onClick={onNewMandate}>
                    Create New Recurring Request
                </ToolbarItem>
            </Toolbar>
            <ListPage>
                <TableSection heading='Recurring Data Requests'>
                    <DataTable
                        rowKey='uid'
                        enableRowClick
                        onRowClick={onItemClick}
                        rows={mandates}
                        isLoading={false}
                        columns={[
                            {
                                label: 'Name',
                                key: 'name',
                            },
                            {
                                label: 'Frequency',
                                key: 'frequency',
                                formatter: ({cellData}) =>
                                    getOptionLabel(options.frequencies, cellData),
                            },
                            {
                                label: 'Template',
                                key: 'templateUid',
                                formatter: ({cellData}) =>
                                    getOptionLabel(options.templates, cellData, 'uid', 'name'),
                            },
                            {
                                label: 'Email Sequence',
                                key: 'emailSequenceUid',
                                formatter: ({cellData}) =>
                                    getOptionLabel(options.emailSequences, cellData, 'uid', 'name'),
                            },
                            {
                                label: 'Created On',
                                key: 'created',
                                format: 'backend_date',
                            },
                            {
                                label: 'Last Updated',
                                key: 'modified',
                                format: 'backend_date',
                            },
                        ]}
                    />
                </TableSection>
            </ListPage>
        </Viewport>
    );
};

class Mandates extends React.Component {
    breadcrumbs = ['Data Collection', 'Recurring Data Requests'];

    render() {
        const {
            mandates,
            mandateUid,
            createNew,
            options,
            saveMandate,
            defaults,
            navigate,
        } = this.props;

        const mandate = mandates.find(m => m.uid === mandateUid) || defaults;

        return mandateUid || createNew ? (
            <EditingView
                key={`${mandateUid}${mandate.relUids.join('')}`}
                mandate={mandate}
                options={options}
                createNew={createNew}
                onSave={saveMandate}
                onCancel={() => navigate()}
                breadcrumbs={this.breadcrumbs}
            />
        ) : (
            <ListView
                mandates={mandates}
                options={options}
                onNewMandate={() => navigate('new')}
                onItemClick={item => navigate(item.uid)}
                breadcrumbs={this.breadcrumbs}
            />
        );
    }
}

export default Mandates;
