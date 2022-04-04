'use strict';

const merge = require('merge'),
	SchemaError = require('./errors/schema.js'),
	utils = require('./utils.js');

const finalize = (formalizedSchema, nonFormalizedSchema) => {

	// Add the old non-formalized schema - for preventing
	// redundant formalization and for usage by the
	// validator when sending validation errors.
	//
	// Make the property innumerable.
	Object.defineProperty(formalizedSchema, '_nonFormalizedSchema', {
		value: nonFormalizedSchema,
		enumerable: false,
		writable: false
	});

	return formalizedSchema;

};

const formalizeObject = (formalizedSchema, nonFormalizedSchema, options) => {

	formalizedSchema.schema = formalizedSchema.schema || {};

	if (utils.instanceTypeName(formalizedSchema.schema) !== 'object') throw new SchemaError(formalizedSchema.schema, 'Object schemas must be an object.');

	// Build new formalized schema into this.
	let formalizedSubSchema = {};

	// We iterate through all keys.
	Object.keys(formalizedSchema.schema)
		.forEach((key) => {
			formalizedSubSchema[key] = formalizeAny(formalizedSchema.schema[key], options);
		});

	formalizedSchema.schema = formalizedSubSchema;

	if (typeof formalizedSchema.required === 'undefined') {
		if (Object.keys(formalizedSubSchema).some((key) => formalizedSubSchema[key].required === true || formalizedSubSchema[key].required === 'implicit')) {
			formalizedSchema.required = 'implicit';
		}
	}

	return finalize(formalizedSchema, nonFormalizedSchema);

};

const formalizeArray = (formalizedSchema, nonFormalizedSchema, options) => {

	// formalizedSchema has been pre-processed by formalizeAny, so
	// we only need to formalize the sub-schema.

	// If no sub-schema is provided we consider the schema final.
	if (typeof formalizedSchema.schema === 'undefined') return finalize(formalizedSchema, nonFormalizedSchema);

	formalizedSchema.schema = formalizeAny(formalizedSchema.schema, options);

	// Apply implicit required if sub-schema has required data.
	if (typeof(formalizedSchema.required) === 'undefined' || formalizedSchema.required === 'implicit') {
		if (formalizedSchema.schema.required === true) formalizedSchema.required = true;
	}

	return finalize(formalizedSchema, nonFormalizedSchema);

};

