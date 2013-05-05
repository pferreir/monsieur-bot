var xmpp = require('node-xmpp'),
	muc = require('xmpp-muc'),
	_ = require('underscore'),
  util = require('util'),
  events = require('events'),
  path = require('path'),
  muc = require('./muc');


function Bot(config) {
	events.EventEmitter.call(this);

	this.cl = new xmpp.Client({
		jid: config.jid,
		password: config.password
	});

	this.config = config;
	this.muc = new muc.MUC(this);

	this.load_extensions(this.config.extension_dir);
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
		  util.error(e);
	  });
	},

	send_message: function(to, message, type) {
		type = type || 'chat';
		 this.cl.send(new xmpp.Element('message', {
		 	type: type,
		 	to: to
		 }).c('body').t(message));
	},

	load_extensions: function(dir_path) {
		var self = this;
		_(this.config.extensions).each(function(name) {
			util.log('loading ' + name);
			require(dir_path + '/' + name)(self);
			util.log('done!');
		});
	}
})

module.exports = {
	Bot: Bot
}