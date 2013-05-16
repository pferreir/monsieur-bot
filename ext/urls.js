var _ = require('underscore'),
    request = require('request'),
    util = require('util'),
    utils = require('../lib/utils'),
    Deferred = require("promised-io/promise").Deferred,
    events = require('events'),
    all = require("promised-io/promise").all;

var HTML_TITLE_RE = /\<title\>(.*)<\/title>/i

function get_url_info(url) {
  var deferred = new Deferred();
  utils.log.info('Getting URL info for ' + url)
  request(url, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var info = {
        type: response.headers['content-type'].split(';')[0].trim()
      };

      if (info.type == 'text/html') {
        var m = body.match(HTML_TITLE_RE);
        info.title = m ? m[1].slice(0, 100) : '';
      }

      deferred.resolve(info)
    } else if (!error) {
      deferred.reject({
        'status': response.statusCode
      });
    } else {
      deferred.reject({
        'error': error
      })
    }
  })

  return deferred.promise;
}

function title_url(ctx, url, bot) {
  var deferred = new Deferred();

  get_url_info(url).then(function(info) {
    all(_(bot.listeners('url_id')).map(function(listener) {
      return listener(ctx, url, info, bot);
    })).then(function(results) {
      // find out which type has been assigned
      // (from all processed formats)
      var r_type = _(results).find(function(r) { return !!r; });

      // if no title is available, use content-type
      var title = (info.title || info.type);
      utils.log.info("> " + title);
      ctx.result(title);

      deferred.resolve([info, r_type]);
    });
  }, function(res) {
    if (res.status) {
      ctx.error(res.status)
    } else {
      ctx.error('Error resolving URL')
      utils.log.warning(res.error);
    }
    deferred.resolve(res);
  });
  return deferred.promise;
}

module.exports = function(bot) {
  bot.cmd.add('?', utils.URL_RE, function(ctx, from, args) {
    title_url(ctx, args, this);
  }, "? <url>", "Retrieves title of resource");
};