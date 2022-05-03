//
// formalize.js
//
// Created by Kristian Trenskow on 2014-06-09
//
// See license in LICENSE
//

import merge from 'merge';
import SchemaError from './errors/schema.js';
import { instanceTypeName, typeName, isSameType } from './utils.js';
import { formalize as _formalize } from './ranges.js';
import { all as allPlugins } from './plugins.js';

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

	if (instanceTypeName(formalizedSchema.schema) !== 'object') {
		throw new SchemaError(formalizedSchema.schema, 'Object schemas must be an object.');
	}

	// Build new formalized schema into this.
	let formalizedSubSchema = {};

	// We iterate through all keys.
	Object.keys(formalizedSchema.schema)
		.forEach((key) => {
			formalizedSubSchema[key] = formalizeAny(formalizedSchema.schema[key], options);
		});

	formalizedSchema.schema = finalize(formalizedSubSchema, nonFormalizedSchema.schema);

	if (typeof formalizedSchema.required === 'undefined') {
		if (Object.keys(formalizedSubSchema).some((key) => formalizedSubSchema[key].required === true || formalizedSubSchema[key].required === 'implicit')) {
			formalizedSchema.required = 'implicit';
		}
	}

	return formalizedSchema;

};

const formalizeArray = (formalizedSchema, options) => {

	// formalizedSchema has been pre-processed by formalizeAny, so
	// we only need to formalize the sub-schema.

	// If no sub-schema is provided we consider the schema final.
	if (typeof formalizedSchema.schema === 'undefined') return formalizedSchema;

	formalizedSchema.schema = formalizeAny(formalizedSchema.schema, options);

	// Apply implicit required if sub-schema has required data.
	if (typeof(formalizedSchema.required) === 'undefined' || formalizedSchema.required === 'implicit') {
		if (formalizedSchema.schema.required === true) formalizedSchema.required = true;
	}

	return formalizedSchema;

};

