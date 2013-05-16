var _ = require('underscore'),
    util = require('util'),
    fs = require('fs');

var default_config = {
  command_prefix: '.',
  status: 'Bonjour.',
  muc_nick: 'monsieur_bot',
  extensions: [
    'muc',
    'urls',
    'imgur',
    'youtube',
    'google'
  ],
  extension_dir: '../ext',
  db_path: ':memory:',
  notify_owner: ['error'],
  http_server: {
    port: 8000,
    host: 'localhost'
  }
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

function split_jid(jid) {
  return jid.split(/@|\//);
}

function regex_escape(re) {
  // http://stackoverflow.com/questions/3561493/is-there-a-regexp-escape-function-in-javascript
  return re.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
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

module.exports = {
    split_jid: split_jid,
    regex_escape: regex_escape,
    load_config: load_config,
    log : Log.methods,
    URL_RE: /((?:http:|https:)\/\/[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}(?:\:[0-9]+)?\b(?:\/[-a-zA-Z0-9@:%_\+.‌​~#?&//=]*)?)/i
};