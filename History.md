# History

NOTICE: If your version number is not explicitly specified, it contains bug fixes or changes to internal workings.

## Version 4.0.0

* Converted to use ES modules.
* The `allowNull` validator has been changed to `null`.

## Version 3.0.0

* The minimum ECMAScript version supported has been bumped to 2018.

## Version 2.7.0

* The ability for custom errors has been under the hood for some time - just not very well tested. Now it's official.
* Added the `len` validator on `String`s.

## Version 2.6.0

* Added the ability to also use strings to specify type.
* Bugfixes

## Version 2.5.0

* Added a middleware to validate parameters as a route through `validate.parameter(id, schema)`.

## Version 2.4.6

* Added the ability to prioritize order of validation when validating object keys. Use the `priority` key.

## Version 2.4.0

* Now supports custom types (classes) also.

## Version 2.3.0

* Changed `ValidationError` and `SchemaError` to `Error` subclass.

## Version 2.2.0

* Added the post custom validators that are validated before any other validator is validated.

## Version 2.1.0

* Options now support a custom base key path.

## Version 2.0.0

* Everything now works asynchronously using promises.
* `allowUnknownKeys` is not officially removed.
* `autowrap` no longer support `transparent`.
* `custom` has been renamed `post`.
* `custom` can now return a promise (be async).
* `default` can now also both be a explicit value, a function that returns a value or a function that returns a promise.

> Middleware for express and connect has not changed.

## Version 1.5.1

* Allow any type to be specified as a custom error (useful for localization).

## Version 1.5.0

* Browser compatibility.

## Version 1.4.0

* Introduced the `autowrap` validator on `Array` types.
* Allows for mongoose type custom errors (eg. `required: [true, 'This is required.']`).

## Version 1.2.0

* Type shortcuts now also include `String`, `Number`, `Boolean` and `Date`.
* The `custom` validator can now take an array of functions.

## In Version 1.0.0

* Opt-in to `null` values using the `allowNull` validator.
* The object `allowUnknownKeys` validator has been deprecated in favor of the new `unknownKeys` validator.

> Version `>= 0.2.4 < 1.0.0` has a bug where `null` is sometimes validated even when input is required. Version 1.0.0 fixes this and introduces the common `allowNull` validator to control the behavior of `null` values.

## In Version 0.3.0

* Bug fixes and internal improvements.
* `type` and `custom` can now be used alongside each other.
* Default functions and custom validators now also works synchronously.
* Strings now has an `enum` validator.
* Changed license to MIT
* Improved this file with a TOC
* Added middleware for Connect/Express (from [isvalid-express](https://github.com/trenskow/isvalid-express)).

## In Version 0.2.0

* It now catches more errors in schemas - such as wrong values on validators.
* Schema errors are now thrown as a `SchemaError` which contains schema that failed through the `schema` property.
* The library is now completely asynchronous - allowing for I/O while formalizing, validating and comparing.
* Formalizer is publicly exposed in order to pre-formalize schemas manually.
* Schemas are now formalized per demand. Large schemas are formalized by the validator as they are needed.
* ValidationErrors now contain the pre-formalized schema - for better identification by developer.

## In Version 0.1.0

 * Automatic parsing of [ISO-8601](http://en.wikipedia.org/wiki/ISO_8601) dates into Date - contributed by [thom-nic](https://github.com/thom-nic).
 * Errors are thrown if validators are used out of context.
 * ValidationError now contains the `validator` property - specifying which validator actually failed.
 * You can now specify custom error messages using the `error` validator.
 * `Object` now supports the `allowUnknownKeys` validator.
