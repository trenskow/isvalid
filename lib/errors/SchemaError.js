'use strict';

module.exports = exports = class SchemaError extends Error {

	constructor(schema, message) {
		super();

		let schemaCopy = {};
		for (let key in schema) schemaCopy[key] = schema[key];

		delete schemaCopy.schema;

		this.message = message;
		this.schema = schema;

	}

};
