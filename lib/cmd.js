var _ = require('underscore');

var COMMAND_RE = /^:([^\s]+)((?:\s+[^\s]+)*)$/;

function Command(cmd, pspec, func) {
  this.cmd = cmd;
  this.pspec = pspec;
  this.func = func;
}

function CommandReader(bot) {
    var self = this;
    this.bot = bot;
    this.commands = [];

    bot.muc.on('message', function(message, from) {
      var m = message.match(COMMAND_RE);

      if (m) {
        self.run_command(from, m[1], m[2]);
      }
    })
}

_.extend(CommandReader.prototype, {
  run_command: function(from, cmd, args) {
    var bot = this.bot;
    _(this.commands).each(function(command) {
      if (command.cmd == cmd && args.match(command.pspec)) {
        bot.emit('command', from, cmd, args.trim());
        _.bind(command.func, bot)(from, args.trim());
      }
    })
  },

  add: function(name, pspec, func) {
    this.commands.push(new Command(name, pspec, func));
  }
});

module.exports = {
  CommandReader: CommandReader
};