'use strict';

var validate = require('../../../lib/middleware.js'),
	express = require('express'),
	bodyParser = require('body-parser');

// We build a simple express test in order to test the middleware
//
var app = express();

app.use(bodyParser.json());

app.param('testParam', validate.param({
	type: Number, required: true
}));

app.param('cbTestParam', validate.param({
	type: String,
	required: true,
	post: (data, schema, { options }) => {
		options.res.sendStatus(201);
	}
}));

app.get('/parameter/:testParam',
	validate.parameter('testParam', {
		type: Number,
		post: (data) => data + 1
	}),
	(req, res) => {
		res.json(req.params.testParam);
	});

app.get('/param/:testParam', function(req, res) {
	res.sendStatus(200);
});

app.get('/cbParam/:cbTestParam', function() {});

app.get('/query',
	validate.query({
		'test': { type: String, match: /^.*?test$/i }
	}),
	function(req, res) {
		res.status(200).json(req.query);
	}
);

app.post('/post',
	validate.body({
		'test': [ { type: String, match: /^.*?test$/i } ]
	}),
	function(req, res) {
		res.status(200).json(req.body);
	}
);

// Not found route
app.use(function(req, res) {
	res.status(400).json({ error: 'not-found' });
});

// Error handler
app.use(function(err, req, res, _) {
	if (err.constructor.name == 'ValidationError') {
		return res.status(400).json({error: 'validation-error', keyPath: err.keyPath.join('.'), message: err.message});
	}
	res.status(500).json({error: 'internal-server-error'});
});

exports = module.exports = app;
