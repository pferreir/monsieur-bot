var xmpp = require('node-xmpp'),
    _ = require('underscore'),
    util = require('util'),
    context = require('../lib/context');


function Contact(bot, jid) {
  context.Context.call(this, jid, 'contact', bot)

  this.jid = jid;
  this.config = bot.config;
}

util.inherits(Contact, context.Context)

_.extend(Contact.prototype, {

  say: function(message) {
    this.bot.send_message(this.jid, message, 'chat');
  }
});

module.exports = function(bot) {

  bot.on('online', function() {
    var roster = new xmpp.Element('iq', {
      id: 'roster_0',
      type: 'get'
    }).c('query', {
      xmlns: 'jabber:iq:roster'
    })
    bot.cl.send(roster);
  })

  bot.on('iq', function(stanza) {
    if(stanza.attrs.id == 'roster_0') {
      _(stanza.children[0].children).each(function(item) {
        bot.add_context(new Contact(bot, item.attrs.jid));
      })
    }
  });

}