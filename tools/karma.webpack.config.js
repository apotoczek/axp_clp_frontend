const path = require('path');
const webpack = require('webpack');
const base = require('./webpack.config.js');

let rootPath = path.resolve(__dirname, '../');
let config = base.configGenerator('core');

config.module.rules.push({
    test: /\.js$/,
    use: [
        {
            loader: 'istanbul-instrumenter-loader',
            options: { esModules: true }
        },
        base.babelLoaderConfig('development'),
    ],
    enforce: 'post',
    exclude: /node_modules|shared\/vendor|\.spec\.js$/,
});

config = Object.assign(config, {
    // Karma takes care of handling the entry points, we can skip that.
    entry: null,

    devtool: 'cheap-module-eval-source-map',

    // Modify the resolve paths to allow karma to find the node_modules folder
    // etc.
    resolve: Object.assign({}, config.resolve, {
        alias: Object.assign({}, config.resolve.alias, {
            tests: path.resolve(base.rootPath, 'tests/')
        })
    }),
});

module.exports = config;
