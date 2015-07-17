var _ = require('lodash');
var through2 = require('through2');

module.exports = function dest(glob, opt) {

  opt = opt || {};

  var amqp = require('amqp-sqs');
  var connection = amqp.createConnection({});

  return through2.obj(function write(file, enc, callback) {
    var self = this;

    if (!file.contents) {
      callback(null, file);
    } else {
      var data = {};

      data.path = file.path;
      data.data = file.data;
      data.contents = file.contents.toString();

      /**
       * Set the default batch size to 1:
       */

      opt = _.extend({batchSize: 1}, opt);

      connection.on('ready', function() {
        connection.publish(
          glob,
          data,
          opt,
          function(err, waiting) {
            if (err) {
              callback(err);
            } else {
              if (waiting) {
                self.emit('waiting');
              } else {
                self.emit('queued');
                callback(null, file);
              }
            }
          }
        );
      });
    }
  });
};
