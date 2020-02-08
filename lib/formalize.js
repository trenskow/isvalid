'use strict';

const merge = require('merge'),
	SchemaError = require('./errors/SchemaError.js'),
	utils = require('./utils.js');

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

	if (utils.instanceTypeName(formalizedSchema.schema) !== 'Object') throw new SchemaError(formalizedSchema.schema, 'Object schemas must be an object.');

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

	if (!schema.type && !schema.post && !schema.pre && !schema.equal) {
		if ('Object' == utils.instanceTypeName(schema)) {
			return await formalizeObject({ type: Object, schema: schema }, schema);
		}
		if ('Array' == utils.instanceTypeName(schema)) {
			if (schema.length === 0) throw new SchemaError(schema, 'Array must have exactly one schema.');
			return await formalizeArray({ type: Array, schema: schema[0] }, schema);
		}
		if ((typeof schema === 'string' && schema.length) || (typeof schema === 'function' && utils.typeName(schema) !== undefined)) {
			return await formalizeAny({ type: schema }, schema);
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
		'type': ['Function', 'String'],
		'equal': 'Any',
		'required': ['Boolean', 'String'],
		'default': 'Any',
		'allowNull': ['Boolean'],
		'errors': [ 'Object' ],
		'pre': ['Function', 'Array', 'AsyncFunction'],
		'post': [ 'Function', 'Array', 'AsyncFunction' ],
		'priority': 'Number'
	};

	// Validators specific to type.
	if (formalizedSchema.type !== undefined) {
		if (utils.isSameType('Object', utils.typeName(formalizedSchema.type))) merge(validators, {
			'schema': 'Any',
			'unknownKeys': [ 'String' ]
		});
		if (utils.isSameType('Array', utils.typeName(formalizedSchema.type))) merge(validators, {
			'schema': 'Any',
			'len': [ 'String', 'Number' ],
			'unique': [ 'Boolean' ],
			'autowrap': [ 'Boolean' ]
		});
		if (utils.isSameType('String', utils.typeName(formalizedSchema.type))) merge(validators, {
			'len': [ 'String', 'Number' ],
			'match': [ 'RegExp' ],
			'trim': [ 'Boolean' ],
			'enum': [ 'Array' ]
		});
		if (utils.isSameType('Number', utils.typeName(formalizedSchema.type))) merge(validators, {
			'range': [ 'String', 'Number' ]
		});
	}

	// If post validator is provided allow for options.
	if (formalizedSchema.pre !== undefined || formalizedSchema.post !== undefined) {
		merge(validators, { 'options': 'Any' });
	}

	// Copy validators to formalizedSchema - checking
	// for non-supported validators at the same time.
	for (let key in formalizedSchema) {

		let validator = validators[key];

		if (validator === undefined) {
			throw new SchemaError(schema, 'Validator \'' + key + '\' is unknown in this context.');
		}

		let test = formalizedSchema[key];

		// Test for - and transform - errors in validator.
		if (Array.isArray(test) &&
			test.length === 2 &&
			typeof test[1] === 'string') {

			formalizedSchema.errors = formalizedSchema.errors || {};
			formalizedSchema.errors[key] = test[1];
			formalizedSchema[key] = test = test[0];

		}

		// Ensure validator is of correct type.
		if (validator !== 'Any' && validator.indexOf(utils.instanceTypeName(test)) == -1) {
			throw new SchemaError(
				schema,
				'Validator \'' + key + '\' must be of type(s) ' + validators[key].join(', ') + '.'
			);
		}

	}

	// Check for supported type.
	if (typeof formalizedSchema.type !== 'undefined' && utils.typeName(formalizedSchema.type) === undefined) {
		throw new SchemaError(formalizedSchema, 'Cannot validate schema of type ' + formalizedSchema.type + '.');
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

	// Add priority if not added.
	formalizedSchema.priority = formalizedSchema.priority || 10;

	// Finalize objects and arrays if necessary.
	if (formalizedSchema.type) {
		if (utils.isSameType('Object', utils.typeName(formalizedSchema.type))) {
			return await formalizeObject(formalizedSchema, schema);
		}
		if (utils.isSameType('Array', utils.typeName(formalizedSchema.type))) {
			return await formalizeArray(formalizedSchema, schema);
		}
	}

	// Check if errors are strings.
	Object.keys(formalizedSchema.errors || {})
		.forEach((key) => {
			if (typeof formalizedSchema.errors[key] !== 'string') {
				throw new SchemaError(
					schema,
					'Costom error for validator \'' + key + '\' must be of type `String`.'
				);
			}
		});

	return await finalize(formalizedSchema, schema);

};

exports = module.exports = formalizeAny;
