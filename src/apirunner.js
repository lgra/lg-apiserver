var http = require('http')
var url = require('url');
var querystring = require('querystring')
var router = require('./router.js')

module.exports = {
  ws: null,
  add: function (_method, _pattern, _handler) {
    router.add(_method, _pattern, _handler)
  },
  run: function (_port, _ip) {
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
    //            console.log(req.method + " - " + req.url + " - " + JSON.stringify(req.headers))
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
                res: res,
                url: askedUrl
              }
              var content = match.handler(match.param, context)
              if (content instanceof Promise) {
                content.then(function (data) {
                  if (!context.headers.hasOwnProperty('Content-Type')) {
                    context.headers['Content-Type'] = 'application/json; charset=utf-8'
                  }
                  context.res.writeHead(200, context.headers)
                  context.res.end(JSON.stringify(data))
                }, function (e) {
                  context.headers['Content-Type'] = 'application/json; charset=utf-8'
                  context.res.writeHead(500, context.headers)
                  context.res.end(JSON.stringify({ "error": e.toString() }))
                })
              }
              else if (content !== true) {
                if (!context.headers.hasOwnProperty('Content-Type')) {
                  context.headers['Content-Type'] = 'application/json; charset=utf-8'
                }
                context.res.writeHead(200, context.headers)
                context.res.end(JSON.stringify(content))
              }
            }
            else {
              headers['Content-Type'] = 'application/json; charset=utf-8'
              res.writeHead(200, headers)
              res.end(JSON.stringify({ headers: req.headers, url: askedUrl, param: match.param }))
            }
          }
          else {
            headers['Content-Type'] = 'application/json; charset=utf-8'
            res.writeHead(404, headers)
            res.end(JSON.stringify({ "message": "not found" }))
          }
        }
        catch (e) {
          headers['Content-Type'] = 'application/json; charset=utf-8'
          res.writeHead(500, headers)
          res.end(JSON.stringify({ "error": e.toString() }))
        }
      })
    }
  }
}