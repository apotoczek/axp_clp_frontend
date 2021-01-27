import React from 'react';
import PropTypes from 'prop-types';

import CPanelPopover, {
    CPanelPopoverButton,
    CPanelPopoverDivider,
} from 'components/basic/cpanel/CPanelPopover';

import {CPanelButton} from 'components/basic/cpanel/base';

import ColorPicker, {Swatch} from 'components/ColorPicker';

export const PopoverColorPicker = ({label, value, onChange}) => (
    <CPanelPopover
        render={({togglePopover}) => (
            <div>
                <ColorPicker color={value || 'transparent'} onChange={onChange} />
                <CPanelPopoverDivider />
                <CPanelButton onClick={togglePopover}>Close</CPanelButton>
            </div>
        )}
    >
        <CPanelPopoverButton>
            {label}
            <Swatch size={18} margin={0} color={value || 'transparent'} float='right' />
        </CPanelPopoverButton>
    </CPanelPopover>
);

PopoverColorPicker.propTypes = {
    label: PropTypes.string.isRequired,
    value: PropTypes.string,
    onChange: PropTypes.func,
};
