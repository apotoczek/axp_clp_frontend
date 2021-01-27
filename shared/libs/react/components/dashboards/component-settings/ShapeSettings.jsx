import React, {Component} from 'react';
import PropTypes from 'prop-types';

import {Column, Section, SectionTitle} from 'components/dashboards/component-settings/base';

import ColorPickerDropdown from 'components/basic/forms/dropdowns/ColorPickerDropdown';

class ShapeSettings extends Component {
    static propTypes = {
        onSettingsChanged: PropTypes.func.isRequired,
        provider: PropTypes.object.isRequired,
    };

    changeSettings = value => {
        return this.props.onSettingsChanged('changeSettings', value);
    };

    render() {
        const {provider} = this.props;
        return (
            <Column>
                <Section>
                    <SectionTitle>Style</SectionTitle>
                    <ColorPickerDropdown
                        label='Color'
                        color={provider.settingsValueForComponent(['color'])}
                        colors={provider.getCustomColors()}
                        onChange={color => this.changeSettings({color})}
                    />
                </Section>
            </Column>
        );
    }
}

export default ShapeSettings;
