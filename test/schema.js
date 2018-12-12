'use strict';

const expect = require('chai').expect,
	formalize = require('../lib/formalize.js'),
	SchemaError = require('../lib/errors/SchemaError.js');

describe('schema', function() {
	describe('formalizer', function() {
		it('should throw an error if array shortcut contains no object.', () => {
			return expect(formalize([])).to.eventually.be.rejectedWith(SchemaError);
		});
		it('should throw an error if schema is garbage value.', () => {
			return expect(formalize(123)).to.eventually.be.rejectedWith(SchemaError);
		});
		it('should throw error if required is not a String or Boolean.', () => {
			return expect(formalize({ type: String, required: 123 })).to.eventually.be.rejectedWith(SchemaError);
		});
		it('should throw error if required is a String but not \'implicit\'.', () => {
			return expect(formalize({ type: String, required: 'test' })).to.eventually.be.rejectedWith(SchemaError);
		});
		it('should throw error if type is String and match is non-RegExp.', () => {
			return expect(formalize({ type: String, match: 'test' })).to.eventually.be.rejectedWith(SchemaError);
		});
		it('should throw error if type is String and enum is not an array.', () => {
			return expect(formalize({ type: String, enum: 1 })).to.eventually.be.rejectedWith(SchemaError);
		});
		it('should throw error if type is String and enum has zero valus.', async() => {
			return expect(formalize({ type: String, enum: [] })).to.eventually.be.rejectedWith(SchemaError);
		});
		it('should throw error if type is String and enum is not array of strings.', () => {
			return expect(formalize({ type: String, enum: ['this','is',1,'test'] })).to.eventually.be.rejectedWith(SchemaError);
		});
		it('should throw an error if schema type is unknown.', () => {
			return expect(formalize({ type: Error })).to.eventually.be.rejectedWith(SchemaError);
		});
		it('should throw an error if schema is not of supported type.', () => {
			return expect(formalize({ type: RegExp })).to.eventually.be.rejectedWith(SchemaError);
		});
		it('should throw an error if unknownKeys is not \'allow\', \'deny\' or \'remove\'.', () => {
			return expect(formalize({ type: Object, unknownKeys: 'test' })).to.eventually.be.rejectedWith(SchemaError);
		});
		it('should throw an error if array schema is unknown type.', () => {
			return expect(formalize({ type: Array, schema: RegExp })).to.eventually.be.rejectedWith(SchemaError);
		});
		it('should throw an error if object schema is unknown type.', () => {
			return expect(formalize({ type: Object, schema: RegExp })).to.eventually.be.rejectedWith(SchemaError);
		});
		it('should come back with an object shortcut expanded.', () => {
			let s = formalize({});
			return Promise.all([
				expect(s).to.eventually.have.property('type'),
				expect(s).to.eventually.have.property('schema').to.be.an('Object')
			]);
		});
		it('should come back with an array shortcut expanded.', () => {
			let s = formalize([{}]);
			return Promise.all([
				expect(s).to.eventually.have.property('type'),
				expect(s).to.eventually.have.property('schema').to.be.an('Object')
			]);
		});
		it('should come back with an Object shortcut expanded.', () => {
			return expect(formalize(Object)).to.eventually.have.property('type').equal(Object);
		});
		it('should come back with an Array shortcut expanded.', () => {
			return expect(formalize(Array)).to.eventually.have.property('type').equal(Array);
		});
		it('should come back with a String shortcut expanded.', () => {
			return expect(formalize(String)).to.eventually.have.property('type').equal(String);
		});
		it('should come back with a Number shortcut expanded.', () => {
			return expect(formalize(Number)).to.eventually.have.property('type').equal(Number);
		});
		it('should come back with a Boolean shortcut expanded.', () => {
			return expect(formalize(Boolean)).to.eventually.have.property('type').equal(Boolean);
		});
		it('should come back with a Date shortcut expanded.', () => {
			return expect(formalize(Date)).to.eventually.have.property('type').equal(Date);
		});
		it('should come back with required set to true if object has not specified required and a nested subschema is required.', () => {
			return expect(formalize({
				'a': { type: String, required: true }
			})).to.eventually.have.property('required').to.be.equal(true);
		});
		it('should come back with required set to true if any deep subschema is required.', () => {
			return expect(formalize({
				'a': {
					'b': {
						'c': { type: String, required: true }
					}
				}
			})).to.eventually.have.property('required').to.be.equal(true);
		});
		it('should come back with required set to true if root object has required in sub-schema.', () => {
			return expect(formalize({
				'a': { type: String, required: true }
			})).to.eventually.have.property('required').to.be.equal(true);
		});
		it('should come back with required set to false if root object required is false and deep subschema is required.', () => {
			return expect(formalize({
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
			})).to.eventually.have.property('required').to.be.equal(false);
		});
		it('should come back with required set to true if array has deep nested required subschema.', () => {
			return expect(formalize([
				{ type: String, required: true }
			])).to.eventually.have.property('required').to.be.equal(true);
		});
		it('should come back with required set to false if array is non-required but has deep nested required subschema.', () => {
			return expect(formalize({
				type: Array,
				required: false,
				schema: {
					'a': { type: String, required: true }
				}
			})).to.eventually.have.property('required').to.be.equal(false);
		});
		it('should come back with an object with both keys formalized.', () => {
			return expect(formalize({
				'a': { type: String, required: true },
				'b': { type: String, required: true }
			})).to.eventually.have.property('schema');
		});
		it('should come back with no error and match set if match is RegExp.', () => {
			return expect(formalize({ type: String, match: /test/ })).to.eventually.have.property('match');
		});
		it('should come back with post wrapped in an array.', () => {
			return expect(formalize({ post: function() {} })).to.eventually.have.property('post').to.be.an('array');
		});
		it('should come back with post as an array.', () => {
			return expect(formalize({ post: [ function() {} ] })).to.eventually.have.property('post').to.be.an('array');
		});
		it('should come back with errors set on the errors key.', () => {
			let s = formalize({
				type: [Boolean, 'Boolean.'],
				required: [true, 'Required.']
			});
			return Promise.all([
				expect(s).to.eventually.have.property('type').equal(Boolean),
				expect(s).to.eventually.have.property('required').equal(true),
				expect(s).to.eventually.have.property('errors').be.an('object'),
				expect(s).to.eventually.have.property('errors').to.have.property('type').equal('Boolean.'),
				expect(s).to.eventually.have.property('errors').to.have.property('required').equal('Required.')
			]);
		});
		it('should come back with any type set on the errors key.', () => {
			let s = formalize({
				type: [Boolean, {
					'en': 'Boolean.'
				}],
				required: [true, {
					'en': 'Required.'
				}]
			});
			return Promise.all([
				expect(s).to.eventually.have.property('type').equal(Boolean),
				expect(s).to.eventually.have.property('required').equal(true),
				expect(s).to.eventually.have.property('errors').be.an('object'),
				expect(s).to.eventually.have.property('errors').to.have.property('type').to.have.property('en').equal('Boolean.'),
				expect(s).to.eventually.have.property('errors').to.have.property('required').to.have.property('en').equal('Required.')
			]);
		});
		it('should come back with equal formalized.', () => {
			return expect(formalize({
				equal: '123'
			})).to.eventually.have.property('equal').equal('123');
		});
	});
});
