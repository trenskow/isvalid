//
// validate.js
//
// Created by Kristian Trenskow on 2014-06-06
//
// See license in LICENSE
//

import ValidationError from './errors/validation.js';
import { testIndex } from './ranges.js';
import unique from './unique.js';
import formalize from './formalize.js';
import { isSameType, instanceTypeName, typeName } from './utils.js';
import equals from './equals.js';

const checkBoolValue = (name, schema, defaults) => {
	if (schema[name] === undefined) return defaults[name] === true;
	return schema[name] === true;
};

const customErrorMessage = (str, ...args) => {
	if (typeof str === 'function') return str(...args);
	return str;
};

const validateObject = async (data, schema, options, keyPath, validatedData) => {

	if (data) {

		if (typeof data !== 'object') {
			throw new ValidationError(
				keyPath,
				schema._nonFormalizedSchema,
				'type',
				(schema.errors || {}).type || customErrorMessage(((options.errorMessages || {}).object || {}).type || 'Is not of type object.')
			);
		}

		// If there is no schema we just return the object.
		if (typeof schema.schema === 'undefined') return data;

		// Find unknown keys
		for (let key in data) {
			if (schema.schema[key] === undefined) {
				switch (schema.unknownKeys || options.defaults.unknownKeys) {
				case 'allow':
					break;
				case 'remove':
					delete data[key];
					break;
				default:
					throw new ValidationError(
						keyPath.concat([key]),
						schema._nonFormalizedSchema,
						'unknownKeys',
						(schema.errors || {}).unknownKeys || customErrorMessage(((options.errorMessages || {}).object || {}).unknownKeys || 'Unknown key.')
					);
				}
			}
		}

		// Get keys and sort by priority
		let keys = Object.keys(schema.schema).sort((key1, key2) => {
			return schema.schema[key1].priority - schema.schema[key2].priority;
		});

		for (let key of keys) {
			let value = await validateAny(data[key], schema.schema[key], options, keyPath.concat([key]), validatedData);
			if (typeof value !== 'undefined') {
				data[key] = value;
			}
		}

	}

	return data;

};

const validateArray = async (data, schema, options, keyPath, validatedData) => {

	if (data) {

		if (!Array.isArray(data)) {

			if (checkBoolValue('autowrap', schema, options.defaults)) {
				return await validateArray([data], schema, options, keyPath, validatedData);
			} else {
				throw new ValidationError(
					keyPath,
					schema._nonFormalizedSchema,
					'type',
					(schema.errors || {}).type || customErrorMessage(((options.errorMessages || {}).array || {}).type || 'Is not of type array.')
				);

			}
		}

		if (typeof schema.schema !== 'undefined') {
			data = await Promise.all(data.map((data, idx) => {
				return validateAny(data, schema.schema, options, keyPath.concat([idx]), validatedData);
			}));
		}

		if ((schema.len || options.defaults.len) && !testIndex((schema.len || options.defaults.len), data.length)) {
			throw new ValidationError(
				keyPath,
				schema._nonFormalizedSchema,
				'len',
				(schema.errors || {}).len || customErrorMessage(((options.errorMessages || {}).array || {}).len || ((len) => `Array length is not within range of '${len}'.`), schema._nonFormalizedSchema.len)
			);
		}

		if ((schema.unique || options.defaults.unique) && !await unique(data)) {
			throw new ValidationError(
				keyPath,
				schema._nonFormalizedSchema,
				'unique',
				(schema.errors || {}).unique || customErrorMessage(((options.errorMessages || {}).array || {}).unique || 'Array is not unique.')
			);
		}

	}

	return data;

};

