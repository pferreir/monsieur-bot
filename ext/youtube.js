var request = require('request'),
    utils = require('../lib/utils'),
    Deferred = require("promised-io/promise").Deferred;


function get_video_info(vid, options) {
  var deferred = new Deferred();

  request.get('http://gdata.youtube.com/feeds/api/videos/' + vid + '?v=2&alt=json',
    function (error, response, body) {
    if (!error && response.statusCode == 200) {
      deferred.resolve(JSON.parse(body), response);
    } else {
      deferred.reject(error, response, body)
      utils.log.error(vid, response.statusCode, error, body)
    }
  })
  return deferred.promise;
}

function process(url, info, bot, promise) {
  var m = url.match(/^(?:(?:https?\:\/\/(?:www\.)?youtube\.com\/watch\?v=)|(?:https?\:\/\/youtu\.be\/))(.*)/);
  if (m) {
    get_video_info(m[1], bot.config.imgur).then(function(result) {
      info.youtube = result.entry;
      var title = result.entry.title.$t;

      info.title = title + ' (' + result.entry.yt$statistics.viewCount + ')'
      promise.resolve('youtube');
    })
  } else {
    promise.resolve(null);
  }
}

module.exports = function(bot) {
  bot.modules.aggregator.on('url_id', function(url, info, bot) {
    var deferred = new Deferred();
    process(url, info, bot, deferred)
    return deferred.promise;
  });

  bot.modules.aggregator.on('pre_add_url', function(url, info, r_type) {
    var deferred = new Deferred();
    if (bot.config.imgur && bot.modules.imgur && bot.config.youtube.upload_images) {
      bot.modules.imgur.upload_image_url(info.youtube.media$group.media$thumbnail[2].url, {
        album: bot.config.imgur.delete_hash,
        client_id: bot.config.imgur.client_id,
        title: info.title,
        description: url
      });
    }
    return deferred.promise;
  })
};
