var sqlite3 = require('sqlite3').verbose(),
    _ = require('underscore'),
    request = require('request'),
    utils = require('../lib/utils'),
    imgur = require('./imgur'),
    Deferred = require("promised-io/promise").Deferred,
    all = require("promised-io/promise").all;


var SQL_SCHEMA = "CREATE TABLE IF NOT EXISTS urls (" +
  "id INTEGER PRIMARY KEY AUTOINCREMENT," +
  "ts TIMESTAMP DEFAULT CURRENT_TIMESTAMP," +
  "url TEXT," +
  "data TEXT," +
  "type TEXT);";

var URL_RE = /((?:http:|https:)\/\/[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}(?:\:[0-9]+)?\b(?:\/[-a-zA-Z0-9@:%_\+.‌​~#?&//=]*)?)/i,
  HTML_TITLE_RE = /\<title\>(.*)<\/title>/i

function check_db(db) {
	db.run(SQL_SCHEMA);
}

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
        'error': response.statusCode
      });
    } else {
      utils.log.warning(error, url)
    }
  })

  return deferred.promise;
}

function process_url(url, formats, bot) {
  var deferred = new Deferred();

  get_url_info(url).then(function(info) {
    all(_(formats).map(function(format) {
      var d = new Deferred();
      format.process(url, info, bot, d)
      return d.promise;
    })).then(function(results) {
      // find out which type has been assigned
      // (from all processed formats)
      var r_type = _(results).find(function(r) { return !!r; });
      deferred.resolve([info, r_type]);
    });
  }, function(error) {
    deferred.reject(error);
    utils.log.warning(error);
  });
  return deferred.promise;
}

module.exports = function(bot) {

	var db = new sqlite3.Database(bot.config.db_path);

  var formats = _(bot.config.formats).map(function(fmt) {
    return require('./' + fmt);
  });

	check_db(db);

	bot.muc.on('message', function(message, from) {
		var m = message.match(bot.config.catch_all ? URL_RE :
        new RegExp('^:.*' + URL_RE.source, 'i'));

		if (m) {
      var url = m[1];
      process_url(url, formats, bot).then(function(r) {
        var info = r[0],
            r_type = r[1];

        db.run("INSERT INTO urls (url, data, type) VALUES ($url, $data, $type)", {
          $url: url,
          $data: JSON.stringify(info),
          $type: r_type
        });
	    });
    }
  });
};