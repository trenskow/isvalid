'use strict';

const ValidationError = require('./errors/ValidationError.js'),
	ranges = require('./ranges.js'),
	unique = require('./unique.js'),
	formalize = require('./formalize.js'),
	utils = require('./utils.js'),
	equals = require('./equals.js');

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
				(schema.errors || {}).type || customErrorMessage(((options.errorMessages || {}).object || {}).type || 'Is not of type Object.')
			);
		}

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
					(schema.errors || {}).type || customErrorMessage(((options.errorMessages || {}).array || {}).type || 'Is not of type Array.')
				);

			}
		}

		data = await Promise.all(data.map((data, idx) => {
			return validateAny(data, schema.schema, options, keyPath.concat([idx]), validatedData);
		}));

		if ((schema.len || options.defaults.len) && !ranges.testIndex((schema.len || options.defaults.len), data.length)) {
			throw new ValidationError(
				keyPath,
				schema._nonFormalizedSchema,
				'len',
				(schema.errors || {}).len || customErrorMessage(((options.errorMessages || {}).array || {}).len || ((len) => `Array length is not within range of '${len}'.`), schema.len)
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
			(schema.errors || {}).type || customErrorMessage(((options.errorMessages || {}).string || {}).type || 'Is not of type String.')
		);
	}

	if (checkBoolValue('trim', schema, options.defaults)) {
		data = data.replace(/^\s+|\s+$/g,'');
	}

	if (schema.len || options.defaults.len) {
		if (!ranges.testIndex(schema.len || options.defaults.len, data.length)) {
			throw new ValidationError(
				keyPath,
				schema._nonFormalizedSchema,
				'len',
				(schema.errors || {}).len || customErrorMessage(((options.errorMessages || {}).string || {}).len || ((len) => `String length is not within range of ${len}`), schema.len)
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
			(schema.errors || {}).type || customErrorMessage(((options.errorMessages || {}).number || {}).type || 'Is not of type Number.')
		);

	}

	if (schema.range || options.defaults.range) {
		if (!ranges.testIndex(schema.range || options.defaults.range, data)) {
			throw new ValidationError(
				keyPath,
				schema._nonFormalizedSchema,
				'range',
				(schema.errors || {}).range || customErrorMessage(((options.errorMessages || {}).number || {}).range || ((range) => `Not within range of ${range}.`), schema.range)
			);
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
			(schema.errors || {}).type || customErrorMessage(((options.errorMessages || {}).boolean || {}).type || 'Is not of type Boolean.')
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
				(schema.errors || {}).type || customErrorMessage(((options.errorMessages || {}).date || {}).type || 'Is not of type Date.')
			);
		}

	}

	if (!utils.isSameType('Date', utils.instanceTypeName(data))) {
		throw new ValidationError(
			keyPath,
			schema._nonFormalizedSchema,
			'type',
			(schema.errors || {}).type || customErrorMessage(((options.errorMessages || {}).date || {}).type || 'Is not of type Date.')
		);
	}

	return data;

};

const validateOther = async (data, schema, options, keyPath) => {

	if (!utils.isSameType(utils.typeName(schema.type), utils.instanceTypeName(data))) {
		throw new ValidationError(
			keyPath,
			schema._nonFormalizedSchema,
			'type',
			(schema.errors || {}).type || customErrorMessage(((options.errorMessages || {}).other || {}).type || ((type) => `Is not of type ${type}.`), utils.typeName(schema.type))
		);
	}

	return data;

};

const validateCustom = async (type, data, schema, options, keyPath, validatedData) => {

	if (!schema[type]) return data;

	for (let idx = 0 ; idx < schema[type].length ; idx++) {
		try {
			let result = await Promise.resolve(schema[type][idx](data, schema, { options, keyPath, data: validatedData }));
			if (typeof result !== 'undefined') data = result;
		} catch (error) {
			throw ValidationError.fromError(keyPath, schema._nonFormalizedSchema, type, error);
		}
	}

	return data;

};

const validatePre = async (data, schema, options, keyPath, validatedData) => {
	return await validateCustom('pre', data, schema, options, keyPath, validatedData);
};

const validatePost = async (data, schema, options, keyPath, validatedData) => {
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
			if (checkBoolValue('allowNull', schema, options.defaults)) {
				return await validatePost(data, schema, options, keyPath, validatedData);
			}
			throw new ValidationError(
				keyPath,
				schema._nonFormalizedSchema,
				'allowNull',
				(schema.errors || {}).allowNull || customErrorMessage((options.errorMessages || {}).allowNull || 'Cannot be null.')
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
		if (options.throwDeepKeyOnImplicit && schema.required === 'implicit') {
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
		switch (utils.typeName(schema.type).toLowerCase()) {
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

module.exports = exports = async (data, schema, options = {}, keyPath = '') => {

	if (typeof schema === 'undefined') throw new Error('Missing parameter schema.');

	options.keyPath = options.keyPath || keyPath;
	if (!Array.isArray(options.keyPath)) options.keyPath = options.keyPath.split('.');
	options.defaults = options.defaults || {};

	return await validateAny(data, schema, options, options.keyPath, data);

};
