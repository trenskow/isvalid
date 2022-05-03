//
// unique.js
//
// Created by Kristian Trenskow on 2014-06-06
//
// See license in LICENSE
//

import { expect } from 'chai';
import unique from '../lib/unique.js';

describe('unique', function() {
	it('should return false if array of objects is not unique.', () => {
		return expect(unique([{test:{ing:123}},{test:{ing:123}}])).to.eventually.be.false;
	});
	it('should return true if array of objects is unique.', () => {
		return expect(unique([{test:{ing:123}},{test:{ing:456}}])).to.eventually.be.true;
	});
});
