/*global __dirname process*/
/*eslint no-console: ["error", { allow: ["warn", "error"] }]*/

// Load and define environment variables from the environment file.
require('dotenv').config({path: `${__dirname}/.env`});

const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const webpack = require('webpack');

// Define all the paths that we need in this config and child configs.
const rootPath = path.resolve(__dirname, '../');
const imgPath = path.resolve(rootPath, 'shared/img');
const libsPath = path.resolve(rootPath, 'shared/libs');
const dataPath = path.resolve(rootPath, 'shared/data');
const sharedPath = path.resolve(rootPath, 'shared');
const vendorPath = path.resolve(rootPath, 'shared/vendor');

const cssFileHash = Math.random()
    .toString(36)
    .substr(2, 10);

// We're using a few third party plugins for webpack that we need to include
// separately. We do this here.
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
// const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

// List the valid deployments and environments.
let validDeployments = ['bison', 'hl'];
let validEnvironments = ['development', 'production', 'staging'];

let importJQuery = () => ({
    loader: 'imports-loader',
    options: {
        $: 'jquery',
        jQuery: 'jquery',
    },
});

function shouldBuildProductionMode(node_env) {
    return node_env === 'production' || node_env === 'staging';
}

function validateEnvironment(deployment, node_env) {
    let allGood = true;

    if (validEnvironments.includes(node_env)) {
        console.log('NODE_ENV: OK');
    } else {
        allGood = false;
        console.error(`NODE_ENV: NOT OK (${node_env})`);
    }

    if (validDeployments.includes(deployment)) {
        console.log('DEPLOYMENT: OK');
    } else {
        allGood = false;
        console.error(`DEPLOYMENT: NOT OK (${deployment})`);
    }

    if (!allGood) {
        console.error('\x1b[31m', 'Cannot build, make sure your .env config file is correct.');
        process.exit();
    }
}

function generateDevConfig(customConfigFileName) {
    let baseConfig, customConfig;
    try {
        baseConfig = JSON.parse(fs.readFileSync('base_config.json'));
        customConfig = JSON.parse(fs.readFileSync(`${customConfigFileName}.json`));
    } catch (err) {
        customConfig = {};
    } finally {
        return _.merge(baseConfig, customConfig);
    }
}

function getHTMLMinifierOptions(node_env) {
    return {
        collapseWhitespace: shouldBuildProductionMode(node_env),
        conservativeCollapse: shouldBuildProductionMode(node_env),
        minifyCSS: shouldBuildProductionMode(node_env),
        minifyJS: shouldBuildProductionMode(node_env),
        customAttrCollapse: /data-bind/,
        processScripts: ['text/html'],
        removeComments: false,
        removeCommentsFromCDATA: false,
        removeCDATASectionsFromCDATA: false,
        removeAttributeQuotes: false,
        useShortDoctype: true,
        keepClosingSlash: false,
        removeScriptTypeAttributes: shouldBuildProductionMode(node_env),
        removeStyleTypeAttributes: shouldBuildProductionMode(node_env),
    };
}

function setupPlugins(deployment, node_env, devConfig, extractCSS) {
    let plugins = [
        // Workaround to ignore moment locales, saves significant space in bundle
        new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),

        // Takes some environment variables and exposes them as globals in the app.
        // These are replaced with their constant values at build time.
        new webpack.DefinePlugin({
            __DEPLOYMENT__: JSON.stringify(deployment),
            __ENV__: JSON.stringify(node_env),
            __DEV__: devConfig,
        }),
        new webpack.NormalModuleReplacementPlugin(
            /src\/styles\/DEPLOYMENT\.scss/,
            `src/styles/${deployment === 'hl' ? 'hl' : 'bison'}.scss`,
        ),
        // new BundleAnalyzerPlugin(),
    ];

    if (extractCSS) {
        // Extract the CSS into separate files (generates one per entry in the
        // current child-config)
        plugins.push(new MiniCssExtractPlugin({filename: `css/[name]__${cssFileHash}.css`}));
    }

    return plugins;
}

