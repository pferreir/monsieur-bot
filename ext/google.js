var request = require('request'),
  querystring = require('querystring'),
  Deferred = require("promised-io/promise").Deferred,
  utils = require('../lib/utils');

function search(term) {
  var deferred = new Deferred();

  request.get('http://ajax.googleapis.com/ajax/services/search/web?' +
      querystring.stringify({
        v: '1.0',
        q: term
      }), function(error, response, body) {
        if (!error && response.statusCode == 200) {
          var result = JSON.parse(body),
            entry = result.responseData.results[0];
          deferred.resolve({
            entry: entry,
            hits: result.responseData.cursor.resultCount,
            more_url: result.responseData.cursor.moreResultsUrl
          });
        } else {
          deferred.reject(error || response.statusCode);
        }
      });

  return deferred.promise;
}

function shorten_url(url) {
  var deferred = new Deferred();

  request.post('https://www.googleapis.com/urlshortener/v1/url', {
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        longUrl: url
      })
    }, function(error, response, body) {
      if (!error && response.statusCode == 200) {
        deferred.resolve(JSON.parse(body));
      } else {
        deferred.reject(error || response.statusCode);
      }
    });
  return deferred.promise;
}

module.exports = function(bot) {
  bot.cmd.add('g', /.*/, function(from, args) {
    search(args).then(function(data) {
      bot.muc.say("> " + data.entry.titleNoFormatting + " " + data.entry.url);

      shorten_url(data.more_url).then(function(res){
        bot.muc.say("> " + data.hits + " other results at " + res.id);
      }, function(err) {
        utils.warning(err);
        bot.muc.say("> " + data.hits + " other results at " + data.more_url);
      })
    }, function(err) {
      bot.muc.say('!> ' + err);
    });
  }, ":g <term>", "Perform Google search, return 1st result");

  bot.cmd.add('s', utils.URL_RE, function(from, args) {
    shorten_url(args).then(function(res) {
      bot.muc.say('> ' + res.id)
    }, function(err) {
      bot.muc.say('!> ' + err);
    })
  }, ":s <url>", "Shortens URL using goo.gl");
};