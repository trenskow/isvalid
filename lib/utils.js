'use strict';

exports.typeName = function(obj) {
	return obj.name || (this.toString().match(/function\s*([^\s(]+)/) || [])[1];
};

exports.instanceTypeName = function(obj) {
	return exports.typeName(obj.constructor);
};
