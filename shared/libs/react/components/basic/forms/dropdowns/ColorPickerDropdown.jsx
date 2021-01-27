import React from 'react';
import styled from 'styled-components';

import {extractLayoutProps} from 'src/libs/Utils';

import Dropdown from 'components/basic/forms/dropdowns/Dropdown';

import ColorPicker, {Swatch} from 'components/ColorPicker';
import {DropdownContent, DropdownInput} from 'components/basic/forms/dropdowns/base';

const Content = styled(DropdownContent)`
    padding: 8px;
`;

function ColorPickerDropdown({color, colors, label, onChange, children, disabled, ...restProps}) {
    let availableColors = colors;

    const dropdownContent = ({togglePopover}) => (
        <Content>
            <ColorPicker
                color={color}
                colors={availableColors}
                onChange={(color, closePicker) => {
                    onChange(color);
                    if (closePicker) {
                        togglePopover();
                    }
                }}
            />
        </Content>
    );
    const layoutProps = extractLayoutProps(restProps);

    return (
        <Dropdown render={dropdownContent}>
            {children ? (
                children
            ) : (
                <DropdownInput
                    label={label}
                    disabled={disabled}
                    rightRender={() => <Swatch size={18} margin={0} color={color} float='right' />}
                    {...layoutProps}
                />
            )}
        </Dropdown>
    );
}

export default ColorPickerDropdown;
