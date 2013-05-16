var express = require('express'),
    util = require('util'),
    utils = require('./utils'),
    _ = require('underscore'),
    pjson = require('../package.json');

function HTTPServer(bot) {
    this.config = bot.config.http_server;
    this.bot = bot;
    this.app = express();

    this.set_default_handlers();

    this.app.listen(this.config.port, this.config.host);

    utils.log.info(util.format("Listening on http://%s:%s",
        this.config.host, this.config.port));
}

_(HTTPServer.prototype).extend({
    set_default_handlers: function() {
        var bot_config = this.bot.config;

        this.app.get('/info', function(req, res){

            var body = JSON.stringify({
                name: pjson.name,
                version: pjson.version,
                extensions: bot_config.extensions
            });

            res.setHeader('Content-Type', 'text/json');
            res.setHeader('Content-Length', body.length);
            res.end(body);
        });
    }
});

module.exports = {
    HTTPServer: HTTPServer
}