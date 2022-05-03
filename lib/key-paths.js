//
// key-paths.js
//
// Created by Kristian Trenskow on 2021-08-18
//
// See license in LICENSE
//

import formalize from './formalize.js';
import { typeName as _typeName } from './utils.js';

const keyPaths = (schema, formalizeOptions) => {

	schema = formalize(schema, formalizeOptions);

	return {
		all: (types, options, keyPath = [], level = 0) => {

			if (typeof types === 'object' && types !== null && !Array.isArray(types)) {
				options = types;
				types = [];
			}

			options = options || {};
			options.maxDepth = typeof options.maxDepth !== 'undefined' ? options.maxDepth : Infinity;

			if (typeof options.maxDepth !== 'number') throw new Error('Maximum depth must be a number.');

			if (!types) types = [];
			if (!Array.isArray(types)) types = [types];

			types = types.map((type) => _typeName(type));

			let result = [];

			const typeName = _typeName(schema.type);

			if (types.length == 0 || types.includes(typeName)) result.push(keyPath.join('.'));

			if (level < options.maxDepth) {

				switch (typeName) {
				case 'object':
					result = result.concat(...Object.keys(schema.schema).map((key) => {
						return keyPaths(schema.schema[key]).all(types, options, keyPath.concat([key]), level + 1);
					}));
					break;
				case 'array':
					result = result.concat(keyPaths(schema.schema).all(types, options, keyPath, level + 1));
					break;
				}

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

			const typeName = _typeName(schema.type).toLowerCase();

			switch (typeName) {
			case 'object':
				return keyPaths(schema.schema[keyPath[0]]).get(keyPath.slice(1));
			case 'array':
				return keyPaths(schema.schema).get(keyPath);
			default:
				throw new Error(`Cannot get key '${[keyPath[0]].concat(keyPath).join('.')}' from type '${typeName}'.`);
			}

		},
		set: (keyPath, newSchema) => {

			keyPath = keyPath || '';
			newSchema = formalize(newSchema, formalizeOptions);

			if (!Array.isArray(keyPath)) keyPath = keyPath.split('.').filter((key) => key);

			if (keyPath.length === 0) return newSchema;

			let parent = keyPaths(schema).get(keyPath.slice(0, -1));

			if (_typeName(parent.type).toLowerCase() !== 'object') throw new Error('Cannot set keys on non-object types.');

			parent.schema[keyPath.slice(-1)[0]] = newSchema;

			return schema;

		}
	};

};

export default keyPaths;
