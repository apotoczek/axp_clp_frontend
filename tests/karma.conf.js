const baseConfig = require('./base.conf.js');

module.exports = function(config) {
    config.set(baseConfig(config));
};
