//
// unique.js
//
// Created by Kristian Trenskow on 2014-06-06
//
// See license in LICENSE
//

import equals from './equals.js';

export default async (arr) => {

	if (arr.length <= 1) return true;

	for (let idx1 = 0 ; idx1 < arr.length ; idx1++) {
		for (let idx2 = idx1 + 1 ; idx2 < arr.length ; idx2++) {
			if (await equals(arr[idx1], arr[idx2])) return false;
		}
	}

	return true;

};
