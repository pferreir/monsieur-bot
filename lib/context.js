var _ = require('underscore'),
  util = require('util');

function Context(name, type, bot) {
  this.name = name;
  this.type = type;
  this.bot = bot;
}

_.extend(Context.prototype, {
  _result: function(prefix, msg, args) {
    if (typeof msg == "string") {
      this.say(prefix + ' ' + util.format.apply(this, [msg].concat(args)));
    } else {
      this.say({
        html: prefix + ' ' + util.format.apply(this, [msg.html].concat(args)),
        text: prefix + ' ' + util.format.apply(this, [msg.text].concat(args))
      });
    }
  },

  result: function(text) {
    this._result('>', text, _(arguments).values().slice(1));
  },

  error: function(text) {
    this._result('!>', text, _(arguments).values().slice(1));
  }
});


module.exports = {
  Context: Context
}