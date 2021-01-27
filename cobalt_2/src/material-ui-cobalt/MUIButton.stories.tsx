import {Story, Meta} from '@storybook/react/types-6-0'

import React, {FC, FunctionComponent, ReactNode} from 'react';
import MUIButton, {ButtonProps} from '@material-ui/core/Button';

const Button: Story<ButtonProps> = (args) => <MUIButton {...args} />;

/**
 * some component info
 */
export const Primary = Button.bind({})
Primary.args = {
    children: 'Primary',
    onClick: () => {},
}

// Primary.parameters = {
//     docs: {

//     }
// }

const meta: Meta = {
    title: 'Material-UI Button',
    component: Button,
    argTypes: {
        fullWidth: {
            description: 'Whether the component should fill all available space.',
            control: 'boolean',
            defaultValue: false,
        },
        disableElevation: {
            control: 'boolean',
            defaultValue: false,
        },
        children: {
            control: 'text',
            defaultValue: 'Click Me!',
        },
        variant: {
            control: {type: 'select', options: ['text', 'outlined', 'contained']},
            defaultValue: 'contained',
        },
        color: {
            control: {type: 'select', options: ['primary', 'secondary', 'error', 'warning']},
            defaultValue: 'primary',
        },
        size: {
            control: {type: 'select', options: ['small', 'medium', 'large']},
            defaultValue: 'medium',
        },
    },
};
export default meta;
