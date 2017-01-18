'use strict';

module.exports.asap = exports.asap = function(fnc) {

	var args = Array.prototype.splice.call(arguments, 1);
	var method = setImmediate || (process || {}).nextTick || setTimeout;

	method(function() {
		fnc.apply(this, args);
	});

};

exports.name = function(obj) {
	if (obj.name) return obj.name;
	return (obj.name = (this.toString().match(/function\s*([^\s(]+)/) || [])[1]);
};
