//
// middleware.js
//
// Created by Kristian Trenskow on 2015-06-28
//
// See license in LICENSE
//

import formalize from './formalize.js';
import isvalid from './validate.js';
import merge from 'merge';

export function body(schema, options) {

	let formalizedSchema = formalize(schema, options);

	return function(req, res, next) {
		return isvalid(req.body, formalizedSchema, merge(options, {
			req: req,
			res: res
		}), ['body'])
			.then((body) => {
				req.body = body;
				next();
			})
			.catch((err) => {
				req.body = undefined;
				next(err);
			});
	};

}

export function query(schema, options) {

	let formalizedSchema = formalize(schema, options);

	return function(req, res, next) {
		return isvalid(req.query, formalizedSchema, merge(options, {
			req: req,
			res: res
		}), ['query'])
			.then((query) => {
				req.query = query;
				next();
			})
			.catch((err) => {
				req.query = undefined;
				next(err);
			});
	};

}

export function param(schema, options) {

	let formalizedSchema = formalize(schema, options);

	return function(req, res, next, val, id) {
		return isvalid(req.params[id], formalizedSchema, merge(options, {
			req: req,
			res: res
		}))
			.then((param) => {
				req.params[id] = param;
				next();
			})
			.catch((err) => {
				req.params[id] = undefined;
				next(err);
			});
	};

}

export function parameter(id, schema, options) {

	let formalizedSchema = formalize(schema, options);

	return function(req, res, next) {
		return isvalid(req.params[id], formalizedSchema, merge(options, {
			req: req,
			res: res
		}), ['params', id])
			.then((param) => {
				req.params[id] = param;
				next();
			})
			.catch((err) => {
				delete req.params.id;
				next(err);
			});
	};

}
