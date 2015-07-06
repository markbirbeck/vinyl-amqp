var _ = require('lodash');
var es = require('event-stream');

module.exports = function dest(glob, opt) {

  opt = opt || {};

  var amqp = require('amqp-sqs');
  var connection = amqp.createConnection({});

  return es.through(function write(file) {
    var self = this;

    if (file.contents) {
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
              self.emit('error', err);
            } else {
              if (waiting) {
                self.emit('waiting');
              } else {
                self.emit('queued');
              }
              self.emit('data', file);
            }
          }
        );
      });
    } else {
      self.emit('data', file);
    }
  });
};
