const path = require('path');
const baseWebpackConfig = require('../webpack.config.js')();

module.exports = {
    typescript: {
        check: false,
        checkOptions: {},
        reactDocgen: 'react-docgen-typescript',
        reactDocgenTypescriptOptions: {
            shouldExtractLiteralValuesFromEnum: true,
            propFilter: (prop) => (prop.parent ? !/node_modules/.test(prop.parent.fileName) : true),
        }
    },

    webpackFinal: (config, { configType }) => {
        return {...config, module: {...config.module, rules: baseWebpackConfig.module.rules}};
    },

    stories: [
        "../src/**/*.stories.mdx",
        "../src/**/*.stories.@(js|jsx|ts|tsx)",
    ],

    addons: [
        '@storybook/addon-actions',
        '@storybook/addon-links',
        '@storybook/addon-docs',
        '@storybook/addon-storysource',
        '@storybook/addon-viewport',
        '@storybook/addon-backgrounds',
    ]
}
