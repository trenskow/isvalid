# isvalid

[![npm version](https://badge.fury.io/js/isvalid.svg)](https://www.npmjs.com/package/isvalid) [![travis ci](https://travis-ci.org/trenskow/isvalid.svg?branch=master)](https://travis-ci.org/trenskow/isvalid)
-

**isvalid** is an asynchronous node.js library for validating and error correcting JavaScript data - which also includes JSON. It uses a very simple schema model - inspired by [Mongoose](https://npmjs.org/package/mongoose).

# Table of Content

- [How to Use](#how-to-use)
  * [Example](#example)
- [How it Works](#how-it-works)
  * [A Note on the Examples in this Document](#a-note-on-the-examples-in-this-document)
  * [Errors](#errors)
    + [SchemaError](#schemaerror)
    + [ValidationError](#validationerror)
  * [Supported Types](#supported-types)
    + [Validators Available to All Types](#validators-available-to-all-types)
      - [`default`](#default)
        * [Static Values](#static-values)
        * [Asynchronous Functions](#asynchronous-functions)
        * [Synchronous Functions](#synchronous-functions)
      - [`required`](#required)
        * [Implicitly Required](#implicitly-required)
      - [`equal`](#equal)
      - [`errors` (Custom Error Messages)](#errors-custom-error-messages)
        * [Error Shortcuts](#error-shortcuts)
    + [Type Specific Validators](#type-specific-validators)
      - [Validators Common to `Object` and `Array`](#validators-common-to-object-and-array)
        * [`schema`](#schema)
      - [`Object` Validators](#object-validators)
        * [`unknownKeys`](#unknownkeys)
      - [`Array` Validators](#array-validators)
        * [`len`](#len)
        * [`unique`](#unique)
        * [`autowrap`](#autowrap)
      - [`String` Validators](#string-validators)
        * [`trim`](#trim)
        * [`len`](#len-1)
        * [`match`](#match)
        * [`enum`](#enum)
      - [`Number` Validators](#number-validators)
        * [`range`](#range)
        * [`float`](#float)
      - [Custom Types](#custom-types)
  * [`post`](#post)
    + [Example](#example-1)
    + [Options with Post Validators](#options-with-post-validators)
    + [Multiple Post Validators](#multiple-post-validators)
  * [`pre`](#pre)
  * [Type Shortcuts](#type-shortcuts)
    + [Object Shortcuts](#object-shortcuts)
    + [Array Shortcuts](#array-shortcuts)
    + [Other Shortcuts](#other-shortcuts)
  * [Automatic Type Conversion](#automatic-type-conversion)
    + [Numbers](#numbers)
    + [Booleans](#booleans)
    + [Dates](#dates)
- [As Connect or Express Middleware](#as-connect-or-express-middleware)
  * [Example](#example-2)
- [Contributing](#contributing)
- [License](#license)

# How to Use

**isvalid** uses a simple schema modal to specify how the data should be formatted. It supports generic validators for all types and type specific validators.

Usage:

````javascript
await isvalid(dataToValidate, validationSchema, callback)
````

## Example

Here's a simple example on how to use the validator.

````javascript
const isvalid = require('isvalid');

isvalid(inputData, {
	'user': { type: String, required: true },
	'pass': { type: String, required: true }
}).then((data) => {
	// Data was validated and valid data is available.
}).catch((err) => {
	// A validation error occurred.
});
````

– or using `await`/`async`.

````javascript
const isvalid = require('isvalid');

let data = /* some data */

try {
	data = await isvalid(data, {
		'user': { type: String, required: true },
		'pass': { type: String, required: true }
	});
	
} catch(err) {
	// A validation error occurred.
}

// data is validated.

````

> There is also build-in support for usage as an [express](https://npmjs.org/package/express) or [connect](https://npmjs.org/package/connect) middleware – see the [As Connect or Express Middleware](#as-connect-or-express-middleware) section below for more information.

# How it Works

## A Note on the Examples in this Document

In order to be a complete schema, schemas must have at least the `type`, `post`/`pre` or `equal` validator. But, as you will notice throughout this document, many of the examples have none of them. Instead they just use type shortcuts.

This is because **isvalid** supports type shortcuts for all its supported types, and you are - if you want to help yourself - going to use them a lot. You can read more about [type shortcuts](#type-shortcuts) in the designated section at the near-bottom of this document.

## Errors

All errors are thrown (in promises).

* Wrong parameters throw the `Error` type.
* Schema errors throw the `SchemaError` type.
* Validation errors throw the  `ValidationError` type.

### SchemaError

The `SchemaError` contains a `schema` property which is the actual schema in which there is an error. It also has a `message` property with the description of the error that occurred.

### ValidationError

The `ValidationError` contains three properties besides the `message`.

- `keyPath` is an array indicating the key path in the data where the error occurred.
- `schema` is the schema that failed to validate.
- `validator` is the name of the validator that failed.

## Supported Types

These types are supported by the validator:

 * `Object`
 * `Array`
 * `String`
 * `Number`
 * `Boolean`
 * `Date`
 * Custom types

There are some validators that are common to all types, and some types have specific validators.

You specify the type like this:

````javascript
{ type: String }
````

or if `type` is your only validator, you can just do this:

````javascript
String
````

In the above example the input must be of type `String`.

All schemas must have at least a `type`, `post`/`pre` or `equal` validator.

> There is more information about shortcuts in the [Type Shortcuts](#type-shortcuts) section below.

### Validators Available to All Types

These validators are supported by all types.

#### `default`
Defaults data to a specific value if data is not present in the input. It takes a specific value or it can call a function to retrieve the value.

Type: Any value or a function.

##### Static Values

Example:

````javascript
{
	"email": { type: String, default: "email@not.set" }
}
````

This tells the validator, that an `email` key is expected, and if it is not found, it should just assign it with (in this case) `email@not.set`.

This works with all supported types - below with a boolean type:

````javascript
{
	"receive-newsletter": { type: Boolean, default: false }
}
````

Now if the `receive-newsletter` key is absent in the data the validator will default it to `false`.

##### Asynchronous Functions

An asynchronous default function works using promises.

````javascript
{
	"created": {
		type: Date,
		default: async function() {
			return new Date();
		}
	}
}
````

##### Synchronous Functions

A synchronous default function works the same way.

````javascript
{
	"created": {
		type: Date,
		default: function() {
			return new Date();
		}
	}
}
````

#### `required`
Values: `true`, `false` or `'implicit'`.

`required` works a little like default. Except if the value is absent a `ValidationError` is thrown.

````javascript
{ type: String, required: true }
`````

The above specifies that the data must be present and be of type `String`.

##### Implicitly Required

Example:

````javascript
{
	type: Object,
	required: 'implicit',
	schema: {
		'user': { type: String, required: true }
		'email': String
	}
}
````

The above example is to illustrate what `'implicit'` does. Because the key `user` in the sub-schema is required, the parent object inherently also becomes required. If none of the sub-schemas are required, the parent object is also not required.

This enables you to specify that some portion of the data is optional, but if it is present - it's content should have some required keys.

See the example below.

````javascript
{
	type: Object,
	required: false,
	schema: {
		'user': { type: String, required: true }
		'email': String
	}
}
````

In the above example the data will validate if the object is not present in the input, even though `user` is required - because the parent object is explicitly *not* required. If the object - on the other hand - *is* present, it must have the `user` key and it must be of type `String`.

> If `required` is not specified, then `Object` and `Array` types are by default `'implicit'`. All other types are by default non-required. Also `required` is ignored if `default` is specified.

#### `equal`
Type: Any

This validator allows for a static value. If this is provided the data must match the value of this validator.

This works with any type (also `Object` and `Array`) and a deep comparison is performed.

> The `type` validator becomes optional when using `equal`.

#### `errors` (Custom Error Messages)

Type: `Object`

`errors` are really not a validator - it allows you to customize the errors emitted by the validators. All validators have default error messages, but these can be customized in order to make them more user and context friendly.

An example below.

````javascript
{
	'username': {
		type: String,
		required: true,
		match: /^[^\s]+$/,
		errors: {
			type: 'Username must be a string.',
			required: 'Username is required.',
			match: 'Username cannot contain any white spaces.'
		}
	}
}
````

Now in case any of the validators fail, they will emit the error message specified - instead of the default built-in error message. The `message` property of `ValidationError` will contain the message on validation failure.

##### Error Shortcuts

There is also a shortcut version for the `errors` validator. The above example can also be expressed like below.

````javascript
{
	'username': {
		type: [String, 'Username must be a string.'],
		required: [true, 'Username is required.'],
		match: [/^[^\s]+$/, 'Username cannot contain any white spaces.']
	}
}
````

It might be a more convenient way, and it maps the errors to the same line as the validator, so it is more easy to read.

### Type Specific Validators

#### Validators Common to `Object` and `Array`

##### `schema`

The `schema` validator of `Object` and `Array` types specifies the schema of their children. Objects have keys and schemas - arrays only have a single schema.

An example below of an object schema with a `user` key.

````javascript
{
	type: Object,
	schema: {
		'username': String
	}
}
````

And an example below of an array of strings.

````javascript
{
	type: Array,
	schema: String
}
````

There is also a shortcut version of describing objects and arrays. You can read more about that below in the [Type Shortcuts](#type-shortcuts) section.

#### `Object` Validators

The `Object` type has only one specific validator - besides the common validators.

##### `unknownKeys`
Type `String` of value: `'allow'`, `'deny'` or `'remove'`

This validator is used to control how unknown keys in objects are handled.

The validator has three options:

* `allow` Pass any unknown key onto the validated object.
* `deny` Throw a `ValidationError` if object has unknown key.
* `remove` Remove the unknown key from the validated object.

> Default is `deny`.

#### `Array` Validators

The `Array` type has three specific validator - besides the common validators.

##### `len`
Type: `Number` or `String`

This ensures that an array has a specific length. This can be either a number or a range. The validator throws an error if the array length is outside the bounds of the specified range(s).

Examples:

````javascript
{
	type: Array,
	len: 2,
	schema: { … }
}
````

> An array that should have exactly 2 items.

````javascript
{
	type: Array,
	len: '2-',
	schema: { … }
}
````

> An array that should have at least 2 items.

````javascript
{
	type: Array,
	len: '-2',
	schema: { … }
}
````

> An array that should have a maximum of 2 items.

````javascript
{
	type: Array,
	len: '2-5',
	schema: { … }
}
````

> An array that should have at least 2 items and a maximum of 5 items.

````javascript
{
	type: Array,
	len: '-2,5,8-',
	schema: { … }
}
````

> Negative values can be wrapped in parentheses.

````javascript
{
	type: Array,
	len: '(-2)-2',
	schema: { … }
}
````

> It also supports non-integer values.

````javascript
{
	type: Array,
	len: '(-2.2)-2.2',
	schema: { … }
}
````

> An array that should have at least 2 items, exactly 5 items or 8 or more items.

##### `unique`
Type: `Boolean`

This ensures that all elements in the array are unique - basically ensuring the array is a set. If two or more elements are the same, the validator throws an error.

Example:

````javascript
{
	type: Array,
	unique: true,
	schema: { … }
}
````

> The `unique` validator does a deep comparison on objects and arrays.

##### `autowrap`
Type: `Boolean`

If the provided data is not an array - but it matches the sub-schema - this will wrap the data in an array before actual validation.

Example:

````javascript
{
	type: Array,
	autowrap: true,
	schema: { … }
}
````

If `autowrap` is set to `true` and auto-wrap fails (the sub-schema cannot validate the data), then the `type` validator will emit a `'Must be of type Array.'` error.

> Default is `false`.

#### `String` Validators

The `String` type has four specific validator - besides the common validators.

##### `trim`
Type: `Boolean`

This does not do any actual validation. Instead it trims the input in both ends - before any other validators are checked. Use this if you want to remove any unforeseen white spaces added at the beginning or end of the string by the user.

##### `len`
Type: `String` or `Number`

This ensures that the string's length is within a specified range. You can use the same formatting as [`Array`'s `len`](#len) validator described above (except it does not support ranges with negative values or non-integers).

##### `match`
Type: `RegExp`

This ensures that a string can be matched against a regular expression. The validator throws an error if the string does not match the pattern.

This example shows a string that must contain a string of at least one character of ASCII letters or decimal numbers:

````javascript
{ type: String, match: /^[a-zA-Z0-9]+$/ }
````

##### `enum`
Type: `Array`

This is complimentary to `match` - as this could also easily be achieved with `match` - but it's simpler and easier to read. The validator ensures that the string can be matched against a set of values. If it does not, it throws a throws a `ValidationError`.

````javascript
{ type: String, enum: ['none','some','all'] }
````

In the above example the string can only have the values of `none`, `some` or `all`.

> Remark that `enum` is case sensitive.

#### `Number` Validators

The `Number` type has only one specific validator - besides the common validators.

> `Number` also does automatic type conversion from `String` to `Number` where possible. You can read more about that and other automatic type conversions in the [Automatic Type Conversion](#automatic-type-conversion) section below

##### `range`
Type: `Number`or `String`

This ensures that the number is within a certain range. If not the validator throws an error.

The `range` validator uses the same formatting as the [`Array`'s `len`](#len) validator described above (except it does not support ranges with negative values or non-integers).

##### `float`
Type: `String` of value: `'allow'`, `'deny'`, `'round'`, `'floor'`, `'ceil'`

This tells the validator how to handle non-integers.

The validator has five options:
* `'allow'` Allow non-integer values.
* `'deny'` Throw a `ValidationError` if the value is a non-integer.
* `'round'` Round value to nearest integer.
* `'floor'` Round to integer less than or equal to value.
* `'ceil'` Round to integer bigger than or equal to value.

> Default is `'allow'`.

#### Custom Types

Custom types are also supported, and all the generic validators work.

An example is below, where `User` is a custom class.

````javascript
{
	'user': { type: User, required: true }
}
````

## `post`

`post` can be used when the possibilities of the validation schema falls short. `post` basically outsources validation to a functions.

> The `type` validator becomes optional when using `post`. You can completely leave out any validation and just use a `post` (or `pre`) validator.

### Example

````javascript
{
	type: Object,
	schema: {
		'password': { type: String, required: true },
		'passwordRepeat': String
	},
	'post': async (data, schema) => {
		if (data.password !== data.passwordRepeat) {
			throw new Error('Passwords must match.');
		}
	}
}
````

In the above example we have specified an object with two keys - `password` and `passwordRepeat`. The validator first makes sure, that the object validates to the schema. If it does it will then call the post validator - which in this example throws an error if passwords do no match.

> * `post` functions works both by returning promises (async functions) and returning a value.

> * If no value is returned the data does not change.

> * Thrown errors are caught and converted to a `ValidationError` internally.

### Options with Post Validators

If you need to pass any options to your custom validator, you can do so by using a special `options` property of the schema, that becomes available when you use `post` (or `pre` - see below).

An example below.

````javascript
{
	'myKey': {
		options: {
			myCustomOptions: 'here'
		},
		post: function(data, schema) {
			// schema.options will now contain whatever options you supplied in the schema.
			// In this example schema.options is { myCustomOptions: 'here'}.
		}
	}
}
````

### Multiple Post Validators

The `post` validator also support an array of functions. Instead of providing just one function, you can provide an array of functions. Synchronous and asynchronous functions can be mixed and matched as necessary.

An example.

````javascript
{
	post: [
		function(data, schema) {
			data(null, myValidatedData);
		},
		async function(data, schema) {
			return mySecondValidatedData
		}
	]
}
````

If, though, any of the post validator functions throws an error, none of the rest of the post validators in the chain will get called, and *isvalid* will throw the error as a `ValidationError`.

> The `post` validator functions are called in order.

## `pre`

`pre` does the exact same thing as `post` described above, except it is called before any other validators are validated. This gives you a chance to transform the data and return it before the actual validation.

## Type Shortcuts

Some types can be specified using shortcuts. Instead of specifying the type, you simply just use the type. This works with `Object` and `Array` types.

In this document we've been using them extensively on `Object` examples, and the first example of this document should have looked like this, if it hadn't been used.

````javascript
isvalid(inputData, {
	type: Object,
	schema: {
		'user': { type: String, required: true },
		'pass': { type: String, required: true }
	}
}, function(err, validData) {
	/*
	err:       Error describing invalid data.
	validData: The validated data.
	*/
});
````

### Object Shortcuts

Object shortcuts are used like this:

````javascript
{
	'user': String
}
````

and is the same as

````javascript
{
	type: Object,
	schema: {
		'user': { type: String }
	}
}
````

Which means that data should be an object with a `user` key of the type `String`.

> Internally the library tests for object shortcuts by examining the absent of the `type`, `post`/`pre` or `equal` validators. So if you need objects schemas with validators for keys with those names, you must explicitly format the object using `type` and `schema` - hence the shortcut cannot be used.

### Array Shortcuts

The same goes for arrays:

````javascript
[String]
````

is the same as

````javascript
{
  type: Array,
  schema: String
}
````

and is the same as

````javascript
{
	type: Array,
	schema: { type: String }
}
````

Which means the data must be an array of strings.

### Other Shortcuts

The others are a bit different. They are - in essence - a shortcut for the validator `type`. Instead of writing `type` you just specify the type directly. Available types are all the supported types of **isvalid**, namely `Object`, `Array`, `String`, `Number`, `Boolean`, `Date` and custom types.

An example below.

````javascript
{
	"favoriteNumber": Number
}
````

The above example is really an example of two shortcuts in one - the `Object` and the `Number` type shortcut. The above example would look like the one below, if shortcuts had not been used.

````javascript
{
	type: Object,
	schema: {
		"favoriteNumber": { type: Number }
	}
}
````

## Automatic Type Conversion

### Numbers

If the schema has type `Number` and the input holds a `String` containing a number, the validator will automatically convert the string into a number.

### Booleans

Likewise will schemas of type `Boolean` will be automatically converted into a `Boolean` if a `String` with the value of `true` or `false` is in the data.

### Dates

If the schema is of type `Date` and the input is a `String` containing an [ISO-8601](http://en.wikipedia.org/wiki/ISO_8601) formatted date, it will automatically be parsed and converted into a `Date`.

ISO-8601 is the date format that `JSON.stringify(...)` converts `Date` instances into, so this allows you to just serialize to JSON on - as an example - the client side, and then **isvalid** will automatically convert that into a `Date` instance when validating on the server side.

# As Connect or Express Middleware

Connect and Express middleware is build in.

Usage:

* `isvalid.validate.body(schema)` validates `req.body`.
* `isvalid.validate.query(schema)` validates `req.query`.
* `isvalid.validate.param(schema)` validates `req.param`.
* `isvalid.validate.parameter(id, schema)` validates `req.param` as a route.

## Example

````javascript
const { validate } = require('isvalid');

app.param('myparam', validate.param(Number)); // Validates parameter through param

app.post('/mypath/:myparam',
	validate.parameter('myparam', Number), // Validates parameter through route.
	validate.query({
		'filter': String
	}),
	validate.body({
		'mykey': { type: String, required: true }
	}),
	function(req, res) {
		// req.param.myparam, req.body and req.query are now validated.
		// - any default values - or type conversion - has been applied.
	}
);
````

> If validation fails, `isvalid` will unset the validated content (`req.body` will become `undefined`). This is to ensure that routes does not get called with invalid data, in case a validation error isn't correctly handled. On the opposite, `req.body` will be set with the validated data (with transforms and automatic type conversion) if validation succeeds.

# Contributing

Contributions are much welcomed, and some great contributions by others have been provided throughout the years.

If you feel like something is missing, please send me a pull request. It is, though, important, that you you follow any new features up with unit tests.

# License

MIT
