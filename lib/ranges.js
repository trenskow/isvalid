'use strict';

import SchemaError from './errors/schema.js';

export function testIndex(ranges, value) {
	return ranges.some(({ lower, upper }) => {
		return lower <= value && upper >= value;
	});
}

export function formalize(ranges, options) {

	// Convert to string if ranges is a Number.
	if (ranges !== undefined && typeof ranges === 'number') {
		ranges = ranges.toString();
	}

	// Throw if ranges is not a string.
	if (!ranges || typeof ranges !== 'string') {
		throw new Error('Ranges must be a number or a string expressed as: ex. \'-2,4-6,8,10-\'.');
	}

	return ranges
		.split(',')
		.map((range) => {

			// Get the boundaries of the range.
			let boundaries = range.split(/(?<!\()-/);

			// Low and high boundaries are the same where only one number is specified.
			if (boundaries.length == 1) boundaries = [ boundaries[0], boundaries[0] ];
			// Throw an error if there is not exactly to boundaries.
			if (boundaries.length != 2) throw new SchemaError('Malformed range \'' + range + '\'.');

			// Test for malformed boundaries
			for (let bIdx = 0 ; bIdx < 2 ; bIdx++) {
				if (!/^\(?[-0-9.]*\)?$/.test(boundaries[bIdx])) throw new SchemaError('Malformed boundary \'' + boundaries[bIdx] + '\'.');
			}

			boundaries = boundaries.map((boundary) => boundary.match(/^\(?([-0-9.]*)\)?$/)[1] || '');

			let lower = boundaries[0];
			let upper = boundaries[1];

			if ((options || {}).allowNegative === false && (lower < 0 || upper < 0)) {
				throw new SchemaError('Boundary cannot be a negative value.');
			}

			if ((options || {}).allowNonInteger === false && (!Number.isInteger(lower) || !Number.isInteger(upper))) {
				throw new SchemaError('Boundary cannot be a non-integer value.');
			}

			// If no lower boundary is specified we use -Infinity
			if (lower.length === 0) lower = -Infinity;
			else lower = parseFloat(lower);

			// If no higher boundary is specified we use Infinity;
			if (upper.length === 0) upper = Infinity;
			else upper = parseFloat(upper);

			if (lower > upper) {
				throw new SchemaError('Malformed range \'' + range +'\'');
			}

			return { lower, upper };

		});

}
