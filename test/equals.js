//
// equals.js
//
// Created by Kristian Trenskow on 2015-08-30
//
// See license in LICENSE
//

import { expect } from 'chai';
import equals from '../lib/equals.js';

describe('equals', function() {
	it('should return false if data is not of the same type (null).', () => {
		return expect(equals(1, null)).to.eventually.eventually.be.false;
	});
	it('should return false if data is not of the same type.', () => {
		return expect(equals(1, '1')).to.eventually.be.false;
	});
	it('should return true if strings are equal.', () => {
		return expect(equals('This is a string', 'This is a string')).to.eventually.be.true;
	});
	it('should return false if string are equal', () => {
		return expect(equals('This is a string', 'This is another string')).to.eventually.be.false;
	});
	it('should return true if numbers are equal.', () => {
		return expect(equals(1, 1)).to.eventually.be.true;
	});
	it('should return false if numbers are not equal.', () => {
		return expect(equals(1, 2)).to.eventually.be.false;
	});
	it('should return true if booleans are equal.', () => {
		return expect(equals(false, false)).to.eventually.be.true;
	});
	it('should return false if booleans are not equal.', () => {
		return expect(equals(true, false)).to.eventually.be.false;
	});
	const d = new Date();
	it('should return true if dates are equal.', () => {
		return expect(equals(d, d)).to.eventually.be.true;
	});
	const d1 = new Date();
	const d2 = new Date();
	d2.setYear(d2.getFullYear() + 1);
	it('should return false if dates are not equal.', () => {
		return expect(equals(d1, d2)).to.eventually.be.false;
	});
	it ('should return true if objects are equal.', () => {
		return expect(equals({
			awesome: true
		}, {
			awesome: true
		})).to.eventually.be.true;
	});
	it ('should return false if object are not equal.', () => {
		return expect(equals({
			awesome: true
		}, {
			awesome: false
		})).to.eventually.be.false;
	});
	it('should return true if arrays are equal.', () => {
		return expect(equals(['This','is','an','array'], ['This','is','an','array'])).to.eventually.be.true;
	});
	it('should return false if arrays are not equal.', () => {
		return expect(equals(['This','is','an','array'], ['This','is','another','array'])).to.eventually.be.false;
	});
	it ('should return true if objects with arrays are equal.', () => {
		return expect(equals({
			obj: ['This','is','an','array']
		}, {
			obj: ['This','is','an','array']
		})).to.eventually.be.true;
	});
	it ('should return false if objects with arrays are not equal.', () => {
		return expect(equals({
			obj: ['This','is','an','array']
		}, {
			obj: ['This','is','another','array']
		})).to.eventually.be.false;
	});
});
