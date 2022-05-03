//
// key-paths.js
//
// Created by Kristian Trenskow on 2021-08-18
//
// See license in LICENSE
//

import { expect } from 'chai';
import keyPaths from '../lib/key-paths.js';

describe('keyPaths', () => {
	it ('should come back with empty key paths', () => {
		expect(keyPaths({
			type: Boolean
		}).all()).to.eql(['']);
	});
	it ('should come back with three key paths.', () => {
		expect(keyPaths({
			'first': Boolean,
			'second': String,
			'third': Number
		}).all()).to.eql(['','first','second','third']);
	});
	it ('should come back with three key paths.', () => {
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
		}).all()).to.eql(['','first','first.first','first.second','second','second.first','second.second','third']);
	});
	it ('should come back with three key paths.', () => {
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
		}).all(Object)).to.eql(['','first','second']);
	});
	it ('should come back with two key paths.', () => {
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
		}).all(Boolean)).to.eql(['first.first','second.first']);
	});
	it ('should come back with three key paths.', () => {
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
		}).all([Boolean, Array])).to.eql(['first','first.first','second.first']);
	});
	it ('should come back with object at key (with intermediate array).', () => {
		expect(keyPaths({
			'first': [{
				'first': Boolean,
				'second': String
			}]
		}).get('first.second')).to.have.property('type').equal(String);
	});
	it ('should come back with object at key.', () => {
		expect(keyPaths({
			'second': {
				'first': Boolean,
				'second': String
			}
		}).get('second.second')).to.have.property('type').equal(String);
	});
	it ('should come back with root.', () => {
		expect(keyPaths(String).get('')).to.have.property('type').equal(String);
	});
	it ('should come back with new validators set', () => {
		expect(keyPaths({
			'test': String
		}).set('my', Number)).to.have.property('schema').to.have.property('my').to.have.property('type').to.equal(Number);
	});
});
