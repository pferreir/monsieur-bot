var xmpp = require('node-xmpp'),
  _ = require('underscore'),
  util = require('util'),
  events = require('eventemitter2'),
  path = require('path'),
  muc = require('./muc'),
  cmd = require('./cmd'),
  utils = require('./utils');


function Context(name, type) {
  this.name = name;
  this.type = type;
}

function Bot(config) {
  events.EventEmitter2.call(this, {
    wildcard: true
  });

  this.cl = new xmpp.Client({
    jid: config.jid,
    password: config.password
  });

  this.contexts = {};
  this.modules = {};
  this.config = config;
  this.muc = new muc.MUC(this);
  this.cmd = new cmd.CommandReader(this);

  this.load_extensions(this.config.extension_dir);
}

util.inherits(Bot, events.EventEmitter2)

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

      if (stanza.attrs.type == 'error') {
        utils.log.error(stanza);
      } else if (stanza.is('message')) {
        var ctx = self.resolve_context(stanza),
            body = stanza.getChild('body').getText();

        self.emit('message.' + ctx.type, ctx, body, stanza.attrs.from, stanza);
      } else if (stanza.is('presence')) {
        self.emit('presence', stanza);
      }
    });

    this.cl.on('error', function(e) {
      util.error(e);
    });
  },

  resolve_context: function(msg) {
    return _(this.contexts).find(function(ctx, ctx_name) {
      return utils.split_jid(ctx_name).toString() ==
        utils.split_jid(msg.from).slice(0, 2).toString();
    });
  },

  add_context: function(name, type) {
    var ctx = new Context(name, type);
    this.contexts[name] = ctx;
    return ctx;
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