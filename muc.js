var xmpp = require('node-xmpp'),
    _ = require('underscore'),
    util = require('util'),
    events = require('events');


function MUC(bot) {
	events.EventEmitter.call(this);

	this.bot = bot;
	this.config = bot.config;
	var self = this;

	this.bot.on('online', function() {
		self.initialize();
		self.join(bot.config.muc_room);
	});

	this.bot.on('stanza', function(stanza) {
	  if (stanza.attrs.type == 'error') {
	    util.log('ERR: ' + stanza);
	    return;
	  }

	  if (!stanza.is('message') || !stanza.attrs.type == 'groupchat') {
	    return;
	  }

	  if (stanza.attrs.from == this.config.muc_room + '/' + this.config.muc_nick) {
	    return;
	  }

	  var body = stanza.getChild('body');

	  if (body) {
	    self.emit('message', body.getText(), stanza.attrs.from);
	  }	  
	});

	this.load_extensions(this.config.extension_dir);
}

util.inherits(MUC, events.EventEmitter)

_.extend(MUC.prototype, {

	initialize: function() {
		var self = this;
		this.bot.send(new xmpp.Element('presence', {}).
		    c('show').t('chat')
		 );
	},

	join: function(room) {

		var el = new xmpp.Element('presence', {to: room+ '/' + this.config.muc_nick});
		var x = el.c('x', {xmlns: 'http://jabber.org/protocol/muc'});
		x.c('history', {maxstanzas: 0, seconds: 1});

		if (this.config.muc_password != "") {
		  x.c('password').t(this.config.muc_password);
		}

		this.bot.send(x);
	},

	load_extensions: function(dir_path) {
		var self = this
		_(this.config.extensions).each(function(name) {
			require(dir_path + '/' + name)(self, self.bot);
			console.log('loaded ' + name);
		});
	}
});

module.exports = {
	MUC: MUC
}
