'use strict';

var officialApi = require('./officialApi');
var getSeason = require('./seasons.js');
var getNewsNoDetails = require('./news');

var _require = require('./info'),
    getInfoFromName = _require.getInfoFromName,
    getInfoFromURL = _require.getInfoFromURL,
    getResultsFromSearch = _require.getResultsFromSearch;

var _require2 = require('./watchList'),
    getWatchListFromUser = _require2.getWatchListFromUser;

module.exports = {
  officialApi: officialApi,
  getSeason: getSeason,
  getNewsNoDetails: getNewsNoDetails,
  getInfoFromName: getInfoFromName,
  getInfoFromURL: getInfoFromURL,
  getResultsFromSearch: getResultsFromSearch,
  getWatchListFromUser: getWatchListFromUser
};