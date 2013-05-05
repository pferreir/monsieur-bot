var request = require('request'),
    utils = require('../lib/utils'),
    Deferred = require("promised-io/promise").Deferred,
    imgur = require("./imgur");


function get_video_info(vid, options) {
  var deferred = new Deferred();

  request.get('http://gdata.youtube.com/feeds/api/videos/' + vid + '?v=2&alt=json',
    function (error, response, body) {
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
  process: function(url, info, bot, promise) {
    var m = url.match(/^(?:(?:https?\:\/\/(?:www\.)?youtube\.com\/watch\?v=)|(?:https?\:\/\/youtu\.be\/))(.*)/);
    if (m) {
      get_video_info(m[1], bot.config.imgur).then(function(result) {
        info.youtube = result.entry;
        var title = result.entry.title.$t;

        promise.resolve('youtube');
        utils.log.info("-> " + title);

        if (bot.config.annoying) {
          bot.muc.say("-> " + title + ' (' + result.entry.yt$statistics.viewCount + ')');
        }

        if (bot.config.imgur && bot.config.youtube.upload_images) {
          imgur.upload_image_url(result.entry.media$group.media$thumbnail[2].url, {
            album: bot.config.imgur.delete_hash,
            client_id: bot.config.imgur.client_id,
            title: title,
            description: url
          });
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
