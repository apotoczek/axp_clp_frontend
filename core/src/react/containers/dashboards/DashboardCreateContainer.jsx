import React, {Component} from 'react';
import {Flex, Box} from '@rebass/grid';

import {withRouter} from 'react-router';
import {is_set} from 'src/libs/Utils';
import {PageFormat} from 'src/libs/Enums';

import backendConnect from 'utils/backendConnect';
import * as endpoints from 'actions/data/endpoints';
import * as requestActions from 'actions/data/requests';

import * as entitiesSelectors from 'selectors/entities';
import * as siteCustomizations from 'selectors/siteCustomizations';

import {Page, Content, Viewport} from 'components/layout';
import {H1, H3, Description} from 'components/basic/text';
import Icon from 'components/basic/Icon';
import Breadcrumbs from 'components/Breadcrumbs';
import Toolbar, {ToolbarItem} from 'components/basic/Toolbar';
import DropdownList from 'components/basic/forms/dropdowns/DropdownList';
import TextInput from 'components/basic/forms/input/TextInput';
import TextField from 'components/basic/forms/input/TextField';
import NumberInput from 'components/basic/forms/input/NumberInput';
import BaseEntityForm from 'components/dashboards/dashboard-settings/BaseEntityForm';
import Button from 'components/basic/forms/Button';
import Checkbox from 'components/basic/forms/Checkbox';
import ColorPickerDropdown from 'components/basic/forms/dropdowns/ColorPickerDropdown';
import Loader from 'components/basic/Loader';

import * as listActions from 'actions/dashboards/list';

class DashboardCreateContainer extends Component {
    state = {
        name: '',
        errors: {},
        format: PageFormat.DASHBOARD,
        preventCollision: false,
        disableCompact: false,
        backgroundColor: '#FFFFFF',
        componentPadding: 0,
        baseEntities: [],
    };

    componentDidMount() {
        this.props.triggerRequests();
    }

    handleCreateNew = () => {
        const {
            name,
            description,
            format,
            errors,
            backgroundColor,
            preventCollision,
            disableCompact,
            baseEntities,
            componentPadding,
        } = this.state;

        if (!is_set(name, true)) {
            this.setState({
                errors: {
                    ...errors,
                    name: 'Name is required to create a dashboard',
                },
            });

            return;
        }
        const templateSettings = {
            format,
            backgroundColor,
            preventCollision,
            disableCompact,
            componentPadding,
        };

        const dashboardSettings = {baseEntities};

        const parentUid = this.props.match.params.parent;

        this.props.createDashboard(
            name,
            description,
            templateSettings,
            dashboardSettings,
            parentUid,
        );
    };

    handleNameChanged = name => {
        this.setState({
            errors: {
                ...this.state.errors,
                name: undefined,
            },
            name,
        });
    };

    handleDescriptionChanged = description => {
        this.setState({description});
    };

    handleFormatChanged = format => {
        this.setState({format});
    };

    handleChangeFormValue = key => value => {
        this.setState({[key]: value});
    };

    handleAddBaseEntity = entityUuid => {
        this.setState({
            baseEntities: [...this.state.baseEntities, entityUuid],
        });
    };

    handleRemoveBaseEntity = entityUuid => {
        const newBaseEntities = this.state.baseEntities.filter(el => el != entityUuid);

        this.setState({
            baseEntities: newBaseEntities,
        });
    };

    handleChangeBaseEntity = (oldEntityUuid, newEntityUuid) => {
        const index = this.state.baseEntities.indexOf(oldEntityUuid);
        const newBaseEntities = [...this.state.baseEntities];
        newBaseEntities.splice(index, 1, newEntityUuid);

        this.setState({
            baseEntities: newBaseEntities,
        });
    };

