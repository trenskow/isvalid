'use strict';

const
	utils = require('./utils');

exports = module.exports = {
	_plugins: []
};

exports.use = (plugin) => {
	exports._plugins.push(plugin(utils));
};
