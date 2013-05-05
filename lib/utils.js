var _ = require('underscore'),
    util = require('util'),
    fs = require('fs');

var default_config = {
  status: 'Bonjour.',
  muc_nick: 'monsieur_bot',
  extensions: [],
  extension_dir: '../ext',
  db_path: ':memory:',
  notify_owner: ['error'],
  formats: ['imgur', 'youtube'],
  catch_all: false
};

function load_config(config_file) {
  var data = fs.readFileSync(config_file);

  try {
    var config = JSON.parse(data);

    for(format in default_config.formats) {
      default_config[format] = {};
    }

    for(setting in default_config) {
      if (config[setting] === undefined) {
        config[setting] = default_config[setting];
      }
    }
    return config
  }
  catch (err) {
    console.log('Error parsing config')
    console.log(err);
  }
}

var Log = {
    config: {
        jids: {}
    },
    log: function(level) {
        var message = level.toUpperCase() + ': ' + _(arguments).values().slice(1).join(' ');

        // console
        util.log(message);

        // send to owner if there is one configured
        var jid = Log.config.jids[level];
        if (Log.config.bot && jid) {
            Log.config.bot.send_message(jid, message);
        }
    },
    methods: {
        bind_bot: function(bot) {
            Log.config.bot = bot;
        },
        bind_jid: function(level, jid) {
            Log.config.jids[level] = jid;
        }
    }
}

_.extend(Log.methods,
    _(['error', 'warning', 'info']).each(function(level) {
        Log.methods[level] = _.partial(Log.log, level);
    }));

var exports = {
    load_config: load_config,
    log : Log.methods
};

module.exports = exports;