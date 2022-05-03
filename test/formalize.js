//
// formalize.js
//
// Created by Kristian Trenskow on 2018-12-12
//
// See license in LICENSE
//

import { expect } from 'chai';
import formalize from '../lib/formalize.js';
import SchemaError from '../lib/errors/schema.js';

const f = (...args) => {
	return () => {
		return formalize(...args);
	};
};

describe('schema', function() {
	describe('formalizer', function() {
		it('should throw an error if schema is garbage value.', () => {
			expect(f(123)).to.throw(SchemaError);
		});
		it('should throw error if required is not a String or Boolean.', () => {
			expect(f({ type: String, required: 123 })).to.throw(SchemaError);
		});
		it('should throw error if required is a String but not \'implicit\'.', () => {
			expect(f({ type: String, required: 'test' })).to.throw(SchemaError);
		});
		it('should throw error if type is String and match is non-RegExp.', () => {
			expect(f({ type: String, match: 'test' })).to.throw(SchemaError);
		});
		it('should throw error if type is String and enum is not an array.', () => {
			expect(f({ type: String, enum: 1 })).to.throw(SchemaError);
		});
		it('should throw error if type is String and enum has zero values.', async() => {
			expect(f({ type: String, enum: [] })).to.throw(SchemaError);
		});
		it('should throw error if type is String and enum is not array of strings.', () => {
			expect(f({ type: String, enum: ['this','is',1,'test'] })).to.throw(SchemaError);
		});
		it('should come back with enum intact', () => {
			expect(formalize({ type: String, enum: ['this', 'test']}))
				.to.have.property('enum')
				.to.have.property(1, 'test');
		});
		it('should come back with enum intact (custom error message)', () => {
			expect(formalize({ type: String, enum: [['this', 'test'], 'Must be this or test.'] }))
				.to.have.property('errors')
				.to.have.property('enum', 'Must be this or test.');
		});
		it('should throw an error if schema type cannot be determined.', () => {
			expect(f({ type: '' })).to.throw(SchemaError);
		});
		it('should throw an error if unknownKeys is not \'allow\', \'deny\' or \'remove\'.', () => {
			expect(f({ type: Object, unknownKeys: 'test' })).to.throw(SchemaError);
		});
		it('should throw an error if null is not \'allow\', \'deny\' or \'undefine\'.', () => {
			expect(f({ type: String, null: 'test' })).to.throw(SchemaError);
		});
		it('should throw an error if object schema is unknown type.', () => {
			expect(f({ type: Object, schema: RegExp })).to.throw(SchemaError);
		});
		it('should come back with an object shortcut expanded.', () => {
			let s = formalize({});
			expect(s).to.have.property('type');
			expect(s).to.have.property('schema').to.be.an('Object');
		});
		it('should come back with an array shortcut expanded.', () => {
			let s = formalize([{}]);
			expect(s).to.have.property('type');
			expect(s).to.have.property('schema').to.be.an('Object');
		});
		it('should come back with an Object shortcut expanded.', () => {
			expect(formalize(Object)).to.have.property('type').equal(Object);
		});
		it('should come back with an Array shortcut expanded.', () => {
			expect(formalize(Array)).to.have.property('type').equal(Array);
		});
		it('should come back with a String shortcut expanded.', () => {
			expect(formalize(String)).to.have.property('type').equal(String);
		});
		it('should come back with a Number shortcut expanded.', () => {
			expect(formalize(Number)).to.have.property('type').equal(Number);
		});
		it('should come back with a Boolean shortcut expanded.', () => {
			expect(formalize(Boolean)).to.have.property('type').equal(Boolean);
		});
		it('should come back with a Date shortcut expanded.', () => {
			expect(formalize(Date)).to.have.property('type').equal(Date);
		});
		it('should come back with required set to `implicit` if object has not specified required and a nested sub-schema is required.', () => {
			expect(formalize({
				'a': { type: String, required: true }
			})).to.have.property('required').to.be.equal('implicit');
		});
		it('should come back with required set to `implicit` if any deep sub-schema is required.', () => {
			expect(formalize({
				'a': {
					'b': {
						'c': { type: String, required: true }
					}
				}
			})).to.have.property('required').to.be.equal('implicit');
		});
		it('should come back with required set to `implicit` if root object has required in sub-schema.', () => {
			expect(formalize({
				'a': { type: String, required: true }
			})).to.have.property('required').to.be.equal('implicit');
		});
		it('should come back with required set to false if root object required is false and deep sub-schema is required.', () => {
			expect(formalize({
				type: Object,
				required: false,
				schema: {
					'a': {
						type: Object,
						required: 'implicit',
						schema: {
							'a': { type: String, required: true }
						}
					}
				}
			})).to.have.property('required').to.be.equal(false);
		});
		it('should come back with required set to true if array has deep nested required sub-schema.', () => {
			expect(formalize([
				{ type: String, required: true }
			])).to.have.property('required').to.be.equal(true);
		});
		it('should come back with required set to false if array is non-required but has deep nested required sub-schema.', () => {
			expect(formalize({
				type: Array,
				required: false,
				schema: {
					'a': { type: String, required: true }
				}
			})).to.have.property('required').to.be.equal(false);
		});
		it('should come back with an object with both keys formalized.', () => {
			expect(formalize({
				'a': { type: String, required: true },
				'b': { type: String, required: true }
			})).to.have.property('schema');
		});
		it('should come back with no error and match set if match is RegExp.', () => {
			expect(formalize({ type: String, match: /test/ })).to.have.property('match');
		});
		it('should come back with post wrapped in an array.', () => {
			expect(formalize({ post: function() {} })).to.have.property('post').to.be.an('array');
		});
		it('should come back with post as an array.', () => {
			expect(formalize({ post: [ function() {} ] })).to.have.property('post').to.be.an('array');
		});
		it('should come back with pre wrapped in an array.', () => {
			expect(formalize({ pre: function() {} })).to.have.property('pre').to.be.an('array');
		});
		it('should come back with pre as an array.', () => {
			expect(formalize({ pre: [ function() {} ] })).to.have.property('pre').to.be.an('array');
		});
		it('should come back with errors set on the errors key.', () => {
			let s = formalize({
				type: [Boolean, 'Boolean.'],
				required: [true, 'Required.']
			});
			expect(s).to.have.property('type').equal(Boolean);
			expect(s).to.have.property('required').equal(true);
			expect(s).to.have.property('errors').be.an('object');
			expect(s).to.have.property('errors').to.have.property('type').equal('Boolean.');
			expect(s).to.have.property('errors').to.have.property('required').equal('Required.');
		});
		it('should come back with equal formalized.', () => {
			expect(formalize({
				equal: '123'
			})).to.have.property('equal').equal('123');
		});
		it('should come back with a priority if non is provided.', () => {
			expect(formalize({
				type: Number
			})).to.have.property('priority').equal(10);
		});
		it ('should throw error if number range is not valid.', () => {
			expect(f({ type: Number, range: 'abc-abc' })).to.throw(SchemaError);
		});
		it ('should throw error if string len is negative.', () => {
			expect(f({ type: String, len: '-2-' })).to.throw(SchemaError);
		});
		it ('should throw error if array len is negative.', () => {
			expect(f({ type: Array, len: '-2-' })).to.throw(SchemaError);
		});
		it ('should throw error if validator is not supported', () => {
			expect(f({ type: String, nonExistingValidator: 'myValue' })).to.throw(SchemaError);
		});
		it ('should throw error if plugin validator fails formalizing.', () => {
			expect(f({ type: String, ensureCase: 'not-supported' }))
				.to.throw(SchemaError)
				.with.property('message', 'Only case types: `camel`, `domain`, `http`, `kebab`, `pascal`, `snake`, `title` are supported.');
		});
	});
});