function devServerConfig() {
    return {
        watchOptions: {
            // We don't want webpack to watch any of the following directories,
            // it will only take up unnecessary processing power.
            ignored: /tools\/|node_modules\/|tests\/|snaphots\/|server\/|built\/|shared\/data\/|vendor\//,
        },
    };
}

function optimizationConfig() {
    return {
        runtimeChunk: 'single',
        splitChunks: {
            chunks: 'all',
            cacheGroups: {
                styles: {
                    name: 'styles',
                    test: /\.s?[ac]ss$/,
                    chunks: 'all',
                    enforce: true,
                },
            },
        },
    };
}

function babelLoaderConfig(node_env) {
    return {
        loader: 'babel-loader',
        options: {
            presets: [
                ['@babel/preset-react'],
                [
                    '@babel/preset-env',
                    {
                        useBuiltIns: 'entry',
                        // debug: true,
                        corejs: '2',
                    },
                ],
            ],
            plugins: [
                '@babel/plugin-proposal-object-rest-spread',
                '@babel/plugin-proposal-class-properties',
                '@babel/plugin-syntax-dynamic-import',
                [
                    'babel-plugin-styled-components',
                    {
                        ssr: false,
                        displayName: !shouldBuildProductionMode(node_env),
                        pure: true,
                    },
                ],
                'react-hot-loader/babel',
            ],
        },
    };
}

