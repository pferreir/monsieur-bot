var request = require('request'),
    utils = require('../lib/utils'),
    Deferred = require("promised-io/promise").Deferred;


function upload_image_url(url, options) {
  var deferred = new Deferred();

  request.post('https://api.imgur.com/3/image', {
    headers: {'Authorization': 'Client-Id ' + options.client_id},
    form: {
      image: url,
      album: options.delete_hash,
      type: 'url'
    }
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
  upload_image_url: upload_image_url
}
