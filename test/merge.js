//
// merge.js
//
// Created by Kristian Trenskow on 2021-10-02
//
// See license in LICENSE
//

import { expect } from 'chai';
import merge from '../lib/merge.js';

describe('merge', () => {
	it ('should come back with destination type.', () => {
		expect(merge({ type: String }).with({ type: Date })).to.have.property('type').equal(Date);
	});
	it ('should come back with merged validators', () => {
		expect(merge({ type: String, required: true }).with({ type: String })).to.have.property('required').equal(true);
		expect(merge({ type: String }).with({ type: String, required: true })).to.have.property('required').equal(true);
	});
	it ('should come back with array', () => {
		const result = merge([{ type: String }]).with([{ type: Date }]);
		expect(result).to.have.property('type').equal(Array);
		expect(result.schema).to.have.property('type').equal(Date);
	});
	it ('should come back with merged object.', () => {
		const result = merge({
			'this': { type: String },
			'is': { type: String}
		}).with({
			'is': { type: String, required: true },
			'a': { type: Number },
			'test': { type: Date}
		});
		expect(result).to.be.an('object');
		expect(Object.keys(result.schema)).to.eql(['this','is','a','test']);
		expect(result.schema.is).to.have.property('required').equal(true);
	});
});
