'use strict';

const expect = require('chai').expect,
	keyPaths = require('../lib/key-paths.js');

describe('keyPaths', () => {
	it ('should come back with empty key paths', () => {
		expect(keyPaths({
			type: Boolean
		})).to.eql(['']);
	});
	it ('should come back with three key paths.', () => {
		expect(keyPaths({
			'first': Boolean,
			'second': String,
			'third': Number
		})).to.eql(['','first','second','third']);
	});
	it ('should come back with three eight paths.', () => {
		expect(keyPaths({
			'first': [{
				'first': Boolean,
				'second': String
			}],
			'second': {
				'first': Boolean,
				'second': String
			},
			'third': Number
		})).to.eql(['','first','first.first','first.second','second','second.first','second.second','third']);
	});
	it ('should come back with three eight paths.', () => {
		expect(keyPaths({
			'first': [{
				'first': Boolean,
				'second': String
			}],
			'second': {
				'first': Boolean,
				'second': String
			},
			'third': Number
		}, Object)).to.eql(['','first','second']);
	});
	it ('should come back with three eight paths.', () => {
		expect(keyPaths({
			'first': [{
				'first': Boolean,
				'second': String
			}],
			'second': {
				'first': Boolean,
				'second': String
			},
			'third': Number
		}, Boolean)).to.eql(['first.first','second.first']);
	});
	it ('should come back with three eight paths.', () => {
		expect(keyPaths({
			'first': [{
				'first': Boolean,
				'second': String
			}],
			'second': {
				'first': Boolean,
				'second': String
			},
			'third': Number
		}, [Boolean, Array])).to.eql(['first','first.first','second.first']);
	});
});
