/*!
 * ducktail.js
 * 
 * Copyright (c) 2014
 */

/* -----------------------------------------------------------------------------
 * dependencies
 * ---------------------------------------------------------------------------*/

// core
var fs   = require('fs');
var path = require('path');

// 3rd party
var _          = require('underscore');
var Handlebars = require('handlebars');
var cache      = require('memory-cache');

// lib
var async = require('./async');


/* -----------------------------------------------------------------------------
 * ducktail
 * ---------------------------------------------------------------------------*/

/**
 * @public
 * @namespace
 *
 * @desc Handlebars with built in file cache.
 */
var ducktail = {};


/* -----------------------------------------------------------------------------
 * public api
 * ---------------------------------------------------------------------------*/

/**
 * @public
 * @memberof ducktail
 *
 * @desc Render tmpl by given path with specified data. Add file to cache
 * to avoid duplicate fileReads.
 *
 * @example
 * ducktail.render('path/to/tmpl', {
 *   prop1: 'super duper important'
 * }, function (err, contents) {
 *   console.log(contents);
 * });
 *
 * @param {string} tmplPath - File path to template.
 * @param {object} data - Template data to render.
 * @param {object} opts - Options for passing partials/helpers.
 * @param {function} callback - Callback executed after template rendered.
 */
ducktail.render = function (tmplPath, data, opts, callback) {
  // allow optional opts
  if (_.isFunction(opts)) {
    callback = opts;
    opts = {};
  }

  // defaults
  opts.partials = opts.partials || {};
  opts.helpers = opts.helpers || {};

  // proxy to render file after argument handling
  ducktail.renderFile(tmplPath, data, opts, callback);
};

/**
 * @public
 * @memberof ducktail
 *
 * @desc Template contents using specified filePath, data, partials and helpers.
 *   Cache all I/O reads.
 *
 * @example
 * ducktail.renderFile('path/to/tmpl', {
 *   prop1: 'super duper important'
 * }, {}, function (err, contents) {
 *   console.log(contents);
 * });
 *
 * @param {string} tmplPath - File path to template.
 * @param {object} data - Template data to render.
 * @param {function} callback - Callback executed after template rendered.
 */
ducktail.renderFile = function (tmplPath, data, opts, callback) {
  ducktail._get(tmplPath, opts.partials, function (err, results) {
    if (err) {
      return callback(err);
    }

    callback(null, ducktail.renderTmpl(results[0], data, {
      partials: results[1],
      helpers: opts.helpers
    }));
  });
};

/**
 * @public
 * @memberof ducktail
 *
 * @desc Small helper used to actually compile and render template.
 *
 * @example
 * var contents = ducktail.renderTmpl(tmpl, {
 *   prop1: 'super duper important'
 * });
 *
 * @param {string} tmpl - Template string.
 * @param {object} data - Template data to render.
 */
ducktail.renderTmpl = function (tmpl, data, opts) {
  tmpl = _.isFunction(tmpl) ? tmpl : Handlebars.compile(tmpl);
  opts = opts || {};

  ducktail._register(opts);
  var contents = tmpl(data);
  ducktail._unregister(opts);

  return contents;
};

/**
 * @public
 * @memberof ducktail
 *
 * @desc Clear ducktail file cache.
 *
 * @example
 * ducktail.clearCache();
 */
ducktail.clearCache = function () {
  cache.clear();
};


/* -----------------------------------------------------------------------------
 * private
 * ---------------------------------------------------------------------------*/

/**
 * @private
 * @memberof ducktail
 *
 * @desc Retrieve contents for tmpl and all partials.
 *
 * @param {string} tmplPath - File path to template.
 * @param {object} partials - Partials where key represents the name and the value
 *   represents the file path.
 * @param {function} callback - Function executed after contents have been
 *   retrieved.
 */
ducktail._get = function (tmplPath, partials, callback) {
  async.parallel([
    async.apply(ducktail._getTmpl, tmplPath),
    async.apply(ducktail._getPartials, partials)
  ], callback);
};

/**
 * @private
 * @memberof ducktail
 *
 * @desc Get compiled template by retrieving from cache, or if necessary, disk.
 *
 * @param {string} tmplPath - All templates will be cached/looked up via path.
 * @param {function} callback - Function to execute once template has
 *   been retrieved.
 */
ducktail._getTmpl = function (tmplPath, callback) {
  var tmpl = cache.get(tmplPath);

  return tmpl
    ? ducktail._returnCached(tmpl, callback)
    : ducktail._returnRead(tmplPath, callback);
};

/**
 * @private
 * @memberof ducktail
 *
 * @desc Wrapper around return cached template to keep async consistency on
 *   call to `_getTmpl`.
 *
 * @param {string} tmpl - Template contents.
 * @param {function} callback - Callback passed to `_getTmpl`.
 */
ducktail._returnCached = function (tmpl, callback) {
  process.nextTick(function () {
    callback(null, tmpl);
  });
};

/**
 * @private
 * @memberof ducktail
 *
 * @desc Read template file contents from disk.
 *
 * @param {string} tmplPath - Path of template to retrieve contents of.
 * @param {function} callback - Callback passed to `_getTmpl`.
 */
ducktail._returnRead = function (tmplPath, callback) {
  fs.readFile(tmplPath, {
    encoding: 'utf8'
  }, function (err, tmpl) {
    return err
      ? callback(err)
      : ducktail._cache(tmplPath, tmpl, callback);
  });
};

/**
 * @private
 * @memberof ducktail
 *
 * @desc Cache tmpl contents by tmplPath.
 *
 * @param {string} tmplPath - Path of template.
 * @param {string} tmpl - Template contents.
 * @param {function} callback - Callback passed to `_getTmpl`.
 */
ducktail._cache = function (tmplPath, tmpl, callback) {
  var compiled = Handlebars.compile(tmpl);

  cache.put(tmplPath, compiled);
  callback(null, compiled);
};

/**
 * @private
 * @memberof ducktail
 *
 * @desc Loop over all partials and get file contents.
 *
 * @param {obj} partials - Partials where key represents the name and the value
 *   represents the file path.
 * @param {function} callback - Function to execute once we have fetched all
 *   partials.
 */
ducktail._getPartials = function (partials, callback) {
  async.mapObj(partials, function (tmplPath, name, next) {
    ducktail._getTmpl(tmplPath, next);
  }, callback);
};

/**
 * @private
 * @memberof ducktail
 *
 * @desc Register Handlebars partials and helpers.
 *
 * @param {object} opts - Options for passing partials/helpers.
 */
ducktail._register = function (opts) {
  ducktail._loop(opts.partials, 'registerPartial');
  ducktail._loop(opts.helpers, 'registerHelper');
};

/**
 * @private
 * @memberof ducktail
 *
 * @desc Unregister Handlebars partials and helpers.
 *
 * @param {object} opts - Options for passing partials/helpers.
 */
ducktail._unregister = function (opts) {
  ducktail._loop(opts.partials, 'unregisterPartial');
  ducktail._loop(opts.helpers, 'unregisterHelper');
};

/**
 * @private
 * @memberof ducktail
 *
 * @desc Loop over opts object and register/unregister partials/helpers.
 *
 * @param {object} opts - Opts object containing partials/helpers.
 */
ducktail._loop = function (obj, action) {
  _.each(obj, function (val, key) {
    Handlebars[action](key, val);
  });
};


/* -----------------------------------------------------------------------------
 * export
 * ---------------------------------------------------------------------------*/

module.exports = ducktail;