'use strict';

var axios = require('axios');
var cheerio = require('cheerio');

var NEWS_URL_URI = 'https://myanimelist.net/news?p=';

/* istanbul ignore next */
var byProperty = function byProperty(prop) {
  return function (a, b) {
    return typeof a[prop] === 'number' ? a[prop] - b[prop] : a[prop] < b[prop] ? -1 : a[prop] > b[prop] ? 1 : 0;
  };
};

// 160 news. This is already expensive enough
module.exports = function () {
  var nbNews = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 160;

  return new Promise(function (resolve, reject) {
    var maxPage = Math.ceil(nbNews / 20) + 1;

    var promises = [];

    for (var i = 1; i < maxPage; ++i) {
      promises.push(axios.get('' + NEWS_URL_URI + i));
    }

    axios.all(promises).then(axios.spread(function () {
      var _arguments = arguments;

      var result = [];

      var _loop = function _loop(_i) {
        var data = _arguments['' + _i].data;

        var $ = cheerio.load(data);

        var pageElements = $('.news-unit-right'); // 20 elements

        // Pictures for each element
        var images = [];
        $('.image').each(function () {
          images.push($(this).attr('src'));
        });

        // Get links for info
        var links = [];
        $('.image-link').each(function () {
          links.push($(this).attr('href'));
        });

        // Gathering news' Titles
        var titles = pageElements.find('p.title').text().split('\n      ');
        titles.shift();
        var texts = pageElements.find('div.text').text().split('\n      ');
        texts.shift();

        for (var _i2 = 0, l = titles.length; _i2 < l; ++_i2) {
          titles[_i2] = titles[_i2].slice(0, -5);
          texts[_i2] = texts[_i2].slice(0, -5);
        }

        for (var _i3 = 0, _l = titles.length; _i3 < _l; ++_i3) {
          var tmp = links[_i3].split('/');
          result.push({
            title: titles[_i3],
            link: links[_i3],
            image: images[_i3],
            text: texts[_i3],
            newsNumber: tmp[tmp.length - 1]
          });
        }
      };

      for (var _i = 0; _i < maxPage - 1; ++_i) {
        _loop(_i);
      }

      result.sort(byProperty('newsNumber'));
      result.reverse();
      resolve(result.slice(0, nbNews));
    })).catch( /* istanbul ignore next */function (err) {
      return reject(err);
    });
  });
};