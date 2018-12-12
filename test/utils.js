'use strict';

module.exports = exports = {};

exports.testPromise = (method, desc, s, expects) => {
	it ('[promise] ' + desc, (done) => {
		method(s)
			.then((res) => {
				expects(res);
				done();
			})
			.catch((err) => {
				expects(err);
				done();
			});
	});
};
