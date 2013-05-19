var request = require('request'),
    utils = require('../lib/utils'),
    Deferred = require("promised-io/promise").Deferred,
    _ = require("underscore");


function Imgur(bot) {
  this.bot = bot;
}

_.extend(Imgur.prototype, {
  upload_image_url: function(url, options) {
    var deferred = new Deferred();

    request.post('https://api.imgur.com/3/image', {
      headers: {'Authorization': 'Client-Id ' + options.client_id},
      form: _(options || {}).extend({
        image: url,
        type: 'url'
      })
    }, function (error, response, body) {
      if (!error && response.statusCode == 200) {
        var result = JSON.parse(body);
        utils.log.info("Image saved at " + result.data.link);
        deferred.resolve(result, response);
      } else {
        deferred.reject(error, response, body)
        utils.log.error(url, response.statusCode, error, body)
      }
    })
    return deferred.promise;
  },

  process: function(ctx, url, info, bot, promise) {
    if (bot.config.imgur && info.type.indexOf('image/') == 0) {
      this.upload_image_url(url, {
        album: bot.config.imgur.delete_hash,
        client_id: bot.config.imgur.client_id
      }).then(function(result) {
        info.imgur = result.data;
        promise.resolve("imgur");

        if (bot.config.annoying) {
          ctx.result(result.data.link);
        }
      })
    } else {
      promise.resolve(null);
    }
  }
});

module.exports = function(bot) {
  var imgur = new Imgur(bot);

  bot.modules.imgur = imgur;

  bot.on('url_add', function(ctx, url, info, r_type) {
    var deferred = new Deferred();
    imgur.process(ctx, url, info, bot, deferred)
    return deferred.promise;
  });
};
