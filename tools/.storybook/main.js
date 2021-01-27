const base = require('../webpack.config.js');

module.exports = {
    stories: [
        '../../shared/libs/react/**/*.stories.(js|mdx|jsx)',
        '../../stories/**/*.stories.(js|mdx|jsx)',
    ],
    addons: [
        '@storybook/addon-actions',
        '@storybook/addon-links',
        '@storybook/addon-knobs',
        '@storybook/addon-docs',
        '@storybook/addon-storysource',
        '@storybook/addon-viewport',
        '@storybook/addon-backgrounds',
    ],
    webpackFinal: async config => {
        const deployment = process.env.DEPLOYMENT; // 'bison' or 'hl'
        const baseConfig = base.configGenerator('stories', deployment);

        const storybookLoaders = config.module.rules;
        removeLoaderWithRegExp(storybookLoaders, /\.css$/);
        removeLoaderWithRegExp(
            storybookLoaders,
            /\.(svg|ico|jpg|jpeg|png|gif|eot|otf|webp|ttf|woff|woff2|cur|ani|pdf)(\?.*)?$/,
        );
        removeLoaderWithRegExp(storybookLoaders, /\.(mp4|webm|wav|mp3|m4a|aac|oga)(\?.*)?$/);

        const combinedLoaders = [...storybookLoaders, ...baseConfig.module.rules];

        modifyLoaderWithRegExp(combinedLoaders, /\.(js|jsx)$/, rule => {
            rule.use[1].options.plugins.push('babel-plugin-react-docgen');
        });

        const finalConfig = {
            ...config,
            ...baseConfig,
            output: config.output,
            module: {
                ...config.module,
                ...baseConfig.module,
                rules: combinedLoaders,
            },
            resolve: {
                ...config.resolve,
                ...baseConfig.resolve,
            },
            plugins: [...config.plugins, ...baseConfig.plugins],
        };

        return finalConfig;
    },
};

function removeLoaderWithRegExp(rules, regExp) {
    // Remove the CSS Loader, since we already have one.
    const storybookCSSLoaderIdx = rules.findIndex(rule => String(rule.test) == String(regExp));
    if (storybookCSSLoaderIdx > -1) {
        rules.splice(storybookCSSLoaderIdx, 1);
    }
}

function modifyLoaderWithRegExp(rules, regExp, modifier) {
    // Remove the CSS Loader, since we already have one.
    const storybookCSSLoaderIdx = rules.findIndex(rule => String(rule.test) == String(regExp));
    if (storybookCSSLoaderIdx == -1) {
        return;
    }

    modifier(rules[storybookCSSLoaderIdx]);
}
