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
      status: _stat.res.statusCode,
      date: (new Date(_stat.start)).toUTCString(),
      duration: _stat.end - _stat.start,
      size: _stat.size,
      // "user-agent": _stat.req.headers["user-agent"],
      // "accept-language": _stat.req.headers["accept-language"],
      // "x-forwarded-for": _stat.req.headers["x-forwarded-for"],
      msg: _stat.message
    }))
  },
  setRoot: function (_root) {
    router.root = _root
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
  // http://blog.inovia-conseil.fr/?p=202
  // https://developer.mozilla.org/fr/docs/HTTP/Access_control_CORS
  // https://stackoverflow.com/questions/14015118/what-is-the-expected-response-to-an-invalid-cors-request
  handleRequest: function (req, res) {
    var stat = {
      req: req,
      start: Date.now(),
      message: 'success'
    }
    var self = this
    var headers = {}
    var response = null
    if (req.headers.origin) {
      headers = {
        "Access-Control-Allow-Origin": req.headers.origin,
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE",
        "Access-Control-Allow-Headers": "authorization, accept, Content-Type, Access-Control-Allow-Origin",
        "Access-Control-Allow-Credentials": true
      }
    }
    if (req.method == "OPTIONS") {
      stat.message = 'CORS preflight handling'
      send(res, headers, 200, null, false, self.log, stat)
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
            if (askedUrl.pathname.search(/ping$/) !== -1) {
              stat.message = 'native ping'
              send(res, headers, 200, 'pong', false, null, stat)
              return
            }
            else {
              match = router.parse('get', '404')
            }
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
            var handler = match.handler
            if (typeof match.handler === "string") {
              handler = require(match.handler)
            }
            if (typeof handler === "function") {
              var context = {
                req: req,
                headers: headers,
                status: 0,
                res: res,
                url: askedUrl,
                route: match.route,
                param: match.param,
                path: match.path
              }
              var content = handler(match.param, context)
              if (content instanceof Promise) {
                content.then(
                  function (data) {
                    stat.message = 'promise request handler'
                    send(context.res, context.headers, context.status || 200, data, !context.headers.hasOwnProperty('Content-Type'), self.log, stat)
                  },
                  function (e) {
                    var message = ''
                    try {
                      message = JSON.stringify(e)
                    }
                    catch (err) { }
                    if (message === '{}' || message === '') {
                      message = e.message || e.toString()
                    }
                    else {
                      message = e
                    }
                    stat.message = message
                    send(context.res, context.headers, context.status || 500, { "error": message }, true, self.log, stat)
                  })
              }
              else if (content !== true) {
                stat.message = 'static content request handler'
                send(context.res, context.headers, context.status || 200, content, !context.headers.hasOwnProperty('Content-Type'), self.log, stat)
              }
            }
            else {
              stat.message = 'test route'
              send(res, headers, 200, { headers: req.headers, url: askedUrl, match: match }, true, self.log, stat)
            }
          }
          else {
            stat.message = 'not found'
            send(res, headers, 404, { "message": "not found" }, true, self.log, stat)
          }
        }
        catch (e) {
          stat.message = 'error while rounting request'
          send(res, headers, 500, { "error": e.toString() }, true, self.log, stat)
        }
      })
      req.on('error', function (e) {
        stat.message = 'error while reading request content'
        send(res, headers, 500, { "error": e.toString() }, true, self.log, stat)
      })
    }
  }
}

function send(_response, _headers, _status, _content, _json_content, _logger, _stat) {
  if (_json_content) {
    _headers['Content-Type'] = 'application/json; charset=utf-8'
    _content = JSON.stringify(_content)
  }
  var size = _content ? Buffer.byteLength(_content) : 0
  _headers['Content-Length'] = size
  _response.writeHead(_status, _headers)
  _response.end(_content)
  _logger && _logger(Object.assign(_stat, { res: _response, end: Date.now(), size: size }))
}