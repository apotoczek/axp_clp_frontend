const baseConfig = require('./base.conf.js');

module.exports = function(config) {
    config.set({
        ...baseConfig(config),
        singleRun: true,
        reporters: ['dots', 'junit', 'coverage-istanbul'],
        junitReporter: {
            outputFile: 'test-results.xml',
        },
        coverageIstanbulReporter: {
            reports: ['cobertura'],
            fixWebpackSourcePaths: true,
        },
    });
};
