'use strict';

const merge = require('merge'),
	SchemaError = require('./errors/SchemaError.js'),
	utils = require('./utils.js');

const supportedTypes = ['Object', 'Array', 'String', 'Number', 'Boolean', 'Date'];

const finalize = (formalizedSchema, nonFormalizedSchema) => {

	// Add the old non-formalized schema - for preventing
	// redundant formalization and for usage by the
	// validator when sending validation errors.
	//
	// Make the property unenumerable.
	Object.defineProperty(formalizedSchema, '_nonFormalizedSchema', {
		value: nonFormalizedSchema,
		enumerable: false,
	});

	// We seal the schema so no futher editing can take place.
	Object.seal(formalizedSchema);

	return formalizedSchema;

};

const formalizeObject = async (formalizedSchema, nonFormalizedSchema) => {

	formalizedSchema.schema = formalizedSchema.schema || {};

	if (utils.name(formalizedSchema.schema.constructor) !== 'Object') throw new SchemaError(formalizedSchema.schema, 'Object schemas must be an object.');

	// Build new formalized schema into this.
	let formalizedSubschema = {};

	// We iterate through all keys.
	await Promise.all(Object.keys(formalizedSchema.schema).map((key) => {
		return formalizeAny(formalizedSchema.schema[key])
			.then((formalizedKey) => {
			
				if (formalizedSchema.required === undefined || formalizedSchema.required == 'implicit') {
					if (formalizedKey.required === true) formalizedSchema.required = true;
				}
	
				formalizedSubschema[key] = formalizedKey;

			});
	}));

	formalizedSchema.schema = formalizedSubschema || {};

	return await finalize(formalizedSchema, nonFormalizedSchema);

};

const formalizeArray = async (formalizedSchema, nonFormalizedSchema) => {

	// formalizedSchema has been pre-processed by formalizeAny, so
	// we only need to formalize the sub-schema.

	// If no sub-schema is provided we consider the schema final.
	if (typeof formalizedSchema.schema === 'undefined') return await finalize(formalizedSchema, nonFormalizedSchema);

	formalizedSchema.schema = await formalizeAny(formalizedSchema.schema);

	// Apply implicit required if sub-schema has required data.
	if (typeof(formalizedSchema.required) === 'undefined' || formalizedSchema.required === 'implicit') {
		if (formalizedSchema.schema.required === true) formalizedSchema.required = true;
	}

	return await finalize(formalizedSchema, nonFormalizedSchema);

};