const validateString = async (data, schema, options, keyPath) => {

	if (typeof data !== 'string') {
		throw new ValidationError(
			keyPath,
			schema._nonFormalizedSchema,
			'type',
			(schema.errors || {}).type || customErrorMessage(((options.errorMessages || {}).string || {}).type || 'Is not of type string.')
		);
	}

	if (checkBoolValue('trim', schema, options.defaults)) {
		data = data.replace(/^\s+|\s+$/g,'');
	}

	if (schema.len || options.defaults.len) {
		if (!testIndex(schema.len || options.defaults.len, data.length)) {
			throw new ValidationError(
				keyPath,
				schema._nonFormalizedSchema,
				'len',
				(schema.errors || {}).len || customErrorMessage(((options.errorMessages || {}).string || {}).len || ((len) => `String length is not within range of ${len}`), schema._nonFormalizedSchema.len)
			);
		}
	}

	if (schema.match || options.defaults.match) {
		// We are guaranteed that match is a RegExp because the formalizer has tested it.
		if (!(schema.match || options.defaults.match).test(data)) {
			throw new ValidationError(
				keyPath,
				schema._nonFormalizedSchema,
				'match',
				(schema.errors || {}).match || customErrorMessage(((options.errorMessages || {}).string || {}).match || ((source) => `Does not match expression ${source}.`), schema.match.source)
			);
		}
	}

	// Validate enums
	if ((schema.enum || options.defaults.enum) && (schema.enum || options.defaults.enum).indexOf(data) == -1) {
		throw new ValidationError(
			keyPath,
			schema._nonFormalizedSchema,
			'enum',
			(schema.errors || {}).enum || customErrorMessage(((options.errorMessages || {}).string || {}).enum || ((values) => {
				return `Possible values are ${values.map(function(val) {
					return '"' + val + '"';
				}).reduce(function(prev, cur, idx, arr) {
					return prev + (idx == arr.length - 1 ? ' and ' : ', ') + cur;
				})}.`;
			}), schema.enum)
		);
	}

	return data;

};

const validateNumber = async (data, schema, options, keyPath) => {

	if (typeof data === 'string' && /^-?[0-9]+(?:\.[0-9]+)?(?:[eE](?:-|\+)?[0-9]+)?$/.test(data)) {
		data = parseFloat(data);
	}

	if (typeof data !== 'number' || isNaN(data)) {

		throw new ValidationError(
			keyPath,
			schema._nonFormalizedSchema,
			'type',
			(schema.errors || {}).type || customErrorMessage(((options.errorMessages || {}).number || {}).type || 'Is not of type number.')
		);

	}

	if (schema.range || options.defaults.range) {
		if (!testIndex(schema.range || options.defaults.range, data)) {
			throw new ValidationError(
				keyPath,
				schema._nonFormalizedSchema,
				'range',
				(schema.errors || {}).range || customErrorMessage(((options.errorMessages || {}).number || {}).range || ((range) => `Not within range of ${range}.`), schema._nonFormalizedSchema.range)
			);
		}
	}

	if (schema.float || options.defaults.float) {
		if (!Number.isInteger(data)) {
			switch (schema.float) {
			case 'deny':
				throw new ValidationError(
					keyPath,
					schema._nonFormalizedSchema,
					'float',
					(schema.errors || {}).float || customErrorMessage(((options.errorMessages || {}).number || {}).float || 'Number must be an integer.'));
			default:
				data = Math[schema.float](data);
				break;
			}
		}
	}

	return data;

};

const validateBoolean = async (data, schema, options, keyPath) => {

	if (typeof data === 'string' && /^true|false$/i.test(data)) {
		data = /^true$/i.test(data);
	}

	if (typeof data !== 'boolean') {
		throw new ValidationError(
			keyPath,
			schema._nonFormalizedSchema,
			'type',
			(schema.errors || {}).type || customErrorMessage(((options.errorMessages || {}).boolean || {}).type || 'Is not of type boolean.')
		);
	}

	return data;

};

const validateDate = async (data, schema, options, keyPath) => {

	if (typeof data === 'string') {

		data = new Date(data);

		if (isNaN(data.getDate())) {
			throw new ValidationError(
				keyPath,
				schema._nonFormalizedSchema,
				'type',
				(schema.errors || {}).type || customErrorMessage(((options.errorMessages || {}).date || {}).type || 'Is not of type date.')
			);
		}

	}

	if (!isSameType('date', instanceTypeName(data))) {
		throw new ValidationError(
			keyPath,
			schema._nonFormalizedSchema,
			'type',
			(schema.errors || {}).type || customErrorMessage(((options.errorMessages || {}).date || {}).type || 'Is not of type date.')
		);
	}

	return data;

};

const validateOther = async (data, schema, options, keyPath) => {

	if (!isSameType(typeName(schema.type), instanceTypeName(data))) {
		throw new ValidationError(
			keyPath,
			schema._nonFormalizedSchema,
			'type',
			(schema.errors || {}).type || customErrorMessage(((options.errorMessages || {}).other || {}).type || ((type) => `Is not of type ${type}.`), typeName(schema.type))
		);
	}

	return data;

};

const validateCustom = async (phase, data, schema, options, keyPath, validatedData) => {

	if (!schema[phase]) return data;

	for (let idx = 0 ; idx < schema[phase].length ; idx++) {
		try {
			let result = await Promise.resolve(schema[phase][idx](data, schema, { options, keyPath, data: validatedData }));
			if (typeof result !== 'undefined') data = result;
		} catch (error) {
			throw ValidationError.fromError(keyPath, schema._nonFormalizedSchema, phase, error);
		}
	}

	return data;

};

