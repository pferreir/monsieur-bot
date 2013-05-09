var _ = require('underscore');

var COMMAND_RE = /^:([^\s]+)((?:\s+[^\s]+)*)$/;

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
    var self = this;
    this.bot = bot;
    this.commands = [];

    bot.on('message.*', function(ctx, body, from, stanza) {
      var m = body.match(COMMAND_RE);

      if (m) {
        self.run_command(from, m[1], m[2]);
      }
    })
}

_.extend(CommandReader.prototype, {
  run_command: function(from, cmd, args) {
    var bot = this.bot;
    _(this.commands).each(function(command) {
      if (command.cmd == cmd) {
        // if args are OK, process it, otherwise send help
        if (args.match(command.pspec)) {
          bot.emit('command', from, cmd, args.trim());
          _.bind(command.func, bot)(from, args.trim());
        } else {
          bot.send_message(from, command.full_help());
        }
      }
    })
  },

  add: function(name, pspec, func, usage, help) {
    this.commands.push(new Command(name, pspec, func, usage, help));
  }
});

module.exports = {
  CommandReader: CommandReader
};