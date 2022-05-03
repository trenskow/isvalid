//
// utils.js
//
// Created by Kristian Trenskow on 2017-01-18
//
// See license in LICENSE
//

export function typeName(obj) {
	if (typeof obj === 'string') return obj;
	return (obj.name || (this.toString().match(/function\s*([^\s(]+)/) || [])[1]).toLowerCase();
}

export function instanceTypeName(obj) {
	return typeName(obj.constructor);
}

export function isSameType(obj1, obj2) {
	if (typeof obj1 === 'undefined' || typeof obj2 === 'undefined') {
		return typeof obj1 === typeof obj2;
	}
	return typeName(obj1).toLowerCase() == typeName(obj2).toLowerCase();
}
