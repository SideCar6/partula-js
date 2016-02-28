'use strict';

var mysql = require('mysql'),
    async = require('async');

var connection = mysql.createConnection(require('./config').mysql);

connection.connect();

const defaults = {
  COUNTRY: 'us', // Default country
  LIMIT: 1, // Default results to return
  YEAR_MAX: 2014, // Defaults if config.year is not set or if config.max isn't set
  YEAR_MIN: 2014, // Defaults if config.year is not set
  YEAR_OFFSET: 10, // If config.year.max is set, set config.year.min to offset less than max
  YEAR_FLOOR: 1880, // Earliest year in data
  YEAR_CEIL: 2014, // Latest year in data
  POP_MAX: 100, // Defaults if config.popularity.max is not set
  POP_MIN: 97, // Defaults if config.popularity.min is not set
  POP_FLOOR: 0, // Lowest possible popularity value
  POP_CEIL: 100, // Heighest possible popularity value
};

module.exports = function (format, config, callback) {
  if (typeof config === 'function') {
    callback = config;
    config = {};
  }

  if (!config.gender || (config.gender !== 'M' && config.gender !== 'F')) {
    config.gender = Math.floor(Math.random() * 2) ? 'M' : 'F';
  }

  if (!config.limit) {
    config.limit = defaults.LIMIT;
  }

  if (!config.country) {
    config.country = defaults.COUNTRY;
  }

  if (!config.year) {
    config.year = {
      min: defaults.YEAR_MIN,
      max: defaults.YEAR_MAX
    };
  } else {
    if (!config.year.max || config.year.max > defaults.YEAR_MAX) {
      config.year.max = defaults.YEAR_MAX;
    }

    if (!config.year.min || config.year.min < defaults.YEAR_FLOOR) {
      let year = config.year.max - defaults.YEAR_OFFSET;
      config.year.min = year >= defaults.YEAR_FLOOR ? year : defaults.YEAR_FLOOR;
    }
  }

  if (!config.popularity) {
    config.popularity = {
      min: defaults.POP_MIN,
      max: defaults.POP_MAX
    };
  } else {
    if (!config.popularity.min || config.popularity.min < defaults.POP_FLOOR) {
      config.popularity.min = defaults.POP_FLOOR;
    }

    if (!config.popularity.max || config.popularity.max > defaults.POP_CEIL) {
      config.popularity.max = defaults.POP_CEIL;
    }
  }

  async.times(config.limit, buildName, callback);

  function buildName (n, callback) {
    var str = format;

    async.parallel([
      replaceGivenNames,
      replaceSurnames
    ], function (err) {
      return callback(err, str);
    });

    function replaceGivenNames (callback) {
      async.whilst(
        // Test
        function () {
          return str.indexOf('{g}') !== -1;
        },
        // Task
        function (callback) {
          var countQuery = getGivenNameCountQuery(config);
          // Get count of names for given config
          connection.query(countQuery, function (err, rows) {
            if (err) return callback(err);

            var getQuery = getNameQuery(config, rows[0].count, countQuery);
            connection.query(getQuery, function (err, rows) {
              if (err) return callback(err);

              str = str.replace('{g}', rows[0].name);
              return callback(null);
            });
          });
        },
        // Callback
        callback
      );
    }

    function replaceSurnames (callback) {
      async.whilst(
        // Test
        function () {
          return str.indexOf('{s}') !== -1;
        },
        // Task
        function (callback) {
          var countQuery = getSurnameCountQuery(config);
          // Get count of names for given config
          connection.query(countQuery, function (err, rows) {
            if (err) return callback(err);

            var getQuery = getNameQuery(config, rows[0].count, countQuery);
            connection.query(getQuery, function (err, rows) {
              if (err) return callback(err);
              var surname = rows[0].name;
              surname = surname.charAt(0).toUpperCase() + surname.slice(1);

              str = str.replace('{s}', surname);
              return callback(null);
            });
          });
        },
        // Callback
        callback
      );
    }
  }
};

function getGivenNameCountQuery (config) {
  var year = config.year.min + Math.floor(Math.random() *
             (config.year.max - config.year.min));

  return 'SELECT COUNT(id) AS count FROM given_names WHERE gender="' + config.gender +
          '" AND country_code="' + config.country + '" AND year=' + year;
}

function getSurnameCountQuery (config) {
  return 'SELECT COUNT(id) AS count FROM surnames WHERE country_code="' +
          config.country + '" AND year=' + 2000;
}

function getNameQuery (config, count, countQuery) {
  var maxValue = Math.floor(count * config.popularity.max / 100),
      minValue = Math.floor(count * config.popularity.min / 100),
      offset = (minValue + Math.floor(Math.random() * (maxValue - minValue))),
      query = countQuery.replace('COUNT(id) AS count', 'name') +
              ' ORDER BY count ASC LIMIT 1 ' +
              'OFFSET ' + offset;

  return query;
}
