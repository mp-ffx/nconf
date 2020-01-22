/*
 * env.js: Simple memory-based store for environment variables
 *
 * (C) 2011, Charlie Robbins and the Contributors.
 *
 */

var util = require('util'),
    camelCase = require('lodash.camelcase'),
    common = require('../common'),
    Memory = require('./memory').Memory;

//
// ### function Env (options)
// #### @options {Object} Options for this instance.
// Constructor function for the Env nconf store, a simple abstraction
// around the Memory store that can read process environment variables.
//

var defaultSeparator = '__';

var toCamelCase = function(data) { // eslint-disable-line
  var key = data.key;
  var value = data.value;
  var keyParts = key.split(defaultSeparator);
  var camelCasedKeyParts = [];
  for (var i = 0; i < keyParts.length; i += 1) {
    camelCasedKeyParts.push(camelCase(keyParts[i]))
    if (camelCasedKeyParts[i].length === 0) {
      return false;
    }
  }
  return {
    key: camelCasedKeyParts.join(defaultSeparator),
    value: value
  }
}


var Env = exports.Env = function (options) {
  Memory.call(this, options);

  options        = options || {};
  this.type      = 'env';
  this.readOnly  = options.readOnly !== undefined? options.readOnly : true;
  this.whitelist = options.whitelist || [];
  this.separator = options.separator || defaultSeparator;
  this.lowerCase = options.lowerCase || false;
  this.parseValues = options.parseValues || false;
  this.transform = options.transform || toCamelCase;

  if (({}).toString.call(options.match) === '[object RegExp]'
      && typeof options !== 'string') {
    this.match = options.match;
  }

  if (options instanceof Array) {
    this.whitelist = options;
  }
  if (typeof(options) === 'string' || options instanceof RegExp) {
    this.separator = options;
  }
};

// Inherit from the Memory store
util.inherits(Env, Memory);

//
// ### function loadSync ()
// Loads the data passed in from `process.env` into this instance.
//
Env.prototype.loadSync = function () {
  this.loadEnv();
  return this.store;
};

//
// ### function loadEnv ()
// Loads the data passed in from `process.env` into this instance.
//
Env.prototype.loadEnv = function () {
  var self = this;

  var env = process.env;

  if (this.lowerCase) {
    env = {};
    Object.keys(process.env).forEach(function (key) {
      env[key.toLowerCase()] = process.env[key];
    });
  }

  if (this.transform) {
    env = common.transform(env, this.transform);
    // warning: kind of an ugly hack, should be changed sometime...
    self.whitelist = Object.keys(
      common.transform(
        self.whitelist.reduce(function (acc, value) {
          acc[value] = 'foo'
          return acc
        }, {}),
        this.transform
      )
    )
  }

  var tempWrite = false;

  if(this.readOnly) {
    this.readOnly = false;
    tempWrite = true;
  }

  Object.keys(env).filter(function (key) {
    if (self.match && self.whitelist.length) {
      return key.match(self.match) || self.whitelist.indexOf(key) !== -1
    }
    else if (self.match) {
      return key.match(self.match);
    }
    else {
      return !self.whitelist.length || self.whitelist.indexOf(key) !== -1
    }
  }).forEach(function (key) {

    var val = env[key];

    if (self.parseValues) {
      val = common.parseValues(val);
    }

    if (self.separator) {
      self.set(common.key.apply(common, key.split(self.separator)), val);
    }
    else {
      self.set(key, val);
    }
  });

  if (tempWrite) {
    this.readOnly = true;
  }

  return this.store;
};
