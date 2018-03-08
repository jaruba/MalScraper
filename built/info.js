'use strict';

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var axios = require('axios');
var cheerio = require('cheerio');
var match = require('match-sorter');

var SEARCH_URI = 'https://myanimelist.net/search/prefix.json';

var getFromBorder = function getFromBorder($, t) {
  return $('span:contains("' + t + '")').parent().text().trim().split(' ').slice(1).join(' ').split('\n')[0].trim();
};

var parseCharacterOrStaff = function parseCharacterOrStaff(tr) {
  var isStaff = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;


  var img = tr.find('img').attr('data-srcset');

  if (img && img.includes(' ')) img = img.substr(0, img.indexOf(' '));

  return JSON.parse(JSON.stringify({
    link: tr.find('td:nth-child(1)').find('a').attr('href'),
    name: tr.find('td:nth-child(2)').text().trim().split('\n')[0],
    role: tr.find('td:nth-child(2)').text().trim().split('\n')[2].trim(),
    thumbnail: img,
    seiyuu: !isStaff ? {
      link: tr.find('td:nth-child(3)').find('a').attr('href'),
      name: tr.find('td:nth-child(3)').find('a').text().trim()
    } : undefined
  }));
};

var getSimilar = function getSimilar($) {
  var similar = [];
  $('#anime_recommendation .anime-slide .btn-anime').each(function () {
    var link = $(this).find('.link');
    if (link && link.length) {
      var link = link.attr('href');
      if (link && link.includes('/')) {
        var parts = link.split('/');
        if (parts && parts.length) {
          var idParts = parts[parts.length - 1];
          if (idParts && idParts.includes('-')) {
            idParts = idParts.split('-');
            if (idParts && idParts.length == 2) {
              similar.push(parseInt(idParts[0] == 1735 ? idParts[1] : idParts[0]));
            }
          }
        }
      }
    }
  });
  return similar;
};

var getReviews = function getReviews($) {
  var reviews = [];
  $('.borderDark').each(function () {
    var rvw = $(this).find('.textReadability');
    var continueRvw = rvw.find('span');
    continueRvw.find('div').remove();
    continueRvw = continueRvw.text();
    rvw.find('span').remove();
    rvw.find('table').remove();
    rvw.find('a').remove();
    rvw = rvw.text().trim();

    var topPart = $(this).find('.spaceit').first();

    var topLeft = $(topPart.children('div')[1]).find('a').first();

    var thumbnail = topLeft.find('img').attr('data-src');

    if (!topLeft.length) return;

    var name = topLeft.attr('href');
    name = name.substr(name.indexOf('/profile/')).replace('/profile/', '');

    var topRight = $(topPart.children('div')[0]);

    var rating = $(topRight.children('div')[2]);
    rating.find('a').remove();
    rating = parseInt(rating.text().replace(':', '').trim());

    reviews.push({
      name: name, thumbnail: thumbnail, rating: rating, review: rvw, continue: continueRvw
    });
  });
  return reviews;
};

var getCharactersAndStaff = function getCharactersAndStaff($) {
  var results = {
    characters: [],
    staff: []

    // Characters
  };var leftC = $('div.detail-characters-list').first().find('div.left-column');
  var rightC = $('div.detail-characters-list').first().find('div.left-right');

  var nbLeftC = leftC.children('table').length;
  var nbRightC = rightC.children('table').length;

  // Staff
  var leftS = $('div.detail-characters-list').last().find('div.left-column');
  var rightS = $('div.detail-characters-list').last().find('div.left-right');

  var nbLeftS = leftS.children('table').length;
  var nbRightS = rightS.children('table').length;

  // Characters
  for (var i = 1; i <= nbLeftC; ++i) {
    results.characters.push(parseCharacterOrStaff(leftC.find('table:nth-child(' + i + ') > tbody > tr')));
  }

  for (var _i = 1; _i <= nbRightC; ++_i) {
    results.characters.push(parseCharacterOrStaff(rightC.find('table:nth-child(' + _i + ') > tbody > tr')));
  }

  // Staff
  for (var _i2 = 1; _i2 <= nbLeftS; ++_i2) {
    results.staff.push(parseCharacterOrStaff(leftS.find('table:nth-child(' + _i2 + ') > tbody > tr'), true));
  }

  for (var _i3 = 1; _i3 <= nbRightS; ++_i3) {
    results.staff.push(parseCharacterOrStaff(rightS.find('table:nth-child(' + _i3 + ') > tbody > tr'), true));
  }

  return results;
};

