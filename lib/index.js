//
// index.js
//
// Created by Kristian Trenskow on 2021-08-18
//
// See license in LICENSE
//

import validate from './validate.js';
import formalize from './formalize.js';
import keyPaths from './key-paths.js';
import merge from './merge.js';
import { use } from './plugins.js';

const plugins = { use };

export default validate;
export { formalize, keyPaths, merge, plugins };