const formalizeAny = (schema, options = {}) => {

	// If schema is already formalized we just call back.
	if (typeof schema._nonFormalizedSchema !== 'undefined') return schema;

	if (!schema.type && !schema.post && !schema.pre && !schema.equal) {
		if ('object' == instanceTypeName(schema)) {
			return formalizeAny({ type: Object, schema: schema }, options);
		}
		if ('array' == instanceTypeName(schema)) {
			if (schema.length === 0) return formalizeAny({ type: Array }, options);
			return formalizeAny({ type: Array, schema: schema[0] }, options);
		}
		if ((typeof schema === 'string' && schema.length) || (typeof schema === 'function' && typeName(schema) !== undefined)) {
			return formalizeAny({ type: schema }, options);
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
		'null': ['string'],
		'errors': ['object'],
		'pre': ['function', 'array', 'asyncfunction'],
		'post': ['function', 'array', 'asyncfunction'],
		'priority': 'number'
	};

	// Validators specific to type.
	const type = Array.isArray(formalizedSchema.type) ? formalizedSchema.type[0] : formalizedSchema.type;
	if (type !== undefined) {
		if (isSameType('object', typeName(type))) merge(validators, {
			'schema': 'any',
			'unknownKeys': [ 'string' ]
		});
		if (isSameType('array', typeName(type))) merge(validators, {
			'schema': 'any',
			'len': [ 'string', 'number' ],
			'unique': [ 'boolean' ],
			'autowrap': [ 'boolean' ]
		});
		if (isSameType('string', typeName(type))) merge(validators, {
			'len': [ 'string', 'number' ],
			'match': [ 'regexp' ],
			'trim': [ 'boolean' ],
			'enum': [ 'array' ]
		});
		if (isSameType('number', typeName(type))) merge(validators, {
			'range': [ 'string', 'number' ],
			'float': [ 'string' ]
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
		let test = formalizedSchema[key];

		if (typeof validator === 'undefined') {

			let plugin;

			[plugin, validator] = options.plugins
				.filter((plugin) => plugin.supportsType(type))
				.map((plugin) => [plugin, plugin.validatorsForType(type)])
				.reduce((plugins, [plugin, validators]) => {
					if (Object.keys(validators).includes(key)) {
						validators = validators[key];
						if (!Array.isArray(validators)) validators = [validators];
						return [plugin, validators.map((validator) => typeName(validator))];
					}
					return plugins;
				}, []);

			if (typeof plugin === 'undefined') throw new SchemaError(schema, `Validator \`${key}\` is unknown in this context.`);

			formalizedSchema.plugins = formalizedSchema.plugins || {};
			formalizedSchema.plugins[key] = {
				phase: plugin.phase || 'post',
				validator: plugin.validate,
				formalize: plugin.formalize
			};

		}

		// Test for - and transform - errors in validator.
		if (Array.isArray(test) &&

			test.length === 2 &&
			validator.includes(instanceTypeName(test[0]))) {

			formalizedSchema.errors = formalizedSchema.errors || {};
			formalizedSchema.errors[key] = test[1];
			formalizedSchema[key] = test = test[0];

		}

		if (typeof (options.transform || {}).pre === 'function') {
			const transformed = options.transform.pre(key, formalizedSchema[key], { schema: formalizedSchema });
			test = formalizedSchema[key] = typeof transformed !== 'undefined' ? transformed : formalizedSchema[key];
		}

		// Ensure validator is of correct type.
		if (typeof validator !== 'undefined' && validator !== 'any' && validator.indexOf(instanceTypeName(test)) == -1) {
			throw new SchemaError(
				schema,
				`Validator '${key}' must be of type(s) ${validators[key].join(', ')}.`
			);
		}

		if (typeof (formalizedSchema.plugins || {})[key] !== 'undefined') {
			try {
				formalizedSchema[key] = formalizedSchema.plugins[key].formalize(formalizedSchema[key], key, type) || formalizedSchema[key];
			} catch (error) {
				throw new SchemaError(schema, error.message);
			}
		}

		if (typeof (options.transform || {}).post === 'function') {
			const transformed = options.transform.post(key, formalizedSchema[key], { schema: formalizedSchema }) || formalizedSchema[key];
			test = formalizedSchema[key] = typeof transformed !== 'undefined' ? transformed : formalizedSchema[key];
		}

	}

	// Check for supported type.
	if (typeof formalizedSchema.type !== 'undefined' && typeName(formalizedSchema.type) === undefined) {
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

	// Check null
	if (typeof formalizedSchema.null === 'string' &&
			['allow', 'deny', 'undefine'].indexOf(formalizedSchema.null) == -1) {
		throw new SchemaError(
			schema,
			'Validator `null` must have value `\'allow\'`, `\'deny\'`, `\'undefined\'`.'
		);
	}

	// Check number float
	if (typeof formalizedSchema.float === 'string' &&
			['allow', 'deny', 'round', 'floor', 'ceil'].indexOf(formalizedSchema.float) == -1) {
		throw new SchemaError(
			schema,
			'Validator `float` must have value `\'allow\'`, `\'deny\'`, `\'round\'`, `\'floor\'` or `\'ceil\'`.'
		);
	}

	// Check len
	if (typeof formalizedSchema.len !== 'undefined') {
		formalizedSchema.len = _formalize(formalizedSchema.len, {
			allowNegative: false,
			allowNonIntegers: false
		});
	}

	// Check range
	if (typeof formalizedSchema.range !== 'undefined') {
		formalizedSchema.range = _formalize(formalizedSchema.range, {
			allowNegative: true,
			allowNonIntegers: true
		});
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
		if (isSameType('object', typeName(formalizedSchema.type))) {
			formalizedSchema = formalizeObject(formalizedSchema, schema, options);
		}
		else if (isSameType('array', typeName(formalizedSchema.type))) {
			formalizedSchema = formalizeArray(formalizedSchema, options);
		}
	}

	return finalize(formalizedSchema, schema);

};

export default (schema, options = {}) => {
	return formalizeAny(schema, Object.assign({}, options, {
		plugins: allPlugins().concat((options.plugins || []).map((plugin) => plugin({ instanceTypeName, typeName, isSameType })))
	}));
};

export function strip(schema) {
	return Object.keys(schema)
		.filter((key) => key !== '_nonFormalizedSchema')
		.reduce((result, key) => {
			result[key] = schema[key];
			return result;
		}, {});
}
