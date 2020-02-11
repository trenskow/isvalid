'use strict';

var formalize = require('./formalize.js'),
	isvalid = require('./validate.js'),
	merge = require('merge');

exports.body = module.exports.body = function(schema, options) {

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

};

exports.query = module.exports.query = function(schema, options) {

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

};

exports.param = module.exports.param = function(schema, options) {

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

};

exports.parameter = module.exports.parameter = function(id, schema, options) {

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

};
