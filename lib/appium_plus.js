'use strict';

var Wd = require('wd');
var PromiseChainWebdriver = Wd.PromiseChainWebdriver;
var Util = require('util');
var Url = require('url');
var _ = require('lodash');
var Q = require('q');
var should = require('chai').should();

function AppiumDriver(server) {
  PromiseChainWebdriver.call(this, Url.parse(server));
  this.modMethods = {};
}

Util.inherits(AppiumDriver, PromiseChainWebdriver);

AppiumDriver.prototype.waitTillAvailable = function(selector, by) {
  by = by || 'accessibility id';
  return this.waitForElement(by, selector, {
    timeout: 60000,
    asserter: Wd.isDisplayed
  });
};

// [by] could be 'name', 'xpath', 'accessibility id', '-ios uiautomation', etc; default is 'accessibility id'
AppiumDriver.prototype.clickEl = function(selector, by) {
  by = by || 'accessibility id';
  return this
  .waitTillAvailable(selector, by)
  .click();
};

// [by] could be 'name', 'xpath', 'accessibility id', '-ios uiautomation', etc; default is 'accessibility id'
AppiumDriver.prototype.typeEl = function(value, selector, by) {
  by = by || 'accessibility id';
  return this
  .waitTillAvailable(selector, by)
  .sendKeys(value);
};

AppiumDriver.prototype.getEls = function(selector, by) {
  by = by || 'class name';
  return this
  .waitTillAvailable(selector, by)
  .elements(by, selector);
};

AppiumDriver.prototype.getEl = function(selector, by) {
  by = by || 'accessibility id';
  return this
  .waitTillAvailable(selector, by)
  .element(by, selector);
};

AppiumDriver.prototype.hasEl = function(selector, by) {
  by = by || 'accessibility id';
  return this
  .hasElement(by, selector);
};

AppiumDriver.prototype.hasComponent = function(selector, by, assertion) {
  return this
  .hasEl(selector, by)
  .then(assertion);
},

// [by] could be 'name', 'xpath', 'accessibility id', '-ios uiautomation', etc; default is 'accessibility id'
AppiumDriver.prototype.getElAttribute = function(attr, selector, by) {
  by = by || 'accessibility id';
  return this
  .waitTillAvailable(selector, by)
  .getAttribute(attr);
};

AppiumDriver.prototype.bindModule = function(mod) {
  var self = this;

  _.functions(mod).forEach(function(name) {
    if (!self.modMethods[name]) {
      self.modMethods[name] = {};
      self.modMethods[name].command = mod[name];
      self.modMethods[name].locators = mod.locators;
    } else {
      // throw out duplicated method name exception
      throw new Error(Util.format('method %s (from %s) has already existed', name, mod.name));
    }

    var wrappedMethod = function() {
      var args = _.toArray(arguments);
      args.unshift(self, self.modMethods[name].locators);
      // args.unshift(self);

      var promise = new Q(self.modMethods[name].command.apply(self, args));
      self._enrich(promise);
      return promise;
    };

    // bind new promise to appium driver
    AppiumDriver.prototype[name] = wrappedMethod;
  });
};

// click built-in Back button
AppiumDriver.prototype.goBack = function(assertion) {
  return this
  .waitTillAvailable('Back')
  .clickEl('Back');
};

// click built-in Cancel button
AppiumDriver.prototype.cancelLastMove = function(assertion) {
  return this
  .waitTillAvailable('Cancel')
  .clickEl('Cancel');
};

module.exports = AppiumDriver;

