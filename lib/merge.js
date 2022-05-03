//
// merge.js
//
// Created by Kristian Trenskow on 2021-10-02
//
// See license in LICENSE
//

import merge from 'merge';

import formalize, { strip } from './formalize.js';
import { typeName } from './utils.js';

const mergeSchema = (dest, src, formalizeOptions) => {

	dest = formalize(dest, formalizeOptions);
	src = formalize(src, formalizeOptions);

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

		return formalize(merge(strip(dest), strip(src), { schema }), formalizeOptions);

	}
	case 'array': {
		return merge(dest, src, {
			schema: formalize(mergeSchema(strip(dest.schema), strip(src.schema)), formalizeOptions)
		});
	}
	default:
		return formalize(merge(strip(dest), strip(src)), formalizeOptions);
	}

};

export default (dest, formalizeOptions) => {
	return {
		with: (...sources) => {
			return sources.reduce((result, current) => {
				return mergeSchema(result, current, formalizeOptions);
			}, dest);
		}
	};
};