function fileParsingRules(
    projectPath,
    srcPath,
    libsPath,
    sharedPath,
    node_env,
    devConfig,
    enableOptimizations,
    enableSourceMaps,
    htmlMinifierOptions,
    extractCSS,
) {
    const jsLoaders = ['thread-loader', babelLoaderConfig(node_env)];

    if (devConfig.lintOnWatch) {
        jsLoaders.push({
            loader: 'stylelint-custom-processor-loader',
            options: {
                configPath: '.stylelintrc.yml',
                emitWarning: !shouldBuildProductionMode(node_env),
                fix: !shouldBuildProductionMode(node_env),
            },
        });

        jsLoaders.push({
            loader: 'eslint-loader',
            options: {
                fix: !shouldBuildProductionMode(node_env),
                cache: shouldBuildProductionMode(node_env),
                failOnError: shouldBuildProductionMode(node_env),
                failOnWarning: shouldBuildProductionMode(node_env),
                configFile: '.eslintrc.yml',
                ignorePath: '.eslintignore',
            },
        });
    }

    return [
        // We pre-process all javascript files using babel to enable support
        // for ES6 and similar things. This is done here.
        {
            test: /\.(js|jsx)$/,
            include: [projectPath, srcPath, libsPath],
            use: jsLoaders,
            exclude: /tests/,
        },
        // When we require a sass file we want to build the sass into
        // css and resolve all the urls that have been specified in the
        // files.
        {
            test: /\.s?[ac]ss$/,
            use: [
                extractCSS
                    ? {
                          loader: MiniCssExtractPlugin.loader,
                          options: {
                              publicPath: '/',
                          },
                      }
                    : {loader: 'style-loader'},
                {
                    loader: 'css-loader',
                    options: {importLoaders: 2, sourceMap: enableSourceMaps},
                },
                {
                    loader: 'postcss-loader',
                    options: {sourceMap: enableSourceMaps, config: {path: 'tools/'}},
                },
                {
                    loader: 'sass-loader',
                    options: {sourceMap: enableSourceMaps},
                },
            ],
        },
        // Whenever we come upon an HTML file that is at a path that
        // includes 'app' in it, we use this loader. It'll resolve the urls
        // and parse any javascript in the HTML file.
        {
            test: /\.html$/,
            include: [srcPath, libsPath],
            use: [
                'file-loader?name=[name]__[hash].[ext]',
                'extract-loader',
                {
                    loader: 'html-loader',
                    options: {
                        root: 'src',
                        interpolate: true,
                        minimize: enableOptimizations,
                        ...htmlMinifierOptions,
                    },
                },
            ],
        },
        {
            test: /\.ejs$/,
            exclude: /index/,
            include: [srcPath],
            use: [
                {
                    loader: 'file-loader',
                    options: {
                        name: '[name].html',
                        useRelativePath: true,
                    },
                },
                'extract-loader',
                {
                    loader: 'html-loader',
                    options: {
                        root: 'src',
                        interpolate: true,
                        minimize: enableOptimizations,
                        ...htmlMinifierOptions,
                    },
                },
                'ejs-html-loader',
            ],
        },
        // Takes the required image and moves it into the img/ folder,
        // adding a hash to it to avoid invalid caching.
        {
            test: /\.(png|gif|jpg|svg|ico)(\??[0-9]*)$/,
            use: {
                loader: 'url-loader',
                options: {
                    limit: 8192,
                    name: 'img/[name]__[hash].[ext]',
                },
            },
        },
        // Takes the required font and moves it into the fonts/ folder,
        // adding a hash to it to avoid invalid caching.
        {
            test: /\.(eot|woff|ttf)(\??[0-9]*)$/,
            use: [
                {
                    loader: 'file-loader',
                    options: {name: 'fonts/[name]__[hash].[ext]'},
                },
            ],
        },
        // Takes the required data files and moves it into the data/ folder,
        {
            test: /\.(zip)(\??[0-9]*)$/,
            use: {
                loader: 'file-loader',
                options: {name: 'data/[name].[ext]'},
            },
        },
        {
            test: require.resolve('daterangepicker'),
            use: importJQuery(),
        },
        {
            test: path.resolve(vendorPath, 'pagerjs/pager'),
            use: importJQuery(),
        },
        {
            test: require.resolve('blueimp-file-upload'),
            use: importJQuery(),
        },
        {
            test: require.resolve('cropit'),
            use: importJQuery(),
        },
        {
            test: require.resolve('jquery-ui'),
            use: importJQuery(),
        },

        // jQuery is loaded using expose-loader, this exposes a global
        // variable $ and jQuery in the app.
        // NOTE: This is a workaround, datatables are breaking without
        //       expsoing jQuery globally. We should try to get rid of
        //       this at some point.
        {
            test: require.resolve('jquery'),
            use: [
                {loader: 'expose-loader', options: 'jQuery'},
                {loader: 'expose-loader', options: '$'},
            ],
        },
        {
            test: require.resolve('knockout-punches'),
            use: {
                loader: 'imports-loader',
                options: {
                    ko: 'knockout',
                },
            },
        },
        {
            test: /\.xlsx$/,
            use: {
                loader: 'file-loader',
                options: {name: 'data/[name].[ext]'},
            },
        },
    ];
}

/**
 * Builds a base webpack config that can be extended with further config for
 * the specific projects. Depending on what parameters are sent in, the paths
 * returned in the base config will be different.
 *
 * @param {*} projectName The project to base the paths on. 'core' or 'commander'
 * @param {*} enableCommonChunksPlugin True if webpack should extract code
 * from bundles that contains the same code into a common bundle.
 */
