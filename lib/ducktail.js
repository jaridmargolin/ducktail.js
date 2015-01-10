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

// lib
var Handlebars = require('handlebars');
var cache      = require('memory-cache');


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
 * @param {function} callback - Callback executed after template rendered.
 */
ducktail.render = function (tmplPath, data, callback) {
  var tmpl = cache.get(tmplPath);

  if (tmpl) {
    return process.nextTick(function () {
      callback(null, ducktail._render(tmpl, data));
    });
  }

  fs.readFile(tmplPath, {
    encoding: 'utf8'
  }, function (err, tmpl) {
    if (err) {
      return callback(err);
    }

    cache.put(tmplPath, tmpl);
    callback(null, ducktail._render(tmpl, data));
  });
};

/**
 * @private
 * @memberof ducktail
 *
 * @desc Small helper used to actually compile and render template.
 *
 * @param {string} tmpl - Template string.
 * @param {object} data - Template data to render.
 */
ducktail._render = function (tmpl, data) {
  return Handlebars.compile(tmpl)(data);
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
 * export
 * ---------------------------------------------------------------------------*/

module.exports = ducktail;