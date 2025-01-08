//
// plugins.js
//
// Created by Kristian Trenskow on 2022-04-13
//
// See license in LICENSE
//

import { isSameType, instanceTypeName, typeName } from './utils.js';

const plugins = {};

export function use(identifier, plugin, { conflict = 'fail' } = {}) {

	if (typeof identifier !== 'string') {
		throw new Error('Identifier must be a string.');
	}

	if (plugins[identifier]) {
		switch (conflict) {
		case 'replace':
			break;
		case 'ignore':
			return;
		default:
			throw new Error(`Plugin with identifier "${identifier}" already exists.`);
		}
	}

	plugins[identifier] = plugin({ isSameType, instanceTypeName, typeName });

}

export function all() {
	return Object.values(plugins);
}
