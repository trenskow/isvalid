'use strict';

const
	merge = require('merge'),
	utils = require('./utils');

exports = module.exports = {
	_plugins: []
};

exports.use = function(plugin) {
	this._plugins.push(merge(plugin(utils), {
		_validatorsForType: function(type) {
			return Object.fromEntries(
				Object.entries(
					this.validatorsForType(type))
					.map(([key, value]) => {
						if (typeof value !== 'string') value = utils.typeName(value);
						return [key, !Array.isArray(value) ? [value] : value];
					})
			);
		}
	}));
};

exports.validatorsForType = function(type) {
	return Object.fromEntries(Object.entries(merge(...this._plugins
		.filter((plugin) => plugin.supportsType(type))
		.map((plugin) => plugin._validatorsForType(type)))));

};

exports.formalizeValidator = function(type, identifier, config) {
	return this._plugins
		.filter((plugin) => plugin.supportsType(type))
		.filter((plugin) => Object.keys(plugin._validatorsForType(type)).includes(identifier))
		.reduce((config, plugin) => {
			if (typeof plugin.formalizeValidator !== 'function') return config;
			return plugin.formalizeValidator(type, identifier, config);
		}, config);
};

exports.validate = async function(type, identifier, config, data) {

	const plugins = this._plugins
		.filter((plugin) => plugin.supportsType(type));

	for (const plugin of plugins) {
		data = await plugin.validate(type, identifier, config, data);
	}

	return data;

};
