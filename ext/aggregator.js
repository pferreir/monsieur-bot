var sqlite3 = require('sqlite3').verbose(),
    _ = require('underscore');

var SQL_SCHEMA = "CREATE TABLE IF NOT EXISTS urls (" + 
  "id INTEGER PRIMARY KEY AUTOINCREMENT," +
  "ts TIMESTAMP DEFAULT CURRENT_TIMESTAMP," +
  "url TEXT);";

var URL_REGEXP = /(http:|https:)\/\/[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}(\:[0-9]+)?\b(\/[-a-zA-Z0-9@:%_\+.‌​~#?&//=]*)?/gi;

function check_db(db) {
	db.run(SQL_SCHEMA);
}

module.exports = function(muc, bot) {

	var db = new sqlite3.Database(bot.config.db_path);

	check_db(db);

	muc.on('message', function(message, from) {
		var m = message.match(URL_REGEXP);

		if (m) {
			var nick_from = from.split('/')[1];

			_.each(m, function(url) {
				db.run("INSERT INTO urls (url) VALUES ($url)", {
					$url: url
				})
				console.log('Added ' + url);
			})
		}
	})
};