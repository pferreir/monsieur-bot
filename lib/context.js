var _ = require('underscore'),
  util = require('util');

function Context(name, type, bot) {
  this.name = name;
  this.type = type;
  this.bot = bot;
}

_.extend(Context.prototype, {
  result: function() {
    this.say('> ' + util.format.apply(this, arguments));
  },

  error: function() {
    this.say('!> ' + util.format.apply(this, arguments));
  }
});


module.exports = {
  Context: Context
}