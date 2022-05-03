//
// equals.js
//
// Created by Kristian Trenskow on 2014-06-06
//
// See license in LICENSE
//

import { instanceTypeName } from './utils.js';

const objectEquals = async (obj1, obj2) => {

	const keys1 = Object.keys(obj1);
	const keys2 = Object.keys(obj2);

	if (!await arrayEquals(keys1, keys2)) return false;

	return !(await Promise.all(keys1.map((key) => {
		return equals(obj1[key], obj2[key]);
	}))).some((result) => {
		return !result;
	});

};

const arrayEquals = async (obj1, obj2) => {

	if (obj1.length != obj2.length) return false;

	const sorted1 = obj1.sort();
	const sorted2 = obj2.sort();

	return !(await Promise.all(Object.keys(sorted1).map((idx) => {
		return equals(sorted1[idx], sorted2[idx]);
	}))).some((result) => {
		return !result;
	});

};

const equals = async (obj1, obj2) => {

	if ((obj1 && !obj2) || (!obj1 && obj2)) return false;
	if (typeof obj1 !== typeof obj2) return false;

	if (typeof obj1.is === 'function') return obj1.is(obj2);
	if (typeof obj2.is === 'function') return obj2.is(obj1);

	if (typeof obj1 === 'object') {
		if (instanceTypeName(obj1) === 'object') return await objectEquals(obj1, obj2);
		if (instanceTypeName(obj1) === 'array') return await arrayEquals(obj1, obj2);
	}

	return obj1 === obj2;

};

export default equals;
