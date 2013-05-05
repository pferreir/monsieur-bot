var request = require('request'),
    utils = require('../lib/utils'),
    Deferred = require("promised-io/promise").Deferred,
    _ = require("underscore");


function upload_image_url(url, options) {
  var deferred = new Deferred();

  request.post('https://api.imgur.com/3/image', {
    headers: {'Authorization': 'Client-Id ' + options.client_id},
    form: _(options || {}).extend({
      image: url,
      type: 'url'
    })
  }, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      deferred.resolve(JSON.parse(body), response);
    } else {
      deferred.reject(error, response, body)
      utils.log.error(url, response.statusCode, error, body)
    }
  })
  return deferred.promise;
}


module.exports = {
  upload_image_url: upload_image_url,

  process: function(url, info, bot, promise) {
    if (bot.config.imgur && info.type.indexOf('image/') == 0) {
      upload_image_url(url, {
        album: bot.config.imgur.delete_hash,
        client_id: bot.config.imgur.client_id
      }).then(function(result) {
        info.imgur = result.data;
        promise.resolve("imgur");

        utils.log.info("Image saved at " + result.data.link);
        if (bot.config.annoying) {
          bot.muc.say("-> " + result.data.link);
        }
      })
    } else {
      promise.resolve(null);
    }
  },

  render: function(url, info, ts) {
    // TODO
  }
}
