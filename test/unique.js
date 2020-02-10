/*jshint expr: true*/
'use strict';

const expect = require('chai').expect,
	unique = require('../lib/unique.js');

describe('unique', function() {
	it('should return false if array of objects is not unique.', () => {
		return expect(unique([{test:{ing:123}},{test:{ing:123}}])).to.eventually.be.false;
	});
	it('should return true if array of objects is unique.', () => {
		return expect(unique([{test:{ing:123}},{test:{ing:456}}])).to.eventually.be.true;
	});
});
