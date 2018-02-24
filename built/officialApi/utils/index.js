'use strict';

var _require = require('xml2js'),
    parseString = _require.parseString;

var _require2 = require('js2xmlparser'),
    parse = _require2.parse;

var xml2JSON = function xml2JSON(string) {
  var json = void 0;
  var error = null;

  parseString(string, function (err, res) {
    !err ? json = res : error = err;
  });

  return error || json;
};

var JSON2Xml = function JSON2Xml(json) {
  return parse('entry', json);
};

module.exports = {
  xml2JSON: xml2JSON,
  JSON2Xml: JSON2Xml
};