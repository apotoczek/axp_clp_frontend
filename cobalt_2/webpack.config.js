/*global __dirname process*/
/*eslint no-console: ["error", { allow: ["warn", "error"] }]*/

// Load and define environment variables from the environment file.
require('dotenv').config({path: `${__dirname}/.env`});

const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const webpack = require('webpack');

const HtmlWebpackPlugin = require('html-webpack-plugin');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

// Define all the paths that we need in this config and child configs.
const rootPath = __dirname;

const NODE_ENV = process.env.NODE_ENV;

const VALID_ENVIRONMENTS = ['development', 'production', 'staging'];

const PRODUCTION_BUILD = NODE_ENV === 'production' || NODE_ENV === 'staging';
const USE_HOT_LOADER_REACT_DOM = !PRODUCTION_BUILD;
const ENABLE_OPTIMIZATIONS = PRODUCTION_BUILD;
const ENABLE_SOURCE_MAPS = !PRODUCTION_BUILD;

let devConfig;
let baseConfig = {};
let customConfig = {};
try {
    baseConfig = JSON.parse(fs.readFileSync('base_config.json'));
    customConfig = JSON.parse(fs.readFileSync('dev.json'));
} catch (err) {
    customConfig = {};
} finally {
    devConfig = _.merge(baseConfig, customConfig);
}

function maybeUse(loader, condition) {
    return condition ? [loader] : [];
}

module.exports = function () {
    console.log('Running in', NODE_ENV, 'mode');

    // Run through the environment variables and make sure they are set correctly.
    if (!VALID_ENVIRONMENTS.includes(NODE_ENV)) {
        console.error(`NODE_ENV: NOT OK (${NODE_ENV})`);
        console.error('\x1b[31m', 'Cannot build, make sure your .env config file is correct.');
        process.exit();
    }

    return {
        // At least one of the libraries we use have functionality that uses nodes fs module.
        // Webpack complains since the fs module is not available in our frontend, this config
        // "mocks" that module with an empty object.
        // node: {
        //     fs: 'empty',
        // },

        mode: PRODUCTION_BUILD ? 'production' : 'development',

        entry: {
            login: 'index.tsx',
        },

        // Defines where the resulting build will be placed upon completion.
        output: {
            filename: '[name]__[hash].js',
            chunkFilename: '[name]__[chunkhash].js',
            path: path.resolve(rootPath, 'built'),

            // The path where the finished, built, app will resolve assets from.
            publicPath: '/',
        },
        // devtool: ENABLE_SOURCE_MAPS ? 'source-map' : undefined,
        devServer: {
            port: 8083,
            host: '0.0.0.0',
            public: 'bison.null:8083',
            watchOptions: {
                // We don't want webpack to watch any of the following directories,
                // it will only take up unnecessary processing power.
                ignored: /node_modules\/|tests\/|built\//,
            },
            hot: true,
            historyApiFallback: true,
        },
        optimization: {
            runtimeChunk: 'single',
            splitChunks: {
                chunks: 'all',
            },
        },
        resolve: {
            alias: {
                'react-dom': USE_HOT_LOADER_REACT_DOM ? '@hot-loader/react-dom' : undefined,
            },
            modules: [path.resolve(__dirname, 'src'), path.resolve(__dirname, 'node_modules')],
            extensions: ['.tsx', '.ts', '.jsx', '.js'],
        },
        module: {
            strictExportPresence: true,
            rules: [
                // We pre-process all javascript files using babel to enable support
                // for ES6 and similar things. This is done here.
                {
                    test: /\.(js|jsx|ts|tsx)$/,
                    include: [path.resolve(__dirname, 'src')],
                    use: [
                        {
                            loader: 'babel-loader',
                            options: {
                                presets: [
                                    ['@babel/preset-env', {useBuiltIns: 'entry', corejs: '2'}],
                                    ['@babel/typescript'],
                                    ['@babel/preset-react'],
                                ],
                                plugins: [
                                    '@babel/plugin-proposal-object-rest-spread',
                                    '@babel/plugin-proposal-class-properties',
                                    '@babel/plugin-syntax-dynamic-import',
                                    [
                                        'babel-plugin-styled-components',
                                        {
                                            ssr: false,
                                            displayName: !PRODUCTION_BUILD,
                                            pure: true,
                                        },
                                    ],
                                    'react-hot-loader/babel',
                                ],
                            },
                        },
                        ...maybeUse(
                            {
                                loader: 'stylelint-custom-processor-loader',
                                options: {
                                    configPath: '.stylelintrc.yml',
                                    emitWarning: !PRODUCTION_BUILD,
                                    fix: !PRODUCTION_BUILD,
                                },
                            },
                            devConfig.lintOnWatch,
                        ),
                        ...maybeUse(
                            {
                                loader: 'eslint-loader',
                                options: {
                                    fix: !PRODUCTION_BUILD,
                                    cache: PRODUCTION_BUILD,
                                    failOnError: PRODUCTION_BUILD,
                                    failOnWarning: PRODUCTION_BUILD,
                                    configFile: '.eslintrc.yml',
                                    ignorePath: '.eslintignore',
                                },
                            },
                            devConfig.lintOnWatch,
                        ),
                    ],
                    exclude: /tests/,
                },
                {
                    test: /\.s?[ac]ss$/,
                    use: [
                        {loader: 'style-loader'},
                        {
                            loader: 'css-loader',
                            options: {importLoaders: 2, sourceMap: ENABLE_SOURCE_MAPS},
                        },
                        {
                            loader: 'postcss-loader',
                            options: {sourceMap: ENABLE_SOURCE_MAPS, config: {path: 'tools/'}},
                        },
                        {
                            loader: 'sass-loader',
                            options: {sourceMap: ENABLE_SOURCE_MAPS},
                        },
                    ],
                },
                {
                    test: /\.(png|gif|jpg|svg|ico)(\??[0-9]*)$/,
                    use: {
                        loader: 'url-loader',
                        options: {limit: 8192, name: '[name]__[hash].[ext]'},
                    },
                },
                {
                    test: /\.(eot|woff|ttf)(\??[0-9]*)$/,
                    use: {
                        loader: 'file-loader',
                        options: {name: 'fonts/[name]__[hash].[ext]'},
                    },
                },
            ],
        },
        plugins: [
            new webpack.DefinePlugin({
                __ENV__: JSON.stringify(NODE_ENV),
                __DEV_CONFIG__: devConfig,
            }),
            new HtmlWebpackPlugin({
                filename: 'index.html',
                template: 'src/index.html',
                favicon: 'src/img/favicon.ico',
            }),
            new ForkTsCheckerWebpackPlugin(),
        ],
    };
};