var parsePage = function parsePage(data, malId) {
  var $ = cheerio.load(data);
  var result = {};

  result.title = $('span[itemprop="name"]').first().text();
  result.synopsis = $('.js-scrollfix-bottom-rel span[itemprop="description"]').text();
  result.picture = $('img.ac').attr('src');

  var staffAndCharacters = getCharactersAndStaff($);
  result.characters = staffAndCharacters.characters;
  result.staff = staffAndCharacters.staff;

  result.reviews = getReviews($);

  result.similar = malId ? getSimilar($, malId) : [];

  result.trailer = $('a.iframe.js-fancybox-video.video-unit.promotion').attr('href');

  // Parsing left border.
  result.englishTitle = getFromBorder($, 'English:');
  result.japaneseTitle = getFromBorder($, 'Japanese:');
  result.synonyms = getFromBorder($, 'Synonyms:');
  result.type = getFromBorder($, 'Type:');
  result.episodes = getFromBorder($, 'Episodes:');
  result.status = getFromBorder($, 'Status:');
  result.aired = getFromBorder($, 'Aired:');
  result.premiered = getFromBorder($, 'Premiered:');
  result.broadcast = getFromBorder($, 'Broadcast:');
  result.producers = getFromBorder($, 'Producers:').split(',       ');
  result.studios = getFromBorder($, 'Studios:').split(',       ');
  result.source = getFromBorder($, 'Source:');
  result.genres = getFromBorder($, 'Genres:').split(', ');
  result.duration = getFromBorder($, 'Duration:');
  result.rating = getFromBorder($, 'Rating:');
  result.score = getFromBorder($, 'Score:').split(' ')[0].slice(0, -1);
  result.scoreStats = getFromBorder($, 'Score:').split(' ').slice(1).join(' ').slice(1, -1);
  result.ranked = getFromBorder($, 'Ranked:').slice(0, -1);
  result.popularity = getFromBorder($, 'Popularity:');
  result.members = getFromBorder($, 'Members:');
  result.favorites = getFromBorder($, 'Favorites:');

  return result;
};

var getInfoFromURL = function getInfoFromURL(url, malId) {
  return new Promise(function (resolve, reject) {
    if (!url || typeof url !== 'string' || !url.toLocaleLowerCase().includes('myanimelist')) {
      reject(new Error('[Mal-Scraper]: Invalid Url.'));
    }

    axios.get(url).then(function (_ref) {
      var data = _ref.data;

      var res = parsePage(data, malId);
      res.id = +url.split('/').splice(-2, 1)[0];
      resolve(res);
    }).catch( /* istanbul ignore next */function (err) {
      return reject(err);
    });
  });
};

var getResultsFromSearch = function getResultsFromSearch(keyword) {
  return new Promise(function (resolve, reject) {
    if (!keyword) reject(new Error('[Mal-Scraper]: Received no keyword to search.'));

    axios.get(SEARCH_URI, {
      params: {
        type: 'anime',
        keyword: keyword
      }
    }).then(function (_ref2) {
      var data = _ref2.data;

      var items = [];

      data.categories.forEach(function (elem) {
        elem.items.forEach(function (item) {
          items.push(item);
        });
      });

      resolve(items);
    }).catch( /* istanbul ignore next */function (err) {
      reject(err);
    });
  });
};

var getBestMatch = function getBestMatch(name, items) {
  return match(items, name, { keys: ['name'] })[0];
};

var getInfoFromName = function getInfoFromName(name) {
  return new Promise(function (resolve, reject) {
    if (!name || typeof name !== 'string') {
      reject(new Error('[Mal-Scraper]: Invalid name.'));
    }

    getResultsFromSearch(name).then(function () {
      var _ref3 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(items) {
        var bestMacth, url, data;
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.prev = 0;
                bestMacth = getBestMatch(name, items);
                url = bestMacth ? bestMacth.url : items[0].url;
                _context.next = 5;
                return getInfoFromURL(url);

              case 5:
                data = _context.sent;


                data.url = url;

                resolve(data);
                _context.next = 13;
                break;

              case 10:
                _context.prev = 10;
                _context.t0 = _context['catch'](0);

                /* istanbul ignore next */
                reject(_context.t0);

              case 13:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, undefined, [[0, 10]]);
      }));

      return function (_x2) {
        return _ref3.apply(this, arguments);
      };
    }()).catch( /* istanbul ignore next */function (err) {
      return reject(err);
    });
  });
};

module.exports = {
  getInfoFromURL: getInfoFromURL,
  getResultsFromSearch: getResultsFromSearch,
  getInfoFromName: getInfoFromName
};