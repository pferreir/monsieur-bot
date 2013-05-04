var _ = require('underscore'),
    util = require('util');

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
    log : Log.methods
};

module.exports = exports;