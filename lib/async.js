/*!
 * async.js
 * 
 * Copyright (c) 2014
 */

/* -----------------------------------------------------------------------------
 * dependencies
 * ---------------------------------------------------------------------------*/

// 3rd party
var async = require('async');


/* -----------------------------------------------------------------------------
 * async
 * ---------------------------------------------------------------------------*/

/**
 * @public
 * memberof async
 *
 * @desc A mapObj method for async.
 *
 * @param {object} obj - Object to map
 * @param {function} iterator - Iterator to call for every key.
 * @param {function} callback - Function to execute once all iterators have
 *   executed their individual callbacks.
 */
async.mapObj = function (obj, iterator, callback) {
  var result = {};

  async.each(Object.keys(obj), function (key, next) {
    iterator(obj[key], key, function (err, val) {
      result[key] = val;
      next(err);
    });
  }, function (err) {
    callback(err, result);
  });
};


/* -----------------------------------------------------------------------------
 * export
 * ---------------------------------------------------------------------------*/

module.exports = async;