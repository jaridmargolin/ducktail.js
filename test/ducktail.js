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

var fakePath     = path.resolve('./test/fixtures/fake.hbs');
var tmplPath     = path.resolve('./test/fixtures/tmpl.hbs');
var wPartialPath  = path.resolve('./test/fixtures/with-partial.hbs');
var wHelperPath  = path.resolve('./test/fixtures/with-helper.hbs');
var partialPath = path.resolve('./test/fixtures/partial.hbs');
var tmplData     = { title: 'Title', phone: '8025557788' };

var partials = {
  partial: partialPath
};

var helpers = {
  formatPhone: function(phoneNumber) {
    phoneNumber = phoneNumber.toString();
    return '(' + phoneNumber.substr(0,3) + ') ' + phoneNumber.substr(3,3) + '-' + phoneNumber.substr(6,4);
  }
};


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

    it('Should render specified partials.', function (done) {
      ducktail.render(wPartialPath, tmplData, {
        partials: partials
      }, function (err, contents) {
        assert.equal(contents, '<h1>Title</h1>\n<h2>Partial</h2>');
        done();
      });
    });

    it('Should render using specified helpers.', function (done) {
      ducktail.render(wHelperPath, tmplData, {
        helpers: helpers
      }, function (err, contents) {
        assert.equal(contents, '<p>(802) 555-7788</p>');
        done();
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