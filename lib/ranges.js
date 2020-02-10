'use strict';

module.exports.testIndex = function(ranges, index) {

	// Convert to string if ranges is a Number.
	if (ranges !== undefined && typeof ranges === 'number') {
		ranges = ranges.toString();
	}

	// Throw if ranges is not a string.
	if (!ranges || typeof ranges !== 'string') {
		throw new Error('Ranges must be a number or a string expressed as: ex. \'-2,4-6,8,10-\'.');
	}

	// Throw if index is not a number.
	if (index === undefined || typeof index !== 'number') {
		throw new Error('Index is not a number.');
	}

	// Split into individual ranges.
	let r = ranges.split(',');
	for (let idx in r) {

		// Get the boundaries of the range.
		let boundaries = r[idx].split('-');

		// Low and high boundaries are the same where only one number is specified.
		if (boundaries.length == 1) boundaries = [ boundaries[0], boundaries[0] ];
		// Throw an error if there is not exactly to boundaries.
		if (boundaries.length != 2) throw new Error('Malformed range \'' + r[idx] + '\'.');

		// Test for malformed boundaries
		for (let bIdx = 0 ; bIdx < 2 ; bIdx++) {
			if (!/^[0-9]*$/.test(boundaries[bIdx])) throw new Error('Malformed boundary \'' + boundaries[bIdx] + '\'.');
		}

		let lowBoundary = boundaries[0];
		let highBoundary = boundaries[1];

		// If no lower boundary is specified we use -Infinity
		if (lowBoundary.length === 0) lowBoundary = -Infinity;
		else lowBoundary = parseInt(lowBoundary);

		// If no higher boundary is specified we use Infinity;
		if (highBoundary.length === 0) highBoundary = Infinity;
		else highBoundary = parseInt(highBoundary);

		// If index is within boundaries return true;
		if (index >= lowBoundary && index <= highBoundary) return true;

	}

	// Index was not matched to any range.
	return false;

};
