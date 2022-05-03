//
// ranges.js
//
// Created by Kristian Trenskow on 2014-06-06
//
// See license in LICENSE
//

import { expect } from 'chai';
import { formalize, testIndex } from '../lib/ranges.js';

function r(range, value) {
	const formalized = formalize(range);
	return testIndex(formalized, value);
}

describe('ranges', function() {
	it ('should throw an error if ranges is not a string.', function() {
		expect(function() {
			r([123], 1);
		}).to.throw(Error);
	});
	it ('should throw no error if ranges is a number.', function() {
		expect(function() {
			r(1, 1);
		}).not.to.throw(Error);
	});
	it ('should throw error if ranges is string but format is invalid.', function() {
		expect(function() {
			r('abc', 1);
		}).to.throw(Error);
	});
	it ('should throw error if index is not set.', function() {
		expect(function() {
			r(1);
		});
	});
	it ('should return true if index is within range.', function() {
		expect(r('-2,4-6,8,10-', 2)).to.equal(true);
	});
	it ('should return false if index is not within range.', function() {
		expect(r('-2,4-6,8,10-', 3)).to.equal(false);
	});
	it ('should allow negative values wrapped in parentheses.', function() {
		expect(r('(-2)-', -1)).to.equal(true);
	});
	it ('should allow for decimal values.', function() {
		expect(r('(-2.2)-2.2', 0.1)).to.equal(true);
	});
});
