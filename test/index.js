'use strict';

const chai = require('chai'),
	chaiAsPromised = require('chai-as-promised'),
	caseit = require('@trenskow/caseit'),
	isvalid = require('../');

chai.use(chaiAsPromised);

isvalid.plugins.use(function (utils) {
	return {
		supportsType: (type) => utils.isSameType(type, String),
		validatorsForType: () => { return { casing: String }; },
		formalizeValidator: (_, __, config) => {
			if (!config) return;
			if (!caseit.supported.includes(config)) throw new Error(`Only case types: ${caseit.supported.map((casing) => `\`${casing}\``).join(', ')} are supported.`);
		},
		validate: (_, __, config, data) => caseit(data, config)
	};
});

require('./ranges.js');
require('./equals.js');
require('./unique.js');
require('./formalize.js');
require('./validate.js');
require('./middleware/');
require('./key-paths');
require('./merge');
