'use strict';

var axios = require('axios');
var cheerio = require('cheerio');

var SEASON_URI = 'https://myanimelist.net/anime/season/';
var maxYear = 1901 + new Date().getYear();
var possibleSeasons = {
  'winter': 1,
  'spring': 1,
  'summer': 1,
  'fall': 1
};

var type2Class = {
  TV: 1,
  OVAs: 2,
  Movies: 3,
  Specials: 4,
  ONAs: 5
};

var getType = function getType(type, $) {
  var result = [];
  var classToSearch = '.js-seasonal-anime-list-key-' + type2Class[type] + ' .seasonal-anime.js-seasonal-anime';

  $(classToSearch).each(function () {
    if (!$(this).hasClass('kids') && !$(this).hasClass('r18')) {
      var general = $(this).find('div:nth-child(1)');
      var picture = $(this).find('.image').find('img');
      var prod = $(this).find('.prodsrc');
      var info = $(this).find('.information');

      result.push({
        picture: picture.attr(picture.hasClass('lazyload') ? 'data-src' : 'src'),
        synopsis: $(this).find('.synopsis').find('span').text().trim(),
        licensor: $(this).find('.synopsis').find('p').attr('data-licensors').slice(0, -1),
        title: general.find('.title').find('p').text().trim(),
        link: general.find('.title').find('a').attr('href').replace('/video', ''),
        genres: general.find('.genres').find('.genres-inner').text().trim().split('\n      \n        '),
        producers: prod.find('.producer').text().trim().split(', '),
        fromType: prod.find('.source').text().trim(),
        nbEp: prod.find('.eps').find('a').text().trim().replace(' eps', ''),
        releaseDate: info.find('.info').find('span').text().trim(),
        score: info.find('.scormem').find('.score').text().trim()
      });
    }
  });

  return result;
};

/**
 * Allows to gather seasonal information from livechart.me.
 * @param {number|string} year - The year of the season you want to look up for.
 * @param {string} season - Can be either "winter", "spring", "summer" or "fall".
 */
var getSeasons = function getSeasons(year, season) {
  return new Promise(function (resolve, reject) {
    if (!possibleSeasons[season]) {
      reject(new Error('[Mal-Scraper]: Entered season does not match any existing season.'));
      return;
    }
    if (!(year <= maxYear) || !(year >= 1917)) {
      reject(new Error('[Mal-Scraper]: Year must be between 1917 and ' + maxYear + '.'));
      return;
    }

    var uri = '' + SEASON_URI + year + '/' + season;

    axios.get(uri).then(function (_ref) {
      var data = _ref.data;

      var $ = cheerio.load(data);

      resolve({
        TV: getType('TV', $),
        OVAs: getType('OVAs', $),
        ONAs: getType('ONAs', $),
        Movies: getType('Movies', $),
        Specials: getType('Specials', $)
      });
    }).catch( /* istanbul ignore next */function (err) {
      reject(err);
    });
  });
};

module.exports = getSeasons;