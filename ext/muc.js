var xmpp = require('node-xmpp'),
    util = require('util'),
    utils = require('../lib/utils'),
    context = require('../lib/context'),
    _ = require('underscore');



function MUC(bot, muc_room) {

  this.room = muc_room;

  context.Context.call(this, this.room, 'muc', bot)

  this.bot = bot;
  this.config = bot.config;

  var self = this;
  var muc_identity = muc_room + '/' + this.config.muc_nick;

  this.bot.on('online', function() {
    self.initialize();
    self.join(self.room);
  });

  this.bot.on('presence', function(stanza) {
    if (stanza.attrs.from == muc_identity &&
        utils.split_jid(stanza.attrs.to).slice(0,2).toString() ==
        utils.split_jid(bot.config.jid).toString()) {
      // We're online! (chat room)
      self.bot.emit('joined', muc_room);
      console.log('aaaaa')
    }
  });
}

util.inherits(MUC, context.Context)

_.extend(MUC.prototype, {

  initialize: function() {
    var self = this;
    this.bot.send(new xmpp.Element('presence', {}).
        c('show').t('chat')
     );
  },

  join: function(room) {
    var el = new xmpp.Element('presence', {to: room + '/' + this.config.muc_nick});
    var x = el.c('x', {xmlns: 'http://jabber.org/protocol/muc'});
    x.c('history', {maxstanzas: 0, seconds: 1});

    if (this.config.muc_password != "") {
      x.c('password').t(this.config.muc_password);
    }

    this.bot.send(x);
  },

  say: function(message) {
    this.bot.send_message(this.room, message, 'groupchat');
  }
});

module.exports = function(bot) {
  _(bot.config.muc_rooms).map(
    function(room_name) {
      bot.add_context(new MUC(bot, room_name));
    });
};
