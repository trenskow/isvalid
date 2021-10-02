'use strict';

const expect = require('chai').expect,
	merge = require('../lib/merge.js');

describe('merge', () => {
	it ('should come back with destination type.', () => {
		expect(merge({ type: String }, { type: Date })).to.have.property('type').equal(Date);
	});
	it ('should come back with merged validators', () => {
		expect(merge({ type: String, required: true }, { type: String })).to.have.property('required').equal(true);
		expect(merge({ type: String }, { type: String, required: true })).to.have.property('required').equal(true);
	});
	it ('should come back with array', () => {
		const result = merge([{ type: String }], [{ type: Date }]);
		expect(result).to.have.property('type').equal(Array);
		expect(result.schema).to.have.property('type').equal(Date);
	});
	it ('should come back with merged object.', () => {
		const result = merge({
			'this': { type: String },
			'is': { type: String}
		}, {
			'is': { type: String, required: true },
			'a': { type: Number },
			'test': { type: Date}
		});
		expect(result).to.be.an('object');
		expect(Object.keys(result.schema)).to.eql(['this','is','a','test']);
		expect(result.schema.is).to.have.property('required').equal(true);
	});
});