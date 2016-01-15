var inherits = require('inherits')
var Transform = require('readable-stream').Transform
var ReadableSearch = require('elasticsearch-streams').ReadableSearch
var CBuffer = require('CBuffer')

module.exports = ESPoll

function ESPoll (options) {
  Transform.call(this, {objectMode: true})

  this.client = options.client
  this.index = options.index
  this.query = options.query
  this.delay = options.delay || 500
  this.size = options.size || 64

  this.tip = null
  this.seen = new CBuffer(64)
}

inherits(ESPoll, Transform)

ESPoll.prototype._read = function () {
  var self = this
  if (this.stream == null) {
    var query = {'query': this.query}
    var sort = [{'@timestamp': {'order': 'asc'}}]

    if (this.tip != null) {
      var range = {'@timestamp': {'gte': this.tip}}
      query['filter'] = {'range': range}
    }

    this.stream = new ReadableSearch(function (from, cb) {
      self.client.search({
        index: self.index,
        from: from,
        size: self.size,
        body: {
          sort: sort,
          query: {'filtered': query}
        }
      }, cb)
    })

    this.stream.on('end', function () {
      self.stream = null
      setTimeout(function () { self._read() }, self.delay)
    })

    this.stream.pipe(this, {end: false})
  }

  Transform.prototype._read.call(this)
}

ESPoll.prototype._transform = function (chunk, enc, cb) {
  var tv = chunk._source['@timestamp']

  if (this.seen.data.indexOf(chunk._id) !== -1) {
    return cb()
  }

  this.seen.push(chunk._id)
  if (tv) {
    this.tip = tv
  }

  cb(null, chunk)
}

