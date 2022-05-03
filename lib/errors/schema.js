//
// schema.js
//
// Created by Kristian Trenskow on 2014-06-06
//
// See license in LICENSE
//

export default class SchemaError extends Error {

	constructor(schema, message) {
		super();

		let schemaCopy = {};
		for (let key in schema) schemaCopy[key] = schema[key];

		delete schemaCopy.schema;

		this.message = message;
		this.schema = schema;

	}

}
