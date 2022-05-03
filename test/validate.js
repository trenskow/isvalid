//
// validate.js
//
// Created by Kristian Trenskow on 2014-06-06
//
// See license in LICENSE
//

import { expect, assert } from 'chai';
import ValidationError from '../lib/errors/validation.js';
import isvalid from '../index.js';
import { typeName, instanceTypeName, isSameType } from '../lib/utils.js';

class Test {
	constructor() {
		this.test = 'test';
	}
}

const commonTests = {
	type: function(type, validData, invalidData) {
		describe('type', function() {
			it(`should come back with an error if input is not a(n) ${typeName(type)}.`, () => {
				return expect(isvalid(invalidData, type))
					.to.eventually.be.rejectedWith(`Is not of type ${typeName(type)}.`)
					.and.to.be.instanceOf(ValidationError)
					.and.to.have.property('validator', 'type');
			});
			it(`should come back with no error if input is a(n) ${typeName(type)}.`, () => {
				return expect(isvalid(validData, {
					type: type
				})).to.eventually.satisfy((data) => {
					return isSameType(instanceTypeName(data), typeName(type)) || (typeof type !== 'string' && data instanceof type);
				});
			});
			describe('#errors', function() {
				it(`should come back with an error of custom message if input is not a(n) ${typeName(type)}.`, () => {
					return expect(isvalid(invalidData, {
						type: type,
						errors: {
							type: 'Type custom error message.'
						}}))
						.to.eventually.be.rejectedWith('Type custom error message.')
						.and.to.be.instanceOf(ValidationError)
						.and.has.property('validator', 'type');
				});
			});
		});
	},
	required: function(type, validData) {
		describe('required', function() {
			it('should come back with an error if required and input is undefined.', () => {
				return expect(isvalid(undefined, {
					type: type,
					required: true}))
					.to.eventually.be.rejectedWith('Data is required.')
					.and.to.be.instanceOf(ValidationError)
					.and.to.have.property('validator', 'required');
			});
			it('should come back with no error if required and input is present', () => {
				return expect(isvalid(validData, {
					type: type,
					required: true
				})).to.eventually.satisfy((data) => {
					return isSameType(instanceTypeName(data), typeName(type)) || (typeof type !== 'string' && data instanceof type);
				});
			});
			it('should prioritize concrete over defaults.', () => {
				return expect(isvalid(undefined, {
					type: type,
					required: false
				}, { defaults: { required: true }})).to.eventually.equal(undefined);
			});
			describe('#errors', function() {
				it('should come back with an error with custom message if required and input is undefined.', () => {
					return expect(isvalid(undefined, {
						type: type,
						required: true,
						errors: {
							required: 'Required custom error message.'
						}}))
						.to.eventually.be.rejectedWith('Required custom error message.')
						.and.to.be.instanceOf(ValidationError)
						.and.has.property('validator', 'required');
				});
			});
		});
	},
	null: function(type) {
		describe('null', function() {
			it('should come back with an error if required and does not allow null and input is null.', () => {
				return expect(isvalid(null, {
					type: type,
					null: 'deny',
					required: true}))
					.to.eventually.be.rejectedWith('Cannot be null.')
					.and.to.be.instanceOf(ValidationError)
					.and.to.have.property('validator', 'null');
			});
			it('should come back with no error if required and null is allowed and input is null.', () => {
				return expect(isvalid(null, {
					type: type,
					required: true,
					null: 'allow'
				})).to.eventually.be.null;
			});
			it('should come back with no error if required and null is allowed and input is null.', () => {
				return expect(isvalid(null, {
					type: type,
					required: true,
					null: 'allow'
				})).to.eventually.be.null;
			});
			it('should come back with no error and undefined if null is set to undefine input and input is null.', () => {
				return expect(isvalid(null, {
					type: type,
					null: 'undefine'
				})).to.eventually.be.undefined;
			});
		});
	},
	default: function(type, validData) {
		describe('default', function() {
			it('should call default if default is function and returns a promise (async function).', () => {
				return expect(isvalid(undefined, { type: type, default: async () => {
					return validData;
				}})).to.eventually.satisfy((data) => {
					return isSameType(instanceTypeName(data), typeName(type)) || (typeof type !== 'string' && data instanceof type);
				});
			});
			it('should call default if default is a function.', () => {
				return expect(isvalid(undefined, { type: type, default: () => {
					return validData;
				}})).to.eventually.satisfy((data) => {
					return isSameType(instanceTypeName(data), typeName(type)) || (typeof type !== 'string' && data instanceof type);
				});
			});
			it('should call default if default is a value.', () => {
				return expect(isvalid(undefined, { type: type, default: validData })).to.eventually.satisfy((data) => {
					return isSameType(instanceTypeName(data), typeName(type)) || (typeof type !== 'string' && data instanceof type);
				});
			});
			it('should call default with options if options are provided.', () => {
				return expect(isvalid(undefined, { type: type, default: (options) => {
					return options.value;
				}}, { value: validData })).to.eventually.equal(validData);
			});
			it('should allow `null` as a valid value.', () => {
				return expect(isvalid(undefined, { type: type, default: null})).to.eventually.equal(null);
			});
		});
	},
	equal: function(type, validData, invalidData) {
		describe('equal', function()  {
			it('should come back with data if data is equal.', () => {
				return expect(isvalid(validData, {
					equal: validData
				})).to.eventually.equal(validData);
			});
			it('should come back with error if data does not equal.', () => {
				return expect(isvalid(invalidData, {
					equal: validData}))
					.to.eventually.be.rejectedWith(`Data does not equal ${validData}.`)
					.and.to.be.instanceOf(ValidationError)
					.and.to.have.property('validator', 'equal');
			});
		});
	},
	post: function() {
		describe('post', function() {
			it('should call function if post is specified.', () => {
				return expect(isvalid('test', {
					post: function(data) {
						expect(data).to.be.a('String').equals('test');
						return 'test2';
					}
				})).to.eventually.be.a('String').equals('test2');
			});
			it('should call function if synchronous post is specified.', () => {
				return expect(isvalid(undefined, {
					post: function() {
						return 'test';
					}
				})).to.eventually.be.a('String').equal('test');
			});
			it('should convert errors thrown in synchronous post function.', () => {
				return expect(isvalid('test', {
					post: function() {
						throw new Error('an error');
					}}))
					.to.eventually.be.rejectedWith('an error')
					.and.to.be.instanceOf(ValidationError)
					.and.has.property('message', 'an error');
			});
			it('should return original object if synchronous function doesn\'t return.', () => {
				return expect(isvalid('test', {
					post: function() {}
				})).to.eventually.be.a('String').equal('test');
			});
			it('should accept async functions', () => {
				return expect(isvalid('test', {
					post: async function() {}
				})).to.eventually.be.a('String').equal('test');
			});
			it('should reformat err if post is specified and returns an error.', () => {
				return expect(isvalid({}, {
					post: async function() {
						throw new Error('an error');
					}}))
					.to.eventually.be.rejectedWith('an error')
					.and.to.be.instanceOf(ValidationError)
					.and.has.property('validator', 'post');
			});
			it('should pass on post schema options if specified.', () => {
				return expect(isvalid({}, {
					post: function(obj, schema, { options }) {
						expect(options).to.have.property('test').to.be.equal(true);
					}
				}, {
					test: true
				})).to.not.be.rejected;
			});
			it('should first validate using pre and then validations,', () => {
				let s = isvalid({
					'low': 0
				}, {
					type: Object,
					schema: {
						low: { type: Number },
						high: { type: Number, default: 10 }
					},
					pre: function(obj) {
						expect(obj.high).to.be.undefined;
					}
				});
				return Promise.all([
					expect(s).to.eventually.have.property('low').equal(0),
					expect(s).to.eventually.have.property('high').equal(10)
				]);
			});
			it('should first validate using validators and then post.', () => {
				let s = isvalid({
					'low': 0
				}, {
					type: Object,
					schema: {
						'low': { type: Number },
						'high': { type: Number, default: 10 },
					},
					post: function(obj) {
						expect(obj.high).to.equal(10);
					}
				});
				return Promise.all([
					expect(s).to.eventually.have.property('low').equal(0),
					expect(s).to.eventually.have.property('high').equal(10)
				]);
			});
			it('should call all post validators in array.', () => {
				return expect(isvalid(0, {
					post: [
						function(data) {
							return data + 1;
						},
						function(data) {
							return Promise.resolve(data + 2);
						},
						function(data) {
							return data + 3;
						},
						function(data) {
							return Promise.resolve(data + 4);
						}
					]
				})).to.eventually.equal(10);
			});
			it('should come back with error if thrown underway.', () => {
				return expect(isvalid(0, {
					post: [
						function(data) {
							return data + 1;
						},
						function() {
							throw new Error('Stop here');
						},
						function(data) {
							assert(false, 'This post function should not have been called.');
							return data + 3;
						}
					]}))
					.to.eventually.be.rejectedWith('Stop here')
					.and.to.be.instanceOf(ValidationError)
					.and.have.property('validator', 'post');
			});
			it('should have the full validated data so far as a parameter', () => {
				return expect(isvalid({ why: {} }, {
					'awesome': { type: Boolean, priority: 1, default: true },
					'why': {
						'reason': { type: 'string', default: 'It just is!' },
						'who': { type: 'string', post: (_, schema, { data }) => {
							expect(data.awesome).to.be.true;
							return 'isvalid';
						} }
					}
				})).to.eventually.have.property('why').to.have.property('who').to.equal('isvalid');
			});
			it ('should accept `null` as a valid return value.', () => {
				return expect(isvalid('', { type: 'string', post: () => null})).to.eventually.equal(null);
			});
		});
	},
	all: function(type, validData, invalidData) { var self = this;
		['type', 'required', 'null', 'default', 'equal', 'post'].forEach(function(test) {
			self[test](type, validData, invalidData);
		});
	}
};

