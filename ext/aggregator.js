var sqlite3 = require('sqlite3').verbose(),
    _ = require('underscore'),
    request = require('request'),
    utils = require('../lib/utils'),
    imgur = require('./imgur'),
    Deferred = require("promised-io/promise").Deferred;


var SQL_SCHEMA = "CREATE TABLE IF NOT EXISTS urls (" +
  "id INTEGER PRIMARY KEY AUTOINCREMENT," +
  "ts TIMESTAMP DEFAULT CURRENT_TIMESTAMP," +
  "url TEXT," +
  "data TEXT);";

var URL_RE = /(http:|https:)\/\/[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}(\:[0-9]+)?\b(\/[-a-zA-Z0-9@:%_\+.‌​~#?&//=]*)?/gi,
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
        info.title = m ? m[1].slice(0,30) : '';
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

function process_url(url, bot) {
  var deferred = new Deferred();
  get_url_info(url).then(function(info) {
    if (bot.config.imgur && info.type.indexOf('image/') == 0) {
      imgur.upload_image_url(url, bot.config.imgur).then(function(result) {
        info.imgur = result.data;
        deferred.resolve(info);

        utils.log.info("Image saved at " + result.data.link);
        if (bot.config.imgur.annoying) {
          bot.muc.say("-> " + result.data.link);
        }
      })
    } else {
      deferred.resolve(info);
    }
  }, function(error) {
    deferred.reject(error);
    utils.log.warning(error);
  });
  return deferred.promise;
}

module.exports = function(bot) {

	var db = new sqlite3.Database(bot.config.db_path);

	check_db(db);

	bot.muc.on('message', function(message, from) {
		var m = message.match(URL_RE);

		if (m) {
      _.each(m, function(url) {
        process_url(url, bot).then(function(info) {
          db.run("INSERT INTO urls (url, data) VALUES ($url, $data)", {
            $url: url,
            $data: JSON.stringify(info)
          });
        });
	    });
    }
  });
};