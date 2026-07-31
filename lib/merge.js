//
// merge.js
//
// Created by Kristian Trenskow on 2021-10-02
//
// See license in LICENSE
//

import merge from '@trenskow/merge';

import formalize, { strip } from './formalize.js';
import { typeName } from './utils.js';

const mergeSchema = (dest, src, formalizeOptions, options = {}) => {

	dest = (options.formalize || formalize)(dest, formalizeOptions);
	src = (options.formalize || formalize)(src, formalizeOptions);

	const destType = typeName(dest.type).toLowerCase();
	const srcType = typeName(src.type).toLowerCase();

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

		return (options.formalize || formalize)(merge.strategy({
			array: 'second'
		})(strip(dest), strip(src), { schema }), formalizeOptions);

	}
	case 'array': {
		return merge(dest, src, {
			schema: (options.formalize || formalize)(mergeSchema(strip(dest.schema), strip(src.schema)), formalizeOptions)
		});
	}
	default:
		return (options.formalize || formalize)(merge(strip(dest), strip(src)), formalizeOptions);
	}

};

export default (dest, formalizeOptions, options = {}) => {
	return {
		with: (...sources) => {
			return sources.reduce((dest, src) => {
				return mergeSchema(dest, src, formalizeOptions, options);
			}, dest);
		}
	};
};