const formalizeAny = (schema, options = {}) => {

	// If schema is already formalized we just call back.
	if (typeof schema._nonFormalizedSchema !== 'undefined') return schema;

	if (!schema.type && !schema.post && !schema.pre && !schema.equal) {
		if ('object' == utils.instanceTypeName(schema)) {
			return formalizeObject({ type: Object, schema: schema }, schema, options);
		}
		if ('array' == utils.instanceTypeName(schema)) {
			if (schema.length === 0) return formalizeAny({ type: Array }, schema. options);
			return formalizeArray({ type: Array, schema: schema[0] }, schema, options);
		}
		if ((typeof schema === 'string' && schema.length) || (typeof schema === 'function' && utils.typeName(schema) !== undefined)) {
			return formalizeAny({ type: schema }, schema, options);
		}
		throw new SchemaError(schema, 'Schemas must have at least on validator of `type`, `post`/`pre` and/or `equal`.');
	}

	// Copy schema.
	let formalizedSchema = {};
	for (let key in schema) {
		formalizedSchema[key] = schema[key];
	}

	// Validators common to all types.
	let validators = {
		'type': ['function', 'string'],
		'equal': 'any',
		'required': ['boolean', 'string'],
		'default': 'any',
		'allowNull': ['boolean'],
		'errors': ['object'],
		'pre': ['function', 'array', 'asyncfunction'],
		'post': ['function', 'array', 'asyncfunction'],
		'priority': 'number'
	};

	// Validators specific to type.
	const type = Array.isArray(formalizedSchema.type) ? formalizedSchema.type[0] : formalizedSchema.type;
	if (type !== undefined) {
		if (utils.isSameType('object', utils.typeName(type))) merge(validators, {
			'schema': 'any',
			'unknownKeys': [ 'string' ]
		});
		if (utils.isSameType('array', utils.typeName(type))) merge(validators, {
			'schema': 'any',
			'len': [ 'string', 'number' ],
			'unique': [ 'boolean' ],
			'autowrap': [ 'boolean' ]
		});
		if (utils.isSameType('string', utils.typeName(type))) merge(validators, {
			'len': [ 'string', 'number' ],
			'match': [ 'regexp' ],
			'trim': [ 'boolean' ],
			'enum': [ 'array' ]
		});
		if (utils.isSameType('number', utils.typeName(type))) merge(validators, {
			'range': [ 'string', 'number' ]
		});
	}

	// If post validator is provided allow for options.
	if (formalizedSchema.pre !== undefined || formalizedSchema.post !== undefined) {
		merge(validators, { 'options': 'any' });
	}

	// Copy validators to formalizedSchema - checking
	// for non-supported validators at the same time.
	for (let key in formalizedSchema) {

		let validator = validators[key];

		if (validator === undefined) {
			throw new SchemaError(schema, `Validator \`${key}\` is unknown in this context.`);
		}

		let test = formalizedSchema[key];

		// Test for - and transform - errors in validator.
		if (Array.isArray(test) &&
			test.length === 2 &&
			validator.includes(utils.instanceTypeName(test[0]))) {

			formalizedSchema.errors = formalizedSchema.errors || {};
			formalizedSchema.errors[key] = test[1];
			formalizedSchema[key] = test = test[0];

		}

		if (typeof (options.transform || {}).pre === 'function') {
			const transformed = options.transform.pre(key, formalizedSchema[key], { schema: formalizedSchema });
			formalizedSchema[key] = typeof transformed !== 'undefined' ? transformed : formalizedSchema[key];
		}

		// Ensure validator is of correct type.
		if (validator !== 'any' && validator.indexOf(utils.instanceTypeName(test)) == -1) {
			throw new SchemaError(
				schema,
				`Validator '${key}' must be of type(s) ${validators[key].join(', ')}.`
			);
		}

		if (typeof (options.transform || {}).post === 'function') {
			const transformed = options.transform.post(key, formalizedSchema[key], { schema: formalizedSchema }) || formalizedSchema[key];
			formalizedSchema[key] = typeof transformed !== 'undefined' ? transformed : formalizedSchema[key];
		}

	}

	// Check for supported type.
	if (typeof formalizedSchema.type !== 'undefined' && utils.typeName(formalizedSchema.type) === undefined) {
		throw new SchemaError(formalizedSchema, `Cannot validate schema of type ${formalizedSchema.type}.`);
	}

	// Convert pre function to array.
	if (typeof formalizedSchema.pre === 'function') {
		formalizedSchema.pre = [formalizedSchema.pre];
	}

	// Convert post function to array
	if (typeof formalizedSchema.post === 'function') {
		formalizedSchema.post = [formalizedSchema.post];
	}

	// Throw error if required is invalid value
	if (typeof formalizedSchema.required === 'string' && formalizedSchema.required !== 'implicit') {
		throw new SchemaError(
			schema,
			'Validator `required` must be a Boolean or String of value `implicit`.'
		);
	}

	// Check object unknownKeys
	if (typeof formalizedSchema.unknownKeys === 'string' &&
			['allow','deny','remove'].indexOf(formalizedSchema.unknownKeys) == -1) {
		throw new SchemaError(
			schema,
			'Validator `unknownKeys` must have value `\'allow\'`, `\'deny\'` or `\'remove\'`.'
		);
	}

	// Check string enums
	if (typeof formalizedSchema.enum !== 'undefined') {
		if (formalizedSchema.enum.length < 1) {
			throw new SchemaError(
				schema,
				'Validator `enum` must have at least one item.'
			);
		}
		for (var idx in formalizedSchema.enum) {
			if (typeof formalizedSchema.enum[idx] !== 'string') {
				throw new SchemaError(
					schema,
					'Validator `enum` must be an array of strings.'
				);
			}
		}
	}

	// Add priority if not added.
	formalizedSchema.priority = formalizedSchema.priority || 10;

	// Finalize objects and arrays if necessary.
	if (formalizedSchema.type) {
		if (utils.isSameType('object', utils.typeName(formalizedSchema.type))) {
			return formalizeObject(formalizedSchema, schema, options);
		}
		if (utils.isSameType('array', utils.typeName(formalizedSchema.type))) {
			return formalizeArray(formalizedSchema, schema, options);
		}
	}

	return finalize(formalizedSchema, schema);

};

exports = module.exports = formalizeAny;

exports.strip = (schema) => {
	return Object.keys(schema)
		.filter((key) => key !== '_nonFormalizedSchema')
		.reduce((result, key) => {
			result[key] = schema[key];
			return result;
		}, {});
};