const configGenerator = function(projectName, env) {
    //
    // ENVIRONMENT DEFINITIONS
    //
    const deployment = process.env.DEPLOYMENT; // 'bison' or 'hl'
    const customConfigFileName = process.env.CUSTOM_CONFIG || '';

    const node_env = process.env.NODE_ENV; // 'development', 'production', or 'staging'
    console.log('Running in', node_env, 'mode');

    const extractCSS = (env && env.extractCSS) || shouldBuildProductionMode(node_env);
    const useHotLoaderReactDom = !shouldBuildProductionMode(node_env);
    const enableOptimizations = shouldBuildProductionMode(node_env);
    const enableSourceMaps = !shouldBuildProductionMode(node_env);

    // Run through the environment variables and make sure they are set correctly.
    validateEnvironment(deployment, node_env);

    const devConfig = generateDevConfig(customConfigFileName);
    const htmlMinifierOptions = getHTMLMinifierOptions(node_env);

    // The path to one of the projects that we can potentially build. i.e.
    // 'core' or 'commander
    const projectPath = path.resolve(rootPath, projectName);
    const srcPath = path.resolve(projectPath, 'src');
    const reactPath = path.resolve(srcPath, 'react');
    const sharedReactPath = path.resolve(libsPath, 'react');

    const builtPath = path.resolve(rootPath, `built_${deployment}`, projectName);

    // We define all the plugins that are always going to be used, no matter what
    // environment we are in.
    const plugins = setupPlugins(deployment, node_env, devConfig, extractCSS);

    const aliases = {
        // Alias for legacy reasons, this allows us to avoid changing all
        // our files to 'shared/libs', 'shared/img' etc.
        'src/libs': libsPath,
        'src/img': imgPath,
        'src/data': dataPath,
        vendor: vendorPath,
        // More aliases that are used throughout the app
        config: 'src/config',
        bison: path.resolve(libsPath, 'bison'),
        custombindings: path.resolve(libsPath, 'custombindings'),
        extenders: path.resolve(libsPath, 'extenders'),
        hooks: path.resolve(libsPath, 'hooks'),
        metrics: path.resolve(libsPath, 'metrics'),
        utilities: path.resolve(libsPath, 'utilities'),
        auth: path.resolve(libsPath, 'auth'),
        lang: path.resolve(libsPath, 'lang'),
        handsontable: 'handsontable/dist/handsontable.js',

        // We have a few dependencies that are still loaded from the vendor
        // folder. Either because they are not available at NPM or because
        // we have modified the dependencies locally and thus cannot
        // download them from NPM. These dependencies are loaded using the
        // following aliases.
        googleMapsLoaderUtil: path.resolve(vendorPath, 'googleMapsLoaderUtil'),
        pager: path.resolve(vendorPath, 'pagerjs/pager'),
        infobox: path.resolve(vendorPath, 'infobox'),
    };

    if (useHotLoaderReactDom) {
        aliases['react-dom'] = '@hot-loader/react-dom';
    }

    let config = {
        // At least one of the libraries we use have functionality that uses nodes fs module.
        // Webpack complains since the fs module is not available in our frontend, this config
        // "mocks" that module with an empty object.
        node: {
            fs: 'empty',
        },
        mode: shouldBuildProductionMode(node_env) ? 'production' : 'development',
        // Defines where the resulting build will be placed upon completion.
        output: {
            filename: 'js/[name]__[hash].js',
            chunkFilename: 'js/[name]__[chunkhash].js',
            path: builtPath,

            // The path where the finished, built, app will resolve assets from.
            publicPath: '/',
        },
        devtool: enableSourceMaps ? 'cheap-module-eval-source-map' : undefined,
        devServer: devServerConfig(),
        optimization: optimizationConfig(),
        resolve: {
            symlinks: false,
            alias: aliases,
            // The resolving of modules are relative to the active project, i.e. core,
            // thus we add projectPath to resolve-paths here. We add node_modules as
            // well, since that is the default value and we don't want to take it away.
            modules: [
                projectPath,
                srcPath,
                reactPath,
                sharedReactPath,
                path.resolve(__dirname, 'node_modules'),
            ],
            extensions: ['.json', '.jsx', '.js'],
        },
        module: {
            strictExportPresence: true,
            rules: fileParsingRules(
                projectPath,
                srcPath,
                libsPath,
                sharedPath,
                node_env,
                devConfig,
                enableOptimizations,
                enableSourceMaps,
                htmlMinifierOptions,
                extractCSS,
            ),
        },
        plugins: plugins,
    };

    return config;
};

module.exports = {
    rootPath,
    sharedPath,
    libsPath,
    vendorPath,
    configGenerator,
    cssFileHash,
    babelLoaderConfig,
    shouldBuildProductionMode,
};
