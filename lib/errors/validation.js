//
// validation.js
//
// Created by Kristian Trenskow on 2014-06-06
//
// See license in LICENSE
//

export default class ValidationError extends Error {

	constructor(keyPath, schema, validator, message) {
		super();

		let schemaCopy = {};
		for (let key in schema) schemaCopy[key] = schema[key];

		delete schemaCopy.schema;

		this.message = message;
		this.keyPath = keyPath.filter((key) => key !== undefined && key !== null && `${key}`.length);
		this.schema = schemaCopy;
		this.validator = validator;
	}

	static fromError(keyPath, schema, validator, err) {
		let validationError = new ValidationError(err.keyPath || keyPath, err.schema || schema, err.validator || validator, err.message);
		validationError.stack = err.stack;
		validationError.underlying = err;
		return validationError;
	}

}
