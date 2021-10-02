'use strict';

const chai = require('chai'),
	chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);

require('./key-paths');
require('./ranges.js');
require('./equals.js');
require('./unique.js');
require('./formalize.js');
require('./validate.js');
require('./middleware/');
require('./merge');
