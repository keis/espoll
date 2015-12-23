# espoll

With `espoll` you can construct a stream new data as it arrives for a
particular search in elasticsearch. Behind the scenes this is implemented by
polling the es search api.


## Install

```bash
npm install espoll
```

## Usage

```javascript
var through2 = require('through2')
var ESPoll = require('./espoll')
var ESClient = require('elasticsearch').Client
var client = new ESClient({host: 'http://...', log: 'error'})

var ep = new ESPoll({
  client: client,
  index: 'logstash-*',
  query: { term: {'somefield.raw': 'foo'} }
})

ep.pipe(through2.obj(function (obj, enc, callback) {
  this.push(obj._source['@timestamp'] + ' ' + obj._source.message + "\n")
  callback()
})).pipe(process.stdout)
```
