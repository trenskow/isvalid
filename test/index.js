'use strict';

const chai = require('chai'),
	chaiAsPromised = require('chai-as-promised'),
	caseit = require('@trenskow/caseit'),
	isvalid = require('../');

chai.use(chaiAsPromised);

isvalid.plugins.use(function (utils) {
	return {
		supportsType: (type) => utils.isSameType(type, String),
		validatorsForType: () => { return { ensureCase: String }; },
		formalize: (config) => {
			if (config && !caseit.supported.includes(config)) throw new Error(`Only case types: ${caseit.supported.map((casing) => `\`${casing}\``).join(', ')} are supported.`);
		},
		validate: (data, config) => {
			if (caseit(data, config) !== data) throw new Error(`Is not ${config} case.`);
			return data;
		}
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
