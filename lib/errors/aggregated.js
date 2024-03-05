//
// aggregated.js
//
// Created by Kristian Trenskow on 2024-03-05
//
// See license in LICENSE
//

import ValidationError from './validation.js';

export default class AggregatedError extends ValidationError {

	constructor(keyPath, schema, validator, message, errors) {
		super(keyPath, schema, validator, message);
		this.errors = errors;
	}

}
