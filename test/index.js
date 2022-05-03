//
// index.js
//
// Created by Kristian Trenskow on 2015-09-27
//
// See license in LICENSE
//

import { use as chaiUse } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import caseit, { supported } from '@trenskow/caseit';
import { use } from '../lib/plugins.js';

chaiUse(chaiAsPromised);

use(function (utils) {
	return {
		supportsType: (type) => utils.isSameType(type, String),
		validatorsForType: () => { return { ensureCase: String }; },
		formalize: (config) => {
			if (config && !supported.includes(config)) throw new Error(`Only case types: ${supported.map((casing) => `\`${casing}\``).join(', ')} are supported.`);
		},
		validate: (data, config) => {
			if (caseit(data, config) !== data) throw new Error(`Is not ${config} case.`);
			return data;
		}
	};
});

import './ranges.js';
import './equals.js';
import './unique.js';
import './formalize.js';
import './validate.js';
import './middleware/index.js';
import './key-paths.js';
import './merge.js';
