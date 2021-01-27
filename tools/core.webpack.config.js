const path = require('path');
const webpack = require('webpack');
const base = require('./webpack.config.js');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = function(env) {
    const deployment = process.env.DEPLOYMENT; // 'bison' or 'hl'

    let projectPath = path.resolve(base.rootPath, 'core/');
    let config = base.configGenerator('core', env);

    const WebpackShellPlugin = require('webpack-shell-plugin');
    const CopyWebpackPlugin = require('copy-webpack-plugin');

    let files_to_copy = [
        {
            from: path.resolve(projectPath, 'unsupported_browser'),
            to: 'unsupported_browser/'
        },
    ];

    const files_for_pdf = [
        'shared/img/cobalt_logo_white.svg',
        'shared/img/cobalt_logo_gray.svg',
        'shared/img/bison_and_hl_bw.svg',
    ];

    for(const f of files_for_pdf) {
        files_to_copy.push({from: path.resolve(base.rootPath, f), to: 'pdf/'});
    }

    return {
        ...config,
        plugins: [
            ...config.plugins,
            new HtmlWebpackPlugin({
                filename: 'index.html',
                template: `${projectPath}/src/index.ejs`,
                minify: false,
                chunks: ['public'],
            }),
            new HtmlWebpackPlugin({
                filename: 'app/index.html',
                template: `${projectPath}/src/app/index.ejs`,
                minify: false,
                chunks: ['app'],
            }),
            new HtmlWebpackPlugin({
                filename: 'reporting/index.html',
                template: `${projectPath}/src/reporting/index.ejs`,
                minify: false,
                chunks: ['reporting'],
            }),
            new HtmlWebpackPlugin({
                filename: 'dashboard_ssr/index.html',
                template: `${projectPath}/src/react/ssr/index.ejs`,
                minify: false,
                chunks: ['dashboard_ssr'],
            }),
            new WebpackShellPlugin({
                onBuildEnd: [`bash core-post-build.sh ${deployment}`],
            }),
            new CopyWebpackPlugin({patterns: files_to_copy}),
        ],

        devServer: {
            ...config.devServer,
            port: 8080,
            host: '0.0.0.0',
            public: 'bison.null',
            proxy: {
                '/pdf/styles.css': {
                    target: 'http://localhost:8080',
                    bypass: function(req) {
                        if(req.originalUrl === '/pdf/styles.css') {
                            return `/css/styles__${base.cssFileHash}.css`;
                        }
                    }
                },
            }
        },

        // The paths were we start parsing the app from. We have one entry point
        // for app and one for public. This gives us separate bundles for each of
        // them.
        entry: {
            public: path.resolve(projectPath, 'src/public.js'),
            app: path.resolve(projectPath, 'src/app.js'),
            reporting: path.resolve(projectPath, 'src/reporting.js'),
            dashboard_ssr: path.resolve(projectPath, 'src/react/ssr/index.js'),
        },
    };
};
