var sqlite3 = require('sqlite3').verbose(),
    _ = require('underscore'),
    request = require('request'),
    util = require('util'),
    utils = require('../lib/utils'),
    Deferred = require("promised-io/promise").Deferred,
    events = require('events'),
    all = require("promised-io/promise").all;


var SQL_SCHEMA = "CREATE TABLE IF NOT EXISTS urls (" +
  "id INTEGER PRIMARY KEY AUTOINCREMENT," +
  "ts TIMESTAMP DEFAULT CURRENT_TIMESTAMP," +
  "url TEXT," +
  "data TEXT," +
  "type TEXT);";

var HTML_TITLE_RE = /\<title\>(.*)<\/title>/i

function check_db(db) {
  db.run(SQL_SCHEMA);
}

function Aggregator(bot) {
  events.EventEmitter.call(this);
  this.bot = bot;
}

util.inherits(Aggregator, events.EventEmitter)


_.extend(Aggregator.prototype, {

  get_url_info: function(url) {
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
  },

  title_url: function(url, bot, muc) {
    var deferred = new Deferred();
    var aggregator = this;

    this.get_url_info(url).then(function(info) {
      all(_(aggregator.listeners('url_id')).map(function(listener) {
        return listener(url, info, bot);
      })).then(function(results) {
        // find out which type has been assigned
        // (from all processed formats)
        var r_type = _(results).find(function(r) { return !!r; });

        // if no title is available, use content-type
        var title = (info.title || info.type);
        utils.log.info("> " + title);
        muc.say('> ' + title);

        deferred.resolve([info, r_type]);
      });
    }, function(res) {
      if (res.status) {
        muc.say('!> ' + res.status)
      } else {
        muc.say('!> Error resolving URL')
        utils.log.warning(res.error);
      }
      deferred.resolve(res);
    });
    return deferred.promise;
  },

  add_url: function(db, url, info, r_type) {
    all(_(this.listeners('url_pre_add')).each(function(listener){
      listener(url, info, r_type);
    }));
    db.run("INSERT INTO urls (url, data, type) VALUES ($url, $data, $type)", {
      $url: url,
      $data: JSON.stringify(info),
      $type: r_type
    });
  }
});

module.exports = function(bot) {

  var db = new sqlite3.Database(bot.config.db_path);

  check_db(db);

  var aggregator = new Aggregator(bot);

  bot.modules.aggregator = aggregator;

  bot.cmd.add('+', utils.URL_RE, function(from, args) {
    aggregator.title_url(args, this, this.muc).then(function(r) {
      var info = r[0],
      r_type = r[1];

      aggregator.add_url(db, args, info, r_type);
    });
  }, ":+ <url>", "Adds URL to aggregator");

  bot.cmd.add('?', utils.URL_RE, function(from, args) {
    aggregator.title_url(args, this, this.muc);
  }, ":? <url>", "Retrieves title of resource");
};