    render() {
        const {name, description, format, componentPadding, errors} = this.state;

        const formatOptions = [
            {value: PageFormat.DASHBOARD, label: 'Dashboard'},
            {value: PageFormat.LETTER, label: 'US Letter'},
            {value: PageFormat.A4, label: 'A4'},
            {value: PageFormat.LETTER_LANDSCAPE, label: 'US Letter - Landscape'},
            {value: PageFormat.A4_LANDSCAPE, label: 'A4 - Landscape'},
        ];

        const formatLabel = (formatOptions.find(o => o.value === format) || {}).label;

        if (
            this.props.requests.vehicles.loading ||
            this.props.requests.siteCustomizations.loading
        ) {
            return <Loader />;
        }

        return (
            <Viewport>
                <Breadcrumbs path={['Report', 'Create']} urls={['/documents/browse']} />
                <Page>
                    <Content>
                        <Toolbar>
                            <ToolbarItem icon='list' to='/documents/browse' glyphicon right>
                                Back to List
                            </ToolbarItem>
                        </Toolbar>
                        <Flex p={3} flexDirection='column'>
                            <H1>New Report</H1>
                            <Description>
                                Create a new report, either based of a blank slate or a previously
                                defined template. This report can later be shared with any user in
                                your client.
                            </Description>
                        </Flex>
                        <Flex p={3}>
                            <Box width={[1, null, null, 1 / 2]}>
                                <H3>General</H3>
                                <TextInput
                                    leftLabel='Name'
                                    placeholder='Enter name'
                                    debounceValueChange={false}
                                    onValueChanged={this.handleNameChanged}
                                    value={name}
                                    error={errors.name}
                                    mb={2}
                                />
                                <Flex width={1} mb={3}>
                                    <DropdownList
                                        leftLabel='Template'
                                        placeholder='Select a template'
                                        options={[{value: 0, label: 'Blank'}]}
                                        manualValue='Blank'
                                        mr={1}
                                    />
                                    <DropdownList
                                        leftLabel='Format'
                                        placeholder='Select a format'
                                        options={formatOptions}
                                        manualValue={formatLabel}
                                        onValueChanged={this.handleFormatChanged}
                                        ml={1}
                                    />
                                </Flex>
                                <TextField
                                    topLabel='Description'
                                    height={150}
                                    placeholder={oneLine`
                                        Enter a description (max 150 characters)
                                    `}
                                    maxLength={150}
                                    value={description}
                                    onValueChanged={this.handleDescriptionChanged}
                                    debounceValueChange={false}
                                    mb={3}
                                />
                                <Flex flex={1} flexDirection='column'>
                                    <H3>Grid</H3>
                                    <Checkbox
                                        leftLabel='Prevent Collisions'
                                        checked={this.state.preventCollision}
                                        onValueChanged={this.handleChangeFormValue(
                                            'preventCollision',
                                        )}
                                        mb={1}
                                    />
                                    <Checkbox
                                        leftLabel='Disable Compact Vertically'
                                        checked={this.state.disableCompact}
                                        onValueChanged={this.handleChangeFormValue(
                                            'disableCompact',
                                        )}
                                        mb={1}
                                    />
                                    <ColorPickerDropdown
                                        label='Background Color'
                                        color={this.state.backgroundColor}
                                        colors={this.props.customColors}
                                        onChange={this.handleChangeFormValue('backgroundColor')}
                                        mb={1}
                                    />
                                    <NumberInput
                                        leftLabel='Component Padding'
                                        value={componentPadding}
                                        onValueChanged={this.handleChangeFormValue(
                                            'componentPadding',
                                        )}
                                    />
                                </Flex>
                            </Box>
                            <Box width={[1, null, null, 1 / 2]} pl={[0, null, null, 3]}>
                                <H3>Base Entities</H3>
                                <BaseEntityForm
                                    vehicles={this.props.vehicles}
                                    baseEntities={this.state.baseEntities || []}
                                    onAddEntity={this.handleAddBaseEntity}
                                    onChangeEntity={this.handleChangeBaseEntity}
                                    onRemoveEntity={this.handleRemoveBaseEntity}
                                    enableAddEntity
                                />
                                <Flex justifyContent='flex-end' mt={2}>
                                    <Button primary onClick={this.handleCreateNew}>
                                        Create
                                        <Icon name='plus' glyphicon right></Icon>
                                    </Button>
                                </Flex>
                            </Box>
                        </Flex>
                    </Content>
                </Page>
            </Viewport>
        );
    }
}

const data = () => ({
    vehicles: endpoints.call('dataprovider/user_vehicles', {}),
    siteCustomizations: requestActions.fetchSiteCustomizations(),
});

const mapStateToProps = state => ({
    vehicles: entitiesSelectors.formattedVehicles(state),
    customColors: siteCustomizations.customColors(state),
});

const dispatchToProps = {
    createDashboard: listActions.create,
};

export default withRouter(
    backendConnect(data, {}, mapStateToProps, dispatchToProps)(DashboardCreateContainer),
);
