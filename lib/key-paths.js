'use strict';

const formalize = require('./formalize'),
	utils = require('./utils');

exports = module.exports = (schema, types, keyPath = []) => {

	schema = formalize(schema);

	if (!types) types = [];
	if (!Array.isArray(types)) types = [types];

	types = types.map((type) => utils.typeName(type));

	let result = [];

	const typeName = utils.typeName(schema.type);

	if (types.length == 0 || types.includes(typeName)) result.push(keyPath.join('.'));

	switch (typeName) {
	case 'object':
		result = result.concat(...Object.keys(schema.schema).map((key) => {
			return exports(schema.schema[key], types, keyPath.concat([key]));
		}));
		break;
	case 'array':
		result = result.concat(exports(schema.schema, types, keyPath));
		break;
	}

	let uniqueResult = [];
	for (let keyPath of result) {
		if (!uniqueResult.includes(keyPath)) uniqueResult.push(keyPath);
	}

	return uniqueResult;

};
