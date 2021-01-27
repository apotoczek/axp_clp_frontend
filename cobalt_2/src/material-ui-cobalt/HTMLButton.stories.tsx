import React, {FC, FunctionComponent, ReactNode} from 'react';

type ButtonProps = {
    /**
     * String unions get turned into selector knobs, which is pretty cool.
     */
    color: 'lightblue' | 'darksalmon' | 'orange';

    /**
     * This is how you make docstrings for parameters. Open storybook and check the "Docs"
     * tab of this component -- it should show this text, as well as the type:
     */
    onClick?: () => void;

    /**
     * fooooo
     */
    children: ReactNode;
};


/**
 * A demo of using typescript for storybook components. This just uses the plain `button`
 * from html -- actual components be importing the material-ui component or our
 * custom-built component.
 */
export const Button: FC<ButtonProps & {color: 'lightblue' | 'orange'}> = ({
    // This is how we assign default values:
    children = 'click me',
    onClick = () => {
        alert('clicked!');
    },
    color = 'lightblue',
}: ButtonProps) => (
    <button onClick={onClick} type='button' style={{backgroundColor: color}}>
        {children}
    </button>
);

export default {
    title: 'Plain HTML Button',
    component: Button,
    argTypes: {
        // We can also declare args as data to make them global across stories
        children: {
            description: 'The contents of the button.',
            control: 'text',
        }
    },
    args: {
        children: 'Click me!'
    }
};
