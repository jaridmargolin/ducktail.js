/*!
 * test/ducktail.js
 * 
 * Copyright (c) 2014
 */

/* -----------------------------------------------------------------------------
 * dependencies
 * ---------------------------------------------------------------------------*/

// core
var path = require('path');
var fs   = require('fs');

// 3rd party
var assert = require('chai').assert;
var sinon  = require('sinon');

// lib
var ducktail = require('../lib/ducktail');


/* -----------------------------------------------------------------------------
 * reusable
 * ---------------------------------------------------------------------------*/

var fakePath = path.resolve('./test/fixtures/fake.hbs');
var tmplPath = path.resolve('./test/fixtures/tmpl.hbs');
var tmplData = { title: 'Title' };


/* -----------------------------------------------------------------------------
 * test
 * ---------------------------------------------------------------------------*/

describe('ducktail.js', function () {

  /* ---------------------------------------------------------------------------
   * render()
   * -------------------------------------------------------------------------*/

  describe('render()', function () {

    beforeEach(function () {
      this.readFileSpy = sinon.spy(fs, 'readFile');
    });

    afterEach(function () {
      this.readFileSpy.restore();
      ducktail.clearCache();
    });

    it('Should render file.', function (done) {
      ducktail.render(tmplPath, tmplData, function (err, contents) {
        assert.equal(contents, '<h1>Title</h1>');
        done();
      });
    });

    it('Should return err if file does not exist.', function (done) {
      ducktail.render(fakePath, tmplData, function (err, contents) {
        assert.ok(err);
        done();
      });
    });

    it('Should cache file after intial render.', function (done) {
      var self = this;

      ducktail.render(tmplPath, tmplData, function (err, contents) {
        ducktail.render(tmplPath, tmplData, function (err, contents) {
          assert.equal(self.readFileSpy.callCount, 1);
          done();
        });
      });
    });

  });


  /* ---------------------------------------------------------------------------
   * clearCache()
   * -------------------------------------------------------------------------*/

  describe('clearCache()', function () {

    it('Should remove files from cache.', function (done) {
      var readFileSpy = sinon.spy(fs, 'readFile');

      ducktail.render(tmplPath, tmplData, function (err, contents) {
        ducktail.clearCache();
        ducktail.render(tmplPath, tmplData, function (err, contents) {
          assert.equal(readFileSpy.callCount, 2);
          done();
        });
      });
    });
    
  });

});