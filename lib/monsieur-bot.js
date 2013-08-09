var xmpp = require('node-xmpp'),
  _ = require('underscore'),
  util = require('util'),
  events = require('eventemitter2'),
  path = require('path'),
  ltx = require('ltx'),
  cmd = require('./cmd'),
  utils = require('./utils'),
  web = require('./web');


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

  utils.log.info('Starting HTTP server');
  this.web = new web.HTTPServer(this);

  this.cmd = new cmd.CommandReader(this);

  this.load_extensions(this.config.extension_dir);
}

util.inherits(Bot, events.EventEmitter2);

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
      self.emit('stanza', stanza);

      if (stanza.attrs.type == 'error') {
        utils.log.error(stanza);
      } else if (stanza.is('message')) {
        var body = stanza.getChild('body');

        if (body) {
            var ctx = self.resolve_context(stanza),
                txt = body.getText();
            if (ctx) {
                self.emit('message.' + ctx.type, ctx, txt, stanza.attrs.from, stanza);
            } else {
                utils.log.error("Can't resolve context: " + stanza);
            }
        } else {
            utils.log.info("Can't understand message: " + stanza);
        }

      } else if (stanza.is('presence')) {
        self.emit('presence', stanza);
      } else if (stanza.is('iq')) {
        self.emit('iq', stanza);
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

  add_context: function(ctx) {
    this.contexts[ctx.name] = ctx;
    return ctx;
  },

  send_message: function(to, message, type) {
    type = type || 'chat';

    if (typeof message == "string") {
      message = {text: message};
    }

    var b = new xmpp.Element('message', {
      type: type,
      to: to
     });

    b.c('body').t(message.text);

    if (message.html) {
      b.c('html', {
        xmlns: 'http://jabber.org/protocol/xhtml-im'
      }).cnode(ltx.parse('<body xmlns="http://www.w3.org/1999/xhtml">' + message.html + '</body>'));
    }

     this.cl.send(b);
  },

  load_extensions: function(dir_path) {
    var self = this;
    _(this.config.extensions).each(function(name) {
      utils.log.info('loading ' + name);
      try {
        require(path.join(dir_path, name))(self);
      } catch (e) {
        require(name)(self);
      }
      utils.log.info('done!');
    });
  }
});

module.exports = {
  Bot: Bot
};