const path = require('path');
const webpack = require('webpack');
const base = require('./webpack.config.js');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = function(argv) {
    const env = process.env.NODE_ENV; // 'development', 'production', or 'staging'

    let projectPath = path.resolve(base.rootPath, 'commander/');
    let config = base.configGenerator('commander', argv);

    const extractCSS = argv && argv.extractCSS || base.shouldBuildProductionMode(env);

    return {
        ...config,
        plugins: [
            ...config.plugins,
            new HtmlWebpackPlugin({
                filename: 'index.html',
                template: `${projectPath}/src/index.ejs`,
                minify: false,
                chunks: ['app'],
            }),
        ],

        devServer: {
            ...config.devServer,
            port: 8081,
            public: 'commander.bison.null',
        },

        // The paths were we start parsing the app from.
        entry: {
            app: path.resolve(projectPath, 'src/app.js'),
        },
    };
};
