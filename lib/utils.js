'use strict';

exports.typeName = function(obj) {
	if (typeof obj === 'string') return obj;
	return obj.name || (this.toString().match(/function\s*([^\s(]+)/) || [])[1];
};

exports.instanceTypeName = function(obj) {
	return exports.typeName(obj.constructor);
};

exports.isSameType = function(obj1, obj2) {
	if (typeof obj1 === 'undefined' || typeof obj2 === 'undefined') {
		return typeof obj1 === typeof obj2;
	}
	return obj1.toLowerCase() == obj2.toLowerCase();
};
