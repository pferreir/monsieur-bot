var xmpp = require('node-xmpp'),
	muc = require('xmpp-muc'),
	_ = require('underscore'),
  util = require('util'),
  events = require('events'),
  path = require('path');


function Bot(config) {
	events.EventEmitter.call(this);
	
	this.cl = new xmpp.Client({
		jid: config.jid,
		password: config.password
	});
	
	this.config = config;
	this.events = {};
}

util.inherits(Bot, events.EventEmitter)

_.extend(Bot.prototype, {

	send: function(message) {
		return this.cl.send(message);
	},

	initialize: function() {
		var self = this;
		this.cl.on('online', function() {
			// set status
		  self.cl.send(new xmpp.Element('presence', {}).
			  c('show').t('chat').up().
			  c('status').t(self.config.status)
			 );

		  self.emit('online');
		});

		this.cl.on('stanza', function(stanza) {
		  self.emit('stanza', stanza)
		});

		this.cl.on('error', function(e) {
		  console.error(e);
	  });
	}
})

module.exports = {
	Bot: Bot
}