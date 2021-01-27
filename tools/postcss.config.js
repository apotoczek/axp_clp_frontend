module.exports = ({ file, options, env }) => ({
    plugins: {
        'autoprefixer': {},
        'doiuse': {},
        'postcss-preset-env': {},
        'cssnano': env === 'production' || env === 'staging' ? {} : false,
    }
})
