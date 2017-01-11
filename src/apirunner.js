var http = require('http')
var url = require('url')
var querystring = require('querystring')
var router = require('./router.js')

module.exports = {
  ws: null,
  log: null,
  logToConsole: function (_stat) {
    console.log(JSON.stringify({
      method: _stat.req.method,
      url: _stat.req.url,
      date: (new Date(_stat.start)).toUTCString(),
      duration: _stat.end - _stat.start,
      headers: _stat.req.headers
    }))
  },
  add: function (_method, _pattern, _handler, _param) {
    router.add(_method, _pattern, _handler, _param)
  },
  run: function (_port, _ip, _options) {
    if (_options && _options.log) {
      if (typeof _options.log === "function") {
        this.log = _options.log
      }
      else {
        this.log = this.logToConsole
      }
    }
    this.ws = http.createServer(this.handleRequest.bind(this))
    if (!_ip) {
      this.ws.listen(_port)
    }
    else {
      this.ws.listen(_port, _ip)
    }
    this.ws.on('close', function () { })

    console.log('Server running at http://' + _ip + ':' + _port + '/')
  },
  handleRequest: function (req, res) {
    var stat = {
      req: req,
      start: Date.now()
    }
    var self = this
    var headers = {}
    if (req.headers.origin) {
      headers = {
        "Access-Control-Allow-Origin": req.headers.origin,
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE",
        "Access-Control-Allow-Headers": "authorization, accept, Content-Type, Access-Control-Allow-Origin"
      }
    }
    if (req.method == "OPTIONS") {
      res.writeHead(200, headers)
      res.end()
      stat[res] = res
      self.log && self.log(Object.assign(stat, { res: res, end: Date.now() }))
    }
    else {
      var data = ""
      var contentType = req.headers['content-type'] || 'application/x-www-form-urlencoded'
      var isMP = contentType.indexOf('multipart/form-data') > -1
      if (isMP) {
        req.setEncoding('binary')
      }
      req.on('data', function (chunk) {
        data += chunk.toString()
      })
      req.on('end', function () {
        try {
          var askedUrl = url.parse(req.url)
          var match = router.parse(req.method, askedUrl.pathname)
          if (!(match && match.route)) {
            match = router.parse('get', '404')
          }
          if (match && match.route) {
            var query = querystring.parse(askedUrl.query)
            if (typeof query === "object") {
              Object.keys(query).forEach(function (key) {
                match.param[key] = query[key]
              })
            }
            if (data !== null && data !== undefined) {
              try {
                var parsed = JSON.parse(data)
                Object.keys(parsed).forEach(function (key) {
                  match.param[key] = parsed[key]
                })
              }
              catch (e) {
                if (data) {
                  match.param.body = data
                }
              }
            }
            if (typeof match.handler === "function") {
              var context = {
                req: req,
                headers: headers,
                status: 0,
                res: res,
                url: askedUrl,
                route: match.route,
                path: match.path
              }
              var content = match.handler(match.param, context)
              if (content instanceof Promise) {
                content.then(function (data) {
                  var toJSON = false
                  if (!context.headers.hasOwnProperty('Content-Type')) {
                    context.headers['Content-Type'] = 'application/json; charset=utf-8'
                    toJSON = true
                  }
                  context.res.writeHead(context.status || 200, context.headers)
                  context.res.end(toJSON ? JSON.stringify(data) : data)
                  self.log && self.log(Object.assign(stat, { res: context.res, end: Date.now() }))
                }, function (e) {
                  context.headers['Content-Type'] = 'application/json; charset=utf-8'
                  context.res.writeHead(context.status || 500, context.headers)
                  context.res.end(JSON.stringify({ "error": e.toString() }))
                  self.log && self.log(Object.assign(stat, { res: context.res, end: Date.now(), error: e }))
                })
              }
              else if (content !== true) {
                var toJSON = false
                if (!context.headers.hasOwnProperty('Content-Type')) {
                  context.headers['Content-Type'] = 'application/json; charset=utf-8'
                  toJSON = true
                }
                context.res.writeHead(context.status || 200, context.headers)
                context.res.end(toJSON ? JSON.stringify(content) : content)
                self.log && self.log(Object.assign(stat, { res: context.res, end: Date.now() }))
              }
            }
            else {
              headers['Content-Type'] = 'application/json; charset=utf-8'
              res.writeHead(200, headers)
              res.end(JSON.stringify({ headers: req.headers, url: askedUrl, param: match.param }))
              self.log && self.log(Object.assign(stat, { res: res, end: Date.now() }))
            }
          }
          else {
            headers['Content-Type'] = 'application/json; charset=utf-8'
            res.writeHead(404, headers)
            res.end(JSON.stringify({ "message": "not found" }))
            self.log && self.log(Object.assign(stat, { res: res, end: Date.now() }))
          }
        }
        catch (e) {
          headers['Content-Type'] = 'application/json; charset=utf-8'
          res.writeHead(500, headers)
          res.end(JSON.stringify({ "error": e.toString() }))
          self.log && self.log(Object.assign(stat, { res: res, end: Date.now() }))
        }
      })
    }
  }
}