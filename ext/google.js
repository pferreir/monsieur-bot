var request = require('request'),
  util = require('util'),
  querystring = require('querystring'),
  Deferred = require("promised-io/promise").Deferred,
  utils = require('../lib/utils');

function search(term, type) {
  type = type || 'web';
  var deferred = new Deferred();

  request.get('http://ajax.googleapis.com/ajax/services/search/' + type + '?' +
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
  bot.cmd.add('g', /.*/, function(ctx, from, args) {
    search(args).then(function(data) {
      ctx.result({
        text: data.entry.titleNoFormatting + " " + data.entry.url,
        html: util.format('<a href="%s">%s</a>', data.entry.url, data.entry.titleNoFormatting)
      });

      var show_results = function(hits, url) {
        ctx.result({
          text: util.format("%s other results at %s", hits, url),
          html: util.format('%s other <a href="%s">results</a>', hits, url)
        });
      }

      shorten_url(data.more_url).then(function(res){
        show_results(data.hits, res.id);
      }, function(err) {
        utils.warning(err);
        show_results(data.hits, data.more_url);
      })

    }, function(err) {
      ctx.error(err);
    });
  }, "g <term>", "Perform Google search, return 1st result");

  bot.cmd.add('s', utils.URL_RE, function(ctx, from, args) {
    shorten_url(args).then(function(res) {
      ctx.result({
        text: res.id,
        html: util.format('<a href="%s">%s</a>', res.id, res.id)
      })
    }, function(err) {
      ctx.error(err);
    })
  }, "s <url>", "Shortens URL using goo.gl");

  bot.cmd.add('c', /.*/, function(ctx, from, args) {
    request.get('https://www.google.com/ig/calculator', {
      qs: {
        q: args
      },
      headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64)'
      }
    }, function(error, response, body) {
        var m = body.match(/rhs\:\s*(\"[^\"]+\")/);
        if (m) {
          var res = eval(m[1]);
          ctx.result({
            html: res,
            text: res
          });
        } else {
          ctx.error("Sorry. Google doesn't know that.");
        }
      });
    }, "c <expression>", "Calculate expression");

  bot.cmd.add('i', /.*/, function(ctx, from, args) {
      search(args, 'images').then(function(data) {
        ctx.result({
          text: data.entry.titleNoFormatting + " " + data.entry.url,
          html: util.format('<img src="%s" alt="%s"/>', data.entry.url, data.entry.titleNoFormatting)
        });
      }, function(err) {
        ctx.error(err);
      });
    }, "i <expression>", "Google image search");
};