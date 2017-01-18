'use strict';

module.exports.asap = exports.asap = function(fnc) {

	/* jshint -W067 */
	var global = (1,eval)('this');
	/* jshint +W067 */

	var args = Array.prototype.splice.call(arguments, 1);
	var method = global.setImmediate || (global.process || {}).nextTick || global.setTimeout;

	method(function() {
		fnc.apply(this, args);
	});

};

exports.name = function(obj) {
	if (obj.name) return obj.name;
	return (obj.name = (this.toString().match(/function\s*([^\s(]+)/) || [])[1]);
};
