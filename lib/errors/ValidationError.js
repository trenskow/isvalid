'use strict';

module.exports = exports = class ValidationError extends Error {

	constructor(keyPath, schema, validator, message) {
		super(message);
		
		let schemaCopy = {};
		for (let key in schema) schemaCopy[key] = schema[key];
	
		delete schemaCopy.schema;
	
		this.keyPath = keyPath;
		this.schema = schemaCopy;
		this.validator = validator;
	}

	static fromError(keyPath, schema, validator, err) {
		let validationError = new ValidationError(keyPath, schema, validator, err.message);
		validationError.stack = err.stack;
		return validationError;
	}

};
