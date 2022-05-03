//
// plugins.js
//
// Created by Kristian Trenskow on 2022-04-13
//
// See license in LICENSE
//


import { isSameType, instanceTypeName, typeName } from './utils.js';

const plugins = [];

export function use(plugin) {
	plugins.push(plugin({ isSameType, instanceTypeName, typeName }));
}

export function all() {
	return plugins;
}