const validatePlugins = async (phase, data, schema, options, keyPath) => {

	const plugins = Object.keys(schema.plugins || {})
		.filter((key) => schema.plugins[key].phase === phase)
		.map((key) => [key, schema.plugins[key].validator]);

	for (let idx = 0 ; idx < plugins.length ; idx++) {
		const [key, validator] = plugins[idx];
		try {
			data = await validator(data, schema[key], key, schema.type);
		} catch (error) {
			throw new ValidationError(
				keyPath,
				schema._nonFormalizedSchema,
				key,
				(schema.errors || {})[key] || customErrorMessage((options.errorMessages || {})[key] || error.message));
		}
	}

	return data;

};

const validatePre = async (data, schema, options, keyPath, validatedData) => {
	data = await validateCustom('pre', data, schema, options, keyPath, validatedData);
	return await validatePlugins('pre', data, schema, options, keyPath);
};

const validatePost = async (data, schema, options, keyPath, validatedData) => {
	data = await validatePlugins('post', data, schema, options, keyPath);
	return await validateCustom('post', data, schema, options, keyPath, validatedData);
};

const validateAny = async (data, schema, options, keyPath, validatedData) => {

	// If schema is not yet formalized - formalize it and come back.
	if (schema._nonFormalizedSchema === undefined) {
		return await validateAny(data, formalize(schema, options), options, keyPath, validatedData);
	}

	data = await validatePre(data, schema, options, keyPath, validatedData);

	if (typeof data === 'undefined' || data === null) {
		if (data === null) {
			let nul = schema.null || options.defaults.null || 'deny';
			if (nul === 'undefine') data = undefined;
			else if (nul === 'allow') return await validatePost(data, schema, options, keyPath, validatedData);
			else throw new ValidationError(
				keyPath,
				schema._nonFormalizedSchema,
				'null',
				(schema.errors || {}).null || customErrorMessage((options.errorMessages || {}).null || 'Cannot be null.')
			);
		}
		if (typeof schema.default !== 'undefined') {
			let data = schema.default;
			if (typeof data === 'function') {
				data = data(options, validatedData);
			}
			data = await Promise.resolve(data);
			return await validatePost(data, schema, options, keyPath, validatedData);
		}
		if (schema.required === 'implicit') {
			data = {};
		} else if (checkBoolValue('required', schema, options.defaults)) {
			throw new ValidationError(
				keyPath,
				schema._nonFormalizedSchema,
				'required',
				(schema.errors || {}).required || customErrorMessage((options.errorMessages || {}).required || 'Data is required.')
			);
		} else {
			return await validatePost(data, schema, options, keyPath, validatedData);
		}
	}

	if (typeof schema.equal !== 'undefined' || typeof options.defaults.equal !== 'undefined') {
		if (!await equals(schema.equal || options.defaults.equal, data)) {
			throw new ValidationError(
				keyPath,
				schema._nonFormalizedSchema,
				'equal',
				(schema.errors || {}).equal || customErrorMessage((options.errorMessages || {}).equal || ((value) => `Data does not equal ${value}.`), schema.equal)
			);
		}
	}

	if (schema.type !== undefined) {
		switch (typeName(schema.type).toLowerCase()) {
		case 'object':
			data = await validateObject(data, schema, options, keyPath, validatedData);
			break;
		case 'array':
			data = await validateArray(data, schema, options, keyPath, validatedData);
			break;
		case 'string':
			data = await validateString(data, schema, options, keyPath);
			break;
		case 'number':
			data = await validateNumber(data, schema, options, keyPath);
			break;
		case 'boolean':
			data = await validateBoolean(data, schema, options, keyPath);
			break;
		case 'date':
			data = await validateDate(data, schema, options, keyPath);
			break;
		default:
			data = await validateOther(data, schema, options, keyPath);
			break;
		}
	}

	return await validatePost(data, schema, options, keyPath, validatedData);

};

export default async (data, schema, options = {}, keyPath = '') => {

	if (typeof schema === 'undefined') throw new Error('Missing parameter schema.');

	options.keyPath = options.keyPath || keyPath;
	if (!Array.isArray(options.keyPath)) options.keyPath = options.keyPath.split('.');
	options.defaults = options.defaults || {};

	return await validateAny(data, schema, options, options.keyPath, data);

};
