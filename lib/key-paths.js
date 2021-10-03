'use strict';

const formalize = require('./formalize'),
	utils = require('./utils');

exports = module.exports = (schema, formalizeOptions) => {

	schema = formalize(schema, formalizeOptions);

	return {
		all: (types, keyPath = []) => {

			if (!types) types = [];
			if (!Array.isArray(types)) types = [types];

			types = types.map((type) => utils.typeName(type));

			let result = [];

			const typeName = utils.typeName(schema.type);

			if (types.length == 0 || types.includes(typeName)) result.push(keyPath.join('.'));

			switch (typeName) {
			case 'object':
				result = result.concat(...Object.keys(schema.schema).map((key) => {
					return exports(schema.schema[key]).all(types, keyPath.concat([key]));
				}));
				break;
			case 'array':
				result = result.concat(exports(schema.schema).all(types, keyPath));
				break;
			}

			let uniqueResult = [];
			for (let keyPath of result) {
				if (!uniqueResult.includes(keyPath)) uniqueResult.push(keyPath);
			}

			return uniqueResult;

		},
		get: (keyPath = '') => {

			if (!Array.isArray(keyPath)) keyPath = keyPath.split('.').filter((key) => key);

			if (keyPath.length === 0) return schema;

			const typeName = utils.typeName(schema.type).toLowerCase();

			switch (typeName) {
			case 'object':
				return exports(schema.schema[keyPath[0]]).get(keyPath.slice(1));
			case 'array':
				return exports(schema.schema).get(keyPath);
			default:
				throw new Error(`Cannot get key '${[keyPath[0]].concat(keyPath).join('.')}' from type '${typeName}'.`);
			}

		},
		set: (keyPath, newSchema) => {

			keyPath = keyPath || '';
			newSchema = formalize(newSchema, formalizeOptions);

			if (!Array.isArray(keyPath)) keyPath = keyPath.split('.').filter((key) => key);

			if (keyPath.length === 0) return newSchema;

			let parent = exports(schema).get(keyPath.slice(0, -1));

			if (utils.typeName(parent.type).toLowerCase() !== 'object') throw new Error('Cannot set keys on non-object types.');

			parent.schema[keyPath.slice(-1)[0]] = newSchema;

			return schema;

		}
	};

};
