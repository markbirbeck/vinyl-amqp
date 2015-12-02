var es = require('event-stream');
var File = require('vinyl');

var amqp = require('amqp-sqs');
var connection = amqp.createConnection({});

module.exports = function src(glob, opt) {

  opt = opt || {};

  /**
   * [TODO] Split this into two completely separate src() functions and then
   * decide which to use based on the options:
   */

  var stream = es.through(function (data) {
    this.emit('data', data);

    /**
     * Indicate that there is nothing more to follow, once the message
     * count has been sent:
     */

    if (opt.getMessageCount) {
      this.emit('end');
    }
  });

  connection.queue(glob, function(err, q) {
    if (err) {
      throw new Error(err);
    }
    if (opt.getMessageCount) {
      q.getMessageCount(function C(err, count) {
        if (err) {
          throw new Error(err);
        }
        var file = new File({
          path: 'getMessageCount',
          contents: new Buffer(String(count))
        });

        stream.write(file);
      });
    } else {
      q.subscribe({fireImmediately: true}, function L(message, whenDone) {
        var file = new File({
          path: message.path,
          contents: new Buffer(JSON.stringify(message))
        });

        file.data = message;
        file.stat = {
          size: file.contents.length
        };
        file.title = message.title;
        stream.write(file);
        whenDone();
      });
    }
  });

  return stream;
};
