var _ = require('underscore'),
    util = require('util'),
    utils = require('./utils');

var COMMAND_RE = "^%s([^\\s]+)((?:\\s+[^\\s]+)*)$";

function Command(cmd, pspec, func, usage, help) {
  this.cmd = cmd;
  this.pspec = pspec;
  this.func = func;
  this.usage = usage;
  this.help = help;
}

_.extend(Command.prototype, {
  full_help: function() {
    return "COMMAND " + this.cmd + " - " + this.help + "\nUsage: " + this.usage;
  }
});

function CommandReader(bot) {
    var self = this,
        command_re = new RegExp(util.format(
          COMMAND_RE, utils.regex_escape(bot.config.command_prefix)));
    this.bot = bot;
    this.commands = [];

    bot.on('message.*', function(ctx, body, from, stanza) {
      var m = body.match(command_re);

      if (m) {
        self.run_command(ctx, from, m[1], m[2], stanza);
      }
    });
}

_.extend(CommandReader.prototype, {
  run_command: function(ctx, from, cmd, args, stanza) {
    var bot = this.bot;
    _(this.commands).each(function(command) {
      if (command.cmd == cmd) {
        // if args are OK, process it, otherwise send help
        if (args.match(command.pspec)) {
          bot.emit('command', ctx, from, cmd, args.trim(), stanza);
          _.bind(command.func, bot)(ctx, from, args.trim(), stanza);
        } else {
          // send private message with usage info/help
          bot.send_message(from, command.full_help());
        }
      }
    });
  },

  add: function(name, pspec, func, usage, help) {
    this.commands.push(new Command(name, pspec, func, usage, help));
  }
});

module.exports = {
  CommandReader: CommandReader
};