const formalizeAny = async (schema) => {

	// If schema is already formalized we just call back.
	if (typeof schema._nonFormalizedSchema !== 'undefined') return schema;

	if (!schema.type && !schema.custom && !schema.equal) {
		if ('Object' == utils.name(schema.constructor)) {
			return await formalizeObject({ type: Object, schema: schema }, schema);
		}
		if ('Array' == utils.name(schema.constructor)) {
			if (schema.length === 0) throw new SchemaError(schema, 'Array must have exactly one schema.');
			return await formalizeArray({ type: Array, schema: schema[0] }, schema);
		}
		if (typeof schema === 'function' && supportedTypes.indexOf(utils.name(schema)) > -1) {
			return await formalizeAny({ type: schema }, schema);
		}
		throw new SchemaError(schema, 'Schemas must have at least on validator of `type`, `custom` and/or `equal`.');
	}

	// Copy schema.
	let formalizedSchema = merge(true, schema);

	// Validators common to all types.
	let validators = {
		'type': ['Function'],
		'equal': 'Any',
		'required': ['Boolean', 'String'],
		'default': 'Any',
		'allowNull': ['Boolean'],
		'errors': [ 'Object' ],
		'custom': [ 'Function', 'Array' ]
	};

	// Validators specific to type.
	if (formalizedSchema.type !== undefined) {
		if ('Object' == utils.name(formalizedSchema.type)) merge(validators, {
			'schema': 'Any',
			'unknownKeys': [ 'String' ]
		});
		if ('Array' == utils.name(formalizedSchema.type)) merge(validators, {
			'schema': 'Any',
			'len': [ 'String', 'Number' ],
			'unique': [ 'Boolean' ],
			'autowrap': [ 'Boolean' ]
		});
		if ('String' == utils.name(formalizedSchema.type)) merge(validators, {
			'match': [ 'RegExp' ],
			'trim': [ 'Boolean' ],
			'enum': [ 'Array' ]
		});
		if ('Number' == utils.name(formalizedSchema.type)) merge(validators, {
			'range': [ 'String', 'Number' ]
		});
	}

	// If custom validator is provided allow for options.
	if (formalizedSchema.custom !== undefined) {
		merge(validators, { 'options': 'Any' });
	}

	// Copy validators to formalizedSchema - checking
	// for non-supported validators at the same time.
	for (let key in formalizedSchema) {

		let validator = validators[key];

		if (validator === undefined) throw new SchemaError(
			schema,
			'Validator \'' + key + '\' is unknown in this context.'
		);

		let test = formalizedSchema[key];

		// Test for - and transform - errors in validator.
		if (utils.name(test.constructor) === 'Array' &&
			test.length === 2 &&
			(validator === 'Any' || validator.indexOf(utils.name(test[0].constructor)) > -1)) {

			formalizedSchema.errors = formalizedSchema.errors || {};
			formalizedSchema.errors[key] = test[1];
			formalizedSchema[key] = test = test[0];

		}

		// Ensure validator is of correct type.
		if (validator !== 'Any' && validator.indexOf(utils.name(test.constructor)) == -1) {
			throw new SchemaError(
				schema,
				'Validator \'' + key + '\' must be of type(s) ' + validators[key].join(', ') + '.'
			);
		}

	}

	// Check for supported type.
	if (typeof formalizedSchema.type !== 'undefined' && supportedTypes.indexOf(utils.name(formalizedSchema.type)) == -1) {
		throw new SchemaError(formalizedSchema, 'Cannot validate schema of type ' + utils.name(formalizedSchema.type) + '.');
	}

	// Convert custom function to array
	if (typeof formalizedSchema.custom === 'function') {
		formalizedSchema.custom = [formalizedSchema.custom];
	}

	// Throw error if required is invalid value
	if (typeof formalizedSchema.required === 'string' && formalizedSchema.required != 'implicit') {
		throw new SchemaError(
			schema,
			'Validator \'required\' must be a Boolean or String of value \'implicit\'.'
		);
	}

	// Check object unknownKeys
	if (typeof formalizedSchema.unknownKeys === 'string' &&
			['allow','deny','remove'].indexOf(formalizedSchema.unknownKeys) == -1) {
		throw new SchemaError(
			schema,
			'Validator \'unknownKeys\' must have value \'allow\', \'deny\' or \'remove\'.'
		);
	}

	// Check string enums
	if (typeof formalizedSchema.enum !== 'undefined') {
		if (formalizedSchema.enum.length < 1) {
			throw new SchemaError(
				schema,
				'Validator \'enum\' must have at least one item.'
			);
		}
		for (var idx in formalizedSchema.enum) {
			if (typeof formalizedSchema.enum[idx] !== 'string') {
				throw new SchemaError(
					schema,
					'Validator \'enum\' must be an array of strings.'
				);
			}
		}
	}

	// Finalize objects and arrays if necessary.
	if (formalizedSchema.type) {
		if ('Object' == utils.name(formalizedSchema.type)) {
			return await formalizeObject(formalizedSchema, schema);
		}
		if ('Array' == utils.name(formalizedSchema.type)) {
			return await formalizeArray(formalizedSchema, schema);
		}
	}

	return await finalize(formalizedSchema, schema);

};

exports = module.exports = formalizeAny;