describe('validate', function() {
	it('should throw an error if schema is not provided.', () => {
		return expect(isvalid({})).to.eventually.be.rejectedWith(Error);
	});
	it('should allow for custom key path in options', () => {
		return expect(isvalid({}, { type: 'string' }, { keyPath: 'custom.keyPath' }))
			.to.eventually.be.rejectedWith(Error)
			.to.have.property('keyPath')
			.to.have.property(0)
			.to.equal('custom');
	});
	describe('type conversion', function() {
		it('should convert string values into numbers if string contains a number.', () => {
			return expect(isvalid('123.987', Number)).to.eventually.equal(123.987);
		});
		it('should convert string values into numbers if string contains a negative number.', () => {
			return expect(isvalid('-123.987', Number)).to.eventually.equal(-123.987);
		});
		it('should convert string values into numbers if string contains a negative E notation.', () => {
			return expect(isvalid('5.8e-7', Number)).to.eventually.equal(5.8e-7);
		});
		it('should convert string values into numbers if string contains a positive E notation.', () => {
			return expect(isvalid('5.8e+7', Number)).to.eventually.equal(5.8e+7);
		});
		it('should come back with error if string is supplied - but not a number.', () => {
			return expect(isvalid('abc', Number))
				.to.eventually.be.rejectedWith('Is not of type number.')
				.and.to.be.instanceOf(ValidationError)
				.and.to.have.property('validator', 'type');
		});
		it('should come back with error if wrong E notation is supplied - but not a number.', () => {
			return expect(isvalid('12e', Number))
				.to.eventually.be.rejectedWith('Is not of type number.')
				.and.to.be.instanceOf(ValidationError)
				.and.to.have.property('validator', 'type');
		});
		it('should come back with no error and validData set to true if input is string with \'True\'.', () => {
			return expect(isvalid('True', Boolean)).to.eventually.equal(true);
		});
		it('should come back with no error and validData set to false if input is string with \'False\'.', () => {
			return expect(isvalid('False', Boolean)).to.eventually.equal(false);
		});
		it('should come back with error and if string is supplied - but not \'true\' or \'false\'.', () => {
			return expect(isvalid('123', Boolean))
				.to.eventually.be.rejectedWith('Is not of type boolean.')
				.and.to.be.instanceOf(ValidationError)
				.and.to.have.property('validator', 'type');
		});
		it('should come back with no error and validData set to a Date if input is string with an ISO date.', () => {
			return expect(
				isvalid('2014-10-19T02:24:42.395Z', Date)
					.then((date) => {
						return date.getTime();
					})
			).to.eventually.equal(new Date('2014-10-19T02:24:42.395Z').getTime());
		});
		it('should come back with error and if string is supplied - but not ISO date.', () => {
			return expect(isvalid('19/10/14 2:24:42', Date))
				.to.eventually.be.rejectedWith('Is not of type date.')
				.and.to.be.instanceOf(ValidationError)
				.and.to.have.property('validator', 'type');
		});
	});
	describe('object validator', function() {
		commonTests.all(Object, {}, 123);
		it('should come back with same input if sub-schema is not provided.', () => {
			return expect(isvalid({}, {})).to.eventually.eql({});
		});
		it('should come out with same input as output if keys can validate.', () => {
			let s = isvalid({
				awesome: true,
				why: 'it just is!'
			}, {
				awesome: Boolean,
				why: 'string'
			});
			return Promise.all([
				expect(s).to.eventually.have.property('awesome').equals(true),
				expect(s).to.eventually.have.property('why').equals('it just is!')
			]);
		});
		it('should come back with no error and validData if object shortcut is empty.', () => {
			return expect(isvalid({}, {})).to.eventually.be.an('Object');
		});
		describe('priority', function() {
			it('should validate higher priority before validating others', () => {
				let validated = false;
				return expect(isvalid({}, {
					awesome: { type: Boolean, post: () => {
						expect(validated).to.be.true;
						return true;
					}, },
					why: { type: 'string', priority: 1, default: 'it just is!', post: () => {
						validated = true;
					} }
				})).to.eventually.have.property('why').equals('it just is!');
			});
		});
		describe('unknownKeys', function() {
			it('should come back with unknown keys intact if unknownKeys is \'allow\'.', () => {
				return expect(isvalid({
					awesome: true,
					why: 'it just is!'
				}, {
					type: Object,
					unknownKeys: 'allow',
					schema: {
						awesome: Boolean
					}
				})).to.eventually.have.property('why').equals('it just is!');
			});
			it('should come back with unknown keys intact if unknownKeys is provided as \'allow\' in options defaults.', () => {
				return expect(isvalid({
					awesome: true,
					why: 'it just is!'
				}, {
					awesome: Boolean
				}, {
					defaults: {
						unknownKeys: 'allow'
					}
				})).to.eventually.have.property('why').equals('it just is!');
			});
			it('should come back with error if there are unknown keys and unknownKeys is not set.', () => {
				return expect(isvalid({
					awesome: true,
					why: 'it just is!'
				}, {
					awesome: Boolean}))
					.to.eventually.be.rejectedWith('Unknown key.')
					.and.to.be.instanceOf(ValidationError)
					.and.has.property('validator', 'unknownKeys');
			});
			it('should come back with error if there are unknown keys and unknownKeys is set to \'deny\'.', () => {
				return expect(isvalid({
					awesome: true,
					why: 'it just is!'
				}, {
					type: Object,
					unknownKeys: 'deny',
					schema: {
						awesome: Boolean
					}}))
					.to.eventually.be.rejectedWith('Unknown key.')
					.and.to.be.instanceOf(ValidationError)
					.and.has.property('validator', 'unknownKeys');
			});
			it('should come back with keys removed if unknown keys and unknownKeys is set to \'remove\'.', () => {
				return expect(isvalid({
					awesome: true,
					why: 'it just is!'
				}, {
					type: Object,
					unknownKeys: 'remove',
					schema: {
						awesome: Boolean
					}
				})).to.eventually.not.have.property('why');
			});
			describe('required', function() {
				it ('should come back with object key path when implicit.', () => {
					return expect(isvalid(undefined, {
						'myObject': {
							'myKey': {
								type: String,
								required: true
							}
						}}))
						.to.eventually.be.rejectedWith('Data is required.')
						.and.to.be.instanceOf(ValidationError)
						.and.have.property('keyPath').to.have.members(['myObject', 'myKey']);
				});
			});
			describe('#errors', function() {
				it('should come back with error of post message if there are unknown keys and unknownKeys is set to \'deny\'.', () => {
					return expect(isvalid({
						awesome: true,
						why: 'it just is!'
					}, {
						type: Object,
						unknownKeys: 'deny',
						schema: {
							awesome: Boolean
						},
						errors: {
							unknownKeys: 'Not allowed.'
						}}))
						.to.eventually.be.rejectedWith('Not allowed.')
						.and.to.be.instanceOf(ValidationError)
						.and.have.property('message', 'Not allowed.');
				});
			});
		});
	});
	describe('array validator', function() {
		commonTests.all(Array, [], 123);
		it('should come back with same input if no sub-schema is provided.', () => {
			return expect(isvalid([], [])).to.eventually.eql([]);
		});
		it('should come back with same input as output if array can validate.', () => {
			let s = isvalid([{
				awesome: true,
				why: 'it just is!'
			}], [{
				awesome: Boolean,
				why: 'string'
			}]);
			return Promise.all([
				expect(s).to.eventually.be.an('Array').of.length(1),
				expect(s).to.eventually.to.have.property(0).and.to.have.property('awesome').equals(true),
				expect(s).to.eventually.to.have.property(0).and.to.have.property('why').equals('it just is!')
			]);
		});
		it('should come back with no error and an empty array when supplying empty array.', () => {
			return expect(isvalid([], [{}])).to.eventually.have.length(0);
		});
		describe('#errors', function() {
			it ('should come back with error and index of key path properly set.', () => {
				return expect(isvalid([1], {
					type: Array,
					schema: {
						type: String,
					}}, { keyPath: 'root'}))
					.to.eventually.be.rejectedWith('Is not of type string.')
					.and.to.be.instanceOf(ValidationError)
					.and.have.property('keyPath').eql(['root', 0]);
			});
		});
		describe('len', function() {
			it('should come back with same input as output if within ranges of len.', () => {
				return expect(isvalid([1,2], {
					type: Array,
					len: '2-',
					schema: Number
				})).to.eventually.be.an('Array').of.length(2);
			});
			it('should come back with error if array length is not within ranges of len.', () => {
				return expect(isvalid([], {
					type: Array,
					len: '2-',
					schema: {}}))
					.to.eventually.be.rejectedWith('Array length is not within range of \'2-\'.')
					.and.to.be.instanceOf(ValidationError)
					.and.have.property('validator', 'len');
			});
			describe('#errors', function() {
				it('should come back with error of post message if array length is not within ranges of len.', () => {
					return expect(isvalid([], {
						type: Array,
						len: '2-',
						schema: {},
						errors: {
							len: 'Not within range.'
						}}))
						.to.eventually.be.rejectedWith('Not within range.')
						.and.to.be.instanceOf(ValidationError)
						.and.have.property('validator', 'len');
				});
			});
		});
		describe('unique', function() {
			it('should come back with error if array of objects is not unique.', () => {
				return expect(isvalid([{
					awesome: true
				},{
					awesome: true
				}], {
					type: Array,
					unique: true,
					schema: { awesome: Boolean }}))
					.to.eventually.be.rejectedWith('Array is not unique.')
					.and.to.be.instanceOf(ValidationError)
					.and.have.property('validator', 'unique');
			});
			it('should come back with no error if array of strings is unique.', () => {
				return expect(isvalid(['This', 'is', 'an', 'array'], {
					type: Array,
					unique: true,
					schema: 'string'
				})).to.eventually.have.length(4);
			});
			describe('#errors', function() {
				it('should come back with error of post message if array of objects is not unique.', () => {
					return expect(isvalid([{
						awesome: true
					},{
						awesome: true
					}], {
						type: Array,
						unique: true,
						schema: { awesome: Boolean },
						errors: {
							unique: 'Not a set.'
						}}))
						.to.eventually.be.rejectedWith('Not a set.')
						.and.to.be.instanceOf(ValidationError)
						.and.to.have.property('validator', 'unique');
				});
			});
		});
		describe('autowrap', function() {
			it('should come back with non-array wrapped in array', () => {
				return expect(isvalid({
					test: true
				}, {
					type: Array,
					autowrap: true,
					schema: {
						test: Boolean
					}
				})).to.eventually.be.an('array').and.to.have.property(0).and.to.have.property('test', true);
			});
			it('should come back with type error if autowrap and not matching sub-schema.', () => {
				return expect(isvalid({
					test: 'Not a boolean'
				}, {
					type: Array,
					autowrap: true,
					schema: {
						test: Boolean
					}}))
					.to.eventually.be.rejectedWith('Is not of type boolean.')
					.and.to.be.instanceOf(ValidationError)
					.and.have.property('validator', 'type');
			});
			it('should come back with type error if no autowrap and matching sub-schema.', () => {
				return expect(isvalid({
					test: true
				}, [{
					test: Boolean}]))
					.to.eventually.be.rejectedWith('Is not of type array.')
					.and.to.be.instanceOf(ValidationError)
					.and.have.property('validator', 'type');
			});
			it('should prioritize concrete over defaults.', () => {
				return expect(isvalid(true, {
					type: Array,
					autowrap: false
				}, { defaults: { autowrap: true }}))
					.to.eventually.be.rejectedWith('Is not of type array.')
					.and.to.be.instanceOf(ValidationError)
					.and.have.property('validator', 'type');
			});
		});
	});
	describe('string validator', function() {
		commonTests.all(String, 'string', 123);
		it('should come back with no error and input same as output if string is supplied.', () => {
			return expect(isvalid('123', 'string')).to.eventually.be.a('String').equals('123');
		});
		describe('trim', function() {
			it('should come back with trimmed string when trim is set to true.', () => {
				return expect(isvalid('\t123abc   ', { type: 'string', trim: true }))
					.to.eventually.equal('123abc');
			});
			it('should come back with trimmed string when trim option is true.', () => {
				return expect(isvalid('\t123abc   ', 'string', { defaults: { trim: true }}))
					.to.eventually.equal('123abc');
			});
			it('should come back with the string untrimmed if trim is not specified', () => {
				return expect(isvalid('\t123abc   ', 'string'))
					.to.eventually.equal('\t123abc   ');
			});
			it('should prioritize concrete over defaults.', () => {
				return expect(isvalid(' 123', {
					type: 'string',
					trim: false
				}, { defaults: { trim: true }})).to.eventually.equal(' 123');
			});
		});
		describe('match', function() {
			it('should come back with an error if string does not match RegExp.', () => {
				return expect(isvalid('123', { type: 'string', match: /^[a-z]+$/ }))
					.to.eventually.be.rejectedWith('Does not match expression ^[a-z]+$.')
					.and.to.be.instanceOf(ValidationError)
					.and.to.have.property('validator', 'match');
			});
			it('should come back with no error and validData should match input string when match is specified and input matches.', () => {
				return expect(isvalid('123', { type: 'string', match: /^[0-9]+$/ }))
					.to.eventually.equal('123');
			});
			describe('#errors', function() {
				it('should come back with an error of post message if string does not match RegExp.', () => {
					return expect(isvalid('123', {
						type: 'string',
						match: /^[a-z]+$/,
						errors: {
							match: 'Must be a string of letters from a to z.'
						}}))
						.to.eventually.be.rejectedWith('Must be a string of letters from a to z.')
						.and.to.be.instanceOf(ValidationError)
						.and.have.property('validator', 'match');
				});
			});
		});
		describe('enum', function() {
			it('should come back with an error if string is not in enum.', () => {
				return expect(isvalid('123', { type: 'string', enum: ['this','test'] }))
					.to.eventually.be.rejectedWith('Possible values are "this" and "test".')
					.and.to.be.instanceOf(ValidationError)
					.and.have.property('validator', 'enum');
			});
			it('should come back with no error if string is in enum.', () => {
				return expect(isvalid('test', { type: 'string', enum: ['this','test'] }))
					.to.eventually.be.a('String').equal('test');
			});
			describe('#errors', function() {
				it('should come back with an error of post message if string is not in enum.', () => {
					return expect(isvalid('123', {
						type: 'string',
						enum: ['this','is','a','test'],
						errors: {
							enum: 'Must be a word from the sentence "this is a test".'
						}}))
						.to.eventually.be.rejectedWith('Must be a word from the sentence "this is a test".')
						.and.to.be.instanceOf(ValidationError)
						.and.have.property('validator', 'enum');
				});
			});
		});
		describe('length', function() {
			it('should come back with an error if string is not with range.', () => {
				return expect(isvalid('123', { type: 'string', len: '-2'}))
					.to.eventually.be.rejectedWith('String length is not within range of -2')
					.and.to.be.instanceOf(ValidationError)
					.and.have.property('validator', 'len');
			});
			it('should come back with no error if string is within range.', () => {
				return expect(isvalid('123', {
					type: 'string',
					len: '2-'
				}));
			});
			describe('#errors', function() {
				it ('should come back with a custom error message', () => {
					return expect(isvalid('123', {
						type: 'string',
						len: ['-2', 'My custom error']}))
						.to.eventually.be.rejectedWith('My custom error')
						.and.to.be.instanceOf(ValidationError)
						.and.have.property('validator', 'len');
				});
			});
		});
	});
	describe('number validator', function() {
		commonTests.all(Number, 123, []);
		it('should come back with no error and input same as output if number is supplied.', () => {
			return expect(isvalid(123, Number))
				.to.eventually.equal(123);
		});
		describe('range', function() {
			it('should come back with error if input is not within range.', () => {
				return expect(isvalid(1, { type: Number, range: '2-4' }))
					.to.eventually.be.rejectedWith('Not within')
					.and.to.be.instanceOf(ValidationError)
					.and.to.have.property('validator', 'range');
			});
			it('should come back with no error and output same as input if within range.', () => {
				return expect(isvalid(3, { type: Number, range: '2-4' }))
					.to.eventually.equal(3);
			});
			describe('#errors', function() {
				it('should come back with error of post message if input is not within range.', () => {
					return expect(isvalid(1, {
						type: Number,
						range: '2-4',
						errors: {
							range: 'Must be between 2 and 4.'
						}}))
						.to.eventually.be.rejectedWith('Must be between 2 and 4.')
						.and.to.be.instanceOf(ValidationError)
						.and.to.have.property('validator', 'range');
				});
			});
		});
		describe('float', function() {
			it('should throw error if non-integers are not allowed.', () => {
				return  expect(isvalid(2.2, { type: Number, float: 'deny' }))
					.to.eventually.be.rejectedWith('Number must be an integer.')
					.and.to.be.instanceOf(ValidationError)
					.and.have.property('validator', 'float');
			});
			it ('should come back with non-integer values if they are allowed.', () => {
				return expect(isvalid(2.2, { type: Number })).to.eventually.equal(2.2);
			});
			it ('should come back with number rounded if `float` is set to `round`.', () => {
				return expect(isvalid(2.5, { type: Number, float: 'round' })).to.eventually.equal(3);
			});
			it ('should come back with number ceiled if `float` is set to `ceil`.', () => {
				return expect(isvalid(2.2, { type: Number, float: 'ceil' })).to.eventually.equal(3);
			});
			it ('should come back with number floored if `float` is set to `floor`.', () => {
				return expect(isvalid(2.8, { type: Number, float: 'floor' })).to.eventually.equal(2);
			});
		});
	});
	describe('date validator', function() {
		commonTests.all(Date, new Date(), 123);
	});
	describe('other validator', function() {
		commonTests.all(Test, new Test(), 123);
	});
	describe('plugin validators', function() {
		it ('should throw error if casing does not match.', function() {
			return expect(isvalid('my-string', { type: String, ensureCase: 'camel' }))
				.to.eventually.rejectedWith('Is not camel case.')
				.and.to.be.instanceOf(ValidationError)
				.and.to.have.property('validator', 'ensureCase');
		});
		it ('should throw error with custom message if casing does not match.', function() {
			return expect(isvalid('my-string', { type: String, ensureCase: ['camel', 'Something is not right!'] }))
				.to.eventually.rejectedWith('Something is not right!')
				.and.to.be.instanceOf(ValidationError)
				.and.to.have.property('validator', 'ensureCase');
		});
		it ('should come back with correct value.', function() {
			return expect(isvalid('myString', { type: String, ensureCase: 'camel' }))
				.to.eventually.equal('myString');
		});
	});
});
