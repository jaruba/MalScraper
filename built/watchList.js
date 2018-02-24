'use strict';

var _ = require('lodash');
var axios = require('axios');

var _require = require('xml2js'),
    parseString = _require.parseString;

var malToNormal = {
  // Anime values
  series_animedb_id: 'id',
  series_title: 'title',
  series_synonyms: 'synonyms',
  series_type: 'type',
  series_episodes: 'nbEpisodes',
  series_status: 'seriesStatus',
  series_start: 'seriesStart',
  series_end: 'seriesEnd',
  series_image: 'picture',
  my_id: 'myID',
  my_watched_episodes: 'nbWatchedEpisode',
  my_start_date: 'myStartDate',
  my_finish_date: 'myEndDate',
  my_score: 'score',
  my_status: 'status',
  my_rewatching: 'rewatching',
  my_rewatching_ep: 'rewatchingEp',
  my_last_updated: 'lastUpdate',
  my_tags: 'tags',
  // MyAnimeList values
  user_id: 'userID',
  user_name: 'username',
  user_watching: 'nbWatching',
  user_completed: 'nbCompleted',
  user_onhold: 'nbOnHold',
  user_dropped: 'nbDropped',
  user_plantowatch: 'nbPlanToWatch',
  user_days_spent_watching: 'nbDaysSpentWatching'
};

var flatten = function flatten(obj) {
  var res = {};

  _.each(obj, function (value, key) {
    res[malToNormal[key]] = value[0];
  });

  return res;
};

/**
 * Allows to retrieve a user's watch lists and stuff.
 * @param {string} user The name of the user.
 * @param {string} type Can be either 'anime' or 'manga'
 *
 * @returns {promise}
 */

var getWatchListFromUser = function getWatchListFromUser(user) {
  return new Promise(function (resolve, reject) {
    if (!user) {
      reject(new Error('[Mal-Scraper]: No user received.'));
      return;
    }

    axios.get('https://myanimelist.net/malappinfo.php', {
      params: {
        u: user,
        status: 'all',
        type: 'anime' // This can be changed to 'manga' too to retrieve manga lists.
      }
    }).then(function (_ref) {
      var data = _ref.data;

      parseString(data, function (err, res) {
        /* istanbul ignore next */
        if (err) reject(err);

        var mal = res.myanimelist;

        if (!mal) {
          reject(new Error('[Mal-Scraper]: It seems this user does not exist.'));
        }

        resolve({
          stats: flatten(mal.myinfo[0]),
          lists: _.map(mal.anime, function (obj) {
            return flatten(obj);
          })
        });
      });
    }).catch( /* istanbul ignore next */function (err) {
      return reject(err);
    });
  });
};

module.exports = {
  getWatchListFromUser: getWatchListFromUser
};