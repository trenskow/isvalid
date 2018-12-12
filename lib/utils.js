'use strict';

exports.name = function(obj) {
	return obj.name || (this.toString().match(/function\s*([^\s(]+)/) || [])[1];
};
