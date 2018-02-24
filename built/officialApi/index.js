'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var request = require('request');

var _require = require('./utils'),
    xml2JSON = _require.xml2JSON,
    JSON2Xml = _require.JSON2Xml;

var routes = {
  verify: 'account/verify_credentials.xml',
  search: {
    anime: 'anime/search.xml',
    mange: 'manga/search.xml'
  },
  lists: {
    anime: {
      add: function add(id) {
        return 'animelist/add/' + id + '.xml';
      },
      update: function update(id) {
        return 'animelist/update/' + id + '.xml';
      },
      delete: function _delete(id) {
        return 'animelist/delete/' + id + '.xml';
      }
    },
    manga: {
      add: function add(id) {
        return 'mangalist/add/' + id + '.xml';
      },
      update: function update(id) {
        return 'mangalist/update/' + id + '.xml';
      },
      delete: function _delete(id) {
        return 'mangalist/delete/' + id + '.xml';
      }
    }
  }
};

module.exports = function () {
  function _class(credentials) {
    _classCallCheck(this, _class);

    if (!credentials || !credentials.username || !credentials.password) {
      throw new Error('[Mal-Scraper]: Received no credentials or malformed ones.');
    }

    this.setCredentials(credentials);
  }

  /**
   * Allows to (re)set the credentials
   * @param {object} credentials - Object containing a username and a password.
   * @param {string} credentials.username - The username you want to use.
   * @param {string} credentials.password - The password you want to use.
   */


  _createClass(_class, [{
    key: 'setCredentials',
    value: function setCredentials(credentials) {
      if (!credentials || !credentials.username || !credentials.password) {
        throw new Error('[Mal-Scraper]: Received no credentials or malformed ones.');
      } else {
        this._credentials = credentials;

        this.req = request.defaults({
          auth: credentials,
          baseUrl: 'https://myanimelist.net/api/'
        });
      }
    }

    /**
     * Allows to check the credentials.
     *
     * @returns {promise}
     */

  }, {
    key: 'checkCredentials',
    value: function checkCredentials() {
      var _this = this;

      return new Promise(function (resolve, reject) {
        _this.req.get(routes.verify, function (err, res, body) {
          if (err) reject(err);
          resolve(body);
        });
      });
    }

    /**
     * Allows to search an anime or a manga on MyAnimeList database.
     * @param {string} type - Can be either "anime" or "manga". Defaults to "anime".
     * @param {string} name - The name of the anime or the manga you want to research on.
     *
     * @returns {promise}
     */

  }, {
    key: 'search',
    value: function search() {
      var _this2 = this;

      var type = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'anime';
      var name = arguments[1];

      return new Promise(function (resolve, reject) {
        if (!name) reject(new Error('[Mal-Scraper]: No name to search.'));
        if (!routes.search[type]) reject(new Error('[Mal-Scraper]: Wrong type for research.'));

        _this2.req.get(routes.search[type], {
          qs: {
            q: name
          }
        }, function (err, res, body) {
          if (err) reject(err);
          resolve(xml2JSON(body)[type].entry);
        });
      });
    }

    /**
     * Allows to add an anime or a manga on your MyAnimeList lists.
     * @param {object} type - Object specifying support and action to do.
     * @param {string} type.support - Can be either "anime" or "manga". Defaults to "anime".
     * @param {string} type.action - Can be either "add" or "update" or "delete". Defaults to "update".
     * @param {number} id - ID
     * @param {object} opts - Object containing the values your want to enter for this entry.
     * @param {number} opts.episode
     * @param {number|string} opts.status - 1/watching, 2/completed, 3/onhold, 4/dropped, 6/plantowatch
     * @param {number} opts.score
     * @param {number} opts.storage_type - Anime only
     * @param {number} opts.storage_value - Anime only
     * @param {number} opts.times_rewatched - Anime only
     * @param {string} opts.date_start - mmddyyyy
     * @param {string} opts.date_finish - mmddyyyy
     * @param {number} opts.priority
     * @param {number} opts.enable_discussion - 1 = enable, 0 = disable
     * @param {number} opts.enable_rewatching - 1 = enable, 0 = disable - Anime only
     * @param {number} opts.enable_rereading - 1 = enable, 0 = disable - Manga only
     * @param {string} opts.comments
     * @param {string} opts.tags - Tags separated by commas
     * @param {string} opts.retail_volumes - Manga only
     * @param {number} opts.volume - Manga only
     * @param {number} opts.times_reread - Manga only
     * @param {number} opts.reread_value - Manga only
     * @param {string} opts.scan_group - Manga only
     *
     * @returns {promise}
     */

  }, {
    key: 'actOnList',
    value: function actOnList() {
      var type = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : { support: 'anime', action: 'update' };

      var _this3 = this;

      var id = arguments[1];
      var opts = arguments[2];

      return new Promise(function (resolve, reject) {
        if (!routes.lists[type.support]) reject(new Error('[Mal-Scraper]: Wrong support type received.'));
        if (!routes.lists[type.support][type.action]) reject(new Error('[Mal-Scraper]: Wrong action type received.'));
        if (!id) reject(new Error('[Mal-Scraper]: No id to for anime|manga add.'));

        _this3.req.post({
          url: routes.lists[type.support][type.action](id),
          formData: type.action !== 'delete' ? {
            data: JSON2Xml(opts)
          } : {}
        }, function (err, res, body) {
          if (err) reject(err);

          resolve(body);
        });
      });
    }
  }]);

  return _class;
}();