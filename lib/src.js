var es = require('event-stream');
var File = require('vinyl');

var amqp = require('amqp-sqs');
var connection = amqp.createConnection({});

module.exports = function src(glob, opt) {

  opt = opt || {};

  var stream = es.through();

  connection.queue(glob, function(err, q) {
    if (err) {
      throw new Error(err);
    }
    q.subscribe({fireImmediately: true}, function L(message, whenDone) {
      var file = new File({
        path: message.path,
        contents: new Buffer(message.contents)
      });

      file.data = message.data;
      file.stat = {
        size: message.contents.length
      };
      file.title = message.title;
      stream.write(file);
      whenDone();
    });
  });

  return stream;
};
