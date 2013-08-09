var xmpp = require('node-xmpp'),
    _ = require('underscore'),
    util = require('util'),
    utils = require('../lib/utils'),
    context = require('../lib/context');


function Contact(bot, jid) {
  context.Context.call(this, jid, 'contact', bot);

  this.jid = jid;
  this.config = bot.config;
}

util.inherits(Contact, context.Context);

_.extend(Contact.prototype, {

  say: function(message) {
    this.bot.send_message(this.jid, message, 'chat');
  }
});

module.exports = function(bot) {

  bot.on('online', function() {
    var roster = new xmpp.Element('iq', {
      id: 'get' + new Date().getTime(),
      type: 'get'
    }).c('query', {
      xmlns: 'jabber:iq:roster'
    });
    bot.cl.send(roster);
  });

  bot.on('iq', function(stanza) {
    if(stanza.attrs.type == 'result') {
      _(stanza.children[0].children).each(function(item) {
        bot.add_context(new Contact(bot, item.attrs.jid));
      });
    }
  });

  bot.on('presence', function(stanza) {
    if (stanza.attrs.type == 'subscribe') {
      utils.log.info("Accepting subscription request from " + stanza.attrs.from + "!");

      bot.cl.send(new xmpp.Element('presence', {
        to: stanza.attrs.from,
        type: 'subscribed'
      }));

    }
  });
};