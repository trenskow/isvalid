'use strict';

const merge = require('merge');

const formalize = require('./formalize'),
	utils = require('./utils');

const mergeSchema = (dest, src, formalizeOptions) => {

	dest = formalize(dest, formalizeOptions);
	src = formalize(src, formalizeOptions);

	const destType = utils.typeName(dest.type).toLowerCase();
	const srcType = utils.typeName(src.type).toLowerCase();

	if (destType !== srcType) return src;

	switch (destType) {
	case 'object': {

		const destSchema = dest.schema;
		const srcSchema = src.schema;

		const allKeys = Object.keys(destSchema).concat(Object.keys(srcSchema)).reduce((result, current) => {
			if (!result.includes(current)) result.push(current);
			return result;
		}, []);

		let schema = {};

		allKeys.forEach((key) => {
			if (typeof destSchema[key] === 'undefined') schema[key] = srcSchema[key];
			else if (typeof srcSchema[key] === 'undefined') schema[key] = destSchema[key];
			else schema[key] = mergeSchema(destSchema[key], srcSchema[key]);
		});

		return formalize(merge(formalize.strip(dest), formalize.strip(src), { schema }), formalizeOptions);

	}
	case 'array': {
		return merge(dest, src, {
			schema: formalize(mergeSchema(formalize.strip(dest.schema), formalize.strip(src.schema)), formalizeOptions)
		});
	}
	default:
		return formalize(merge(formalize.strip(dest), formalize.strip(src)), formalizeOptions);
	}

};

exports = module.exports = (dest, formalizeOptions) => {
	return {
		with: (...sources) => {
			return sources.reduce((result, current) => {
				return mergeSchema(result, current, formalizeOptions);
			}, dest);
		}
	};
};
