import '@babel/polyfill';

import React from 'react';
import Sugar from 'sugar';
import {addParameters, addDecorator} from '@storybook/react';

// import 'variables';
import 'src/libs/fonts.scss';
import 'bootstrap-sass/assets/stylesheets/_bootstrap.scss';
import 'src/libs/icons/css/fontello.scss';
import 'src/libs/icons/css/animation.scss';
import 'src/libs/icons/css/bison-custom.scss';
import 'src/libs/icons/css/bison-icons.css';
import 'react-virtualized/styles.css';

addParameters({
    backgrounds: [
        {name: 'white', value: '#ffffff', default: true},
        {name: 'almost white', value: '#f9f9f9'},
        {name: 'not as white', value: '#e9e9e9'},
    ],
    options: {
        showRoots: true,
    },
});

import {LightTheme} from 'themes';

Sugar.extend();

addDecorator(story => <LightTheme>{story()}</LightTheme>);
