import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import {Flex, Box} from '@rebass/grid';
import {PageFormat} from 'src/libs/Enums';

import ExtraPropTypes from 'utils/extra-prop-types';

import {H1, H3} from 'components/basic/text';
import Icon from 'components/basic/Icon';

import auth from 'auth';
import Button from 'components/basic/forms/Button';
import Checkbox from 'components/basic/forms/Checkbox';
import ColorPickerDropdown from 'components/basic/forms/dropdowns/ColorPickerDropdown';
import TextInput from 'components/basic/forms/input/TextInput';
import NumberInput from 'components/basic/forms/input/NumberInput';
import DropdownList from 'components/basic/forms/dropdowns/DropdownList';
import TextField from 'components/basic/forms/input/TextField';
import DatePickerDropdown from 'components/basic/forms/dropdowns/DatePickerDropdown';

import BaseEntityForm from 'components/dashboards/dashboard-settings/BaseEntityForm';

import {date_to_epoch, epoch_to_date} from 'src/libs/Utils';

const Container = styled(Flex)`
    background-color: ${({theme}) => theme.dashboard.dashboardSettings.bg};

    @media only screen and (max-width: 1024px) {
        width: 960px;
    }

    @media only screen and (min-width: 1025px) and (max-width: 1350px) {
        width: 960px;
    }

    @media only screen and (min-width: 1351px) and (max-width: 1920px) {
        width: 1280px;
    }
`;

const Header = styled(Box)`
    border-bottom: 1px solid #566174;
`;

const NameLabel = styled.span`
    font-weight: 600;
`;

class DashboardSettings extends React.Component {
    static propTypes = {
        name: PropTypes.string.isRequired,
        description: PropTypes.string,
        preventCollision: PropTypes.bool.isRequired,
        format: PropTypes.string.isRequired,
        disableCompact: PropTypes.bool.isRequired,
        vehicles: PropTypes.objectOf(
            PropTypes.shape({
                entity_uid: PropTypes.string.isRequired,
                entity_type: PropTypes.string.isRequired,
                entity_name: PropTypes.string.isRequired,
            }),
        ).isRequired,
        baseEntities: PropTypes.arrayOf(ExtraPropTypes.uuid).isRequired,

        onChange: PropTypes.func.isRequired,
        onSave: PropTypes.func.isRequired,
        onDiscard: PropTypes.func.isRequired,
        onAddBaseEntity: PropTypes.func.isRequired,
        onChangeBaseEntity: PropTypes.func.isRequired,
        onRemoveBaseEntity: PropTypes.func.isRequired,
    };

    render() {
        const {
            backgroundColor,
            baseEntities,
            format,
            description,
            disableCompact,
            globalDate,
            name,
            onChange,
            preventCollision,
            vehicles,
            componentPadding,
        } = this.props;

        const formatOptions = [
            {value: PageFormat.DASHBOARD, label: 'Dashboard'},
            {value: PageFormat.LETTER, label: 'US Letter'},
            {value: PageFormat.A4, label: 'A4'},
            {value: PageFormat.LETTER_LANDSCAPE, label: 'US Letter - Landscape'},
            {value: PageFormat.A4_LANDSCAPE, label: 'A4 - Landscape'},
        ];

        const enableChangeFormat = auth.user_has_feature('internal');

        return (
            <Container flexWrap='wrap'>
                <Header flex='0 0 100%' pb={2} mb={3}>
                    <H1>
                        Settings for <NameLabel>{name}</NameLabel>
                    </H1>
                </Header>
                <Flex flex={1} flexDirection='column' mr={3}>
                    <Box>
                        <H3>General</H3>
                    </Box>
                    <TextInput
                        leftLabel='Name'
                        placeholder='Enter a name'
                        value={name}
                        onValueChanged={onChange('name')}
                        mb={3}
                    />
                    <TextField
                        topLabel='Description'
                        value={description}
                        maxLength={150}
                        placeholder='Enter a description (max 150 characters)'
                        onValueChanged={onChange('description')}
                        mb={2}
                    />
                    <DatePickerDropdown
                        label='Global date'
                        value={globalDate && epoch_to_date(globalDate)}
                        onChange={date => onChange('globalDate')(date_to_epoch(date))}
                        mb={1}
                    />
                    {enableChangeFormat && (
                        <DropdownList
                            leftLabel='Format'
                            placeholder='Select a format'
                            options={formatOptions}
                            value={format}
                            onValueChanged={onChange('format')}
                        />
                    )}
                    <Box mt={4}>
                        <H3>Grid</H3>
                    </Box>
                    <Checkbox
                        leftLabel='Prevent Collisions'
                        checked={preventCollision}
                        onValueChanged={onChange('preventCollision')}
                        mb={1}
                    />
                    <Checkbox
                        leftLabel='Disable Compact Vertically'
                        checked={disableCompact}
                        onValueChanged={onChange('disableCompact')}
                        mb={1}
                    />
                    <ColorPickerDropdown
                        label='Background Color'
                        color={backgroundColor}
                        colors={this.props.customColors}
                        onChange={onChange('backgroundColor')}
                        mb={1}
                    />
                    <NumberInput
                        leftLabel='Component Padding'
                        onValueChanged={onChange('componentPadding')}
                        min={0}
                        max={24}
                        value={componentPadding}
                    />
                </Flex>
                <Flex flex={1} flexDirection='column'>
                    <Box>
                        <H3>Base Entities</H3>
                    </Box>
                    <BaseEntityForm
                        vehicles={vehicles}
                        baseEntities={baseEntities || []}
                        onAddEntity={this.props.onAddBaseEntity}
                        onChangeEntity={this.props.onChangeBaseEntity}
                        onRemoveEntity={this.props.onRemoveBaseEntity}
                        enableAddEntity
                    />
                </Flex>
                <Flex flex='0 0 100%' justifyContent='flex-end' mt={4}>
                    <Button flex='0 1 auto' onClick={this.props.onDiscard} mr={2}>
                        Cancel
                        <Icon name='remove' glyphicon right />
                    </Button>
                    <Button flex='0 1 auto' onClick={this.props.onSave} primary>
                        Save Settings
                        <Icon name='ok' glyphicon right />
                    </Button>
                </Flex>
            </Container>
        );
    }
}

export default DashboardSettings;
