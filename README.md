# vinyl-amqp
Presents an AMQP queue as either a source or destination stream of Vinyl objects.

[![wercker status](https://app.wercker.com/status/10e6b819ab879fe8059f724ced477497/s/master "wercker status")](https://app.wercker.com/project/bykey/10e6b819ab879fe8059f724ced477497) [![Dependency Status](https://david-dm.org/markbirbeck/vinyl-amqp.svg)](https://david-dm.org/markbirbeck/vinyl-amqp)

## Example

### dest

To send a Vinyl file to a queue, use the `dest()` function, with a queue name as the parameter:

```javascript
var gulp = require('gulp');
var es = require('event-stream');
var File = require('vinyl');
var amqp = require('vinyl-amqp');

gulp.task('trigger', function() {
  return es.readArray([{hello: 'world'}])
    .pipe(es.map(function(obj, cb) {
      var file = new File({});
      file.contents = new Buffer(JSON.stringify(obj));

      cb(null, file);
    }))
    .pipe(amqp.dest('hello-world-test'))
    .on('waiting', function() {
      console.log('Waiting...');
    })
    .on('queued', function(flag) {
      console.log('Queued');
    });
});
```

Gulp will exit after sending all of the data to the queue. The `queued` event is fired when an item has been completely queued. This is usually the case, since the batch size -- which determines how many items are needed before waiting items are pushed to the queue -- is set to one by default. However, it's possible to send more than one item in a batch by setting options in the `dest()` function call:

```javascript
    .pipe(amqp.dest('hello-world-test', {batchSize: 10}))
```

The `waiting` event is provided to indicate that an item is waiting for the batch total to be reached. This is described in more detail in the [amqp-sqs](https://www.npmjs.com/package/amqp-sqs) module.

### src

To read from the queue some other process (perhaps on another machine) simply uses the `src()` function, again with a queue name:

```javascript
gulp.task('action', function() {
  return amqp.src('hello-world-test')
    .pipe(es.map(function(file, cb) {
      console.log('received:', file.contents.toString());
    }))
    .pipe(process.stdout);
});
```

Note that in this case Gulp does not exit but continues to poll the queue. The frequency of the polling defaults to 5 minutes, which is set in the [amqp-sqs](https://www.npmjs.com/package/amqp-sqs) module. This can be overridden by providing a configuration file, with a value such as this:

```yaml
amqp:
  subscribe:
    pollInterval: 0.25
```

This will set the poll to be a quarter of a minute, or 15 seconds.

More control will be provided over this behaviour in the future, such as allowing the stream to close if the queue is empty, setting the poll frequency in the `src()` function, and so on.

#### Checking the Queue Size

To get the count of the number of messages in the queue, set `getMessageCount` to `true` in the options parameter. Only the count will be returned, i.e., no messages will be read from the queue. For example:

```javascript
gulp.task('count', function() {
  return amqp.src('hello-world-test', {getMessageCount: true})
    .pipe(es.map(function(file, cb) {
      console.log('message count:', file.contents.toString());
    }))
    .pipe(process.stdout);
});
```
