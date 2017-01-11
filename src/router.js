module.exports = {
  routes: [],
  tree: {},
  add: function (_method, _pattern, _handler, _param) {
    var method = (_method || '').toLowerCase()
    if (method === 'del') {
      method = 'delete'
    }
    if (!this.tree.hasOwnProperty(method)) {
      this.tree[method] = { constant: {}, parameter: {}, route: null }
    }
    var branch = this.tree[method]
    var pattern = (_pattern || '').replace(/^\/?/, '').replace(/\/?$/, '')
    if (pattern.length > 0) {
      var segments = pattern.split(/[\)\/|\/|\(]/).filter((segment) => segment !== '')
      segments.forEach(function (segment) {
        var kind, key
        if (segment === '*') {
          branch.generic = true
        }
        else if (segment[0] === ':') {
          kind = branch.parameter
          key = Object.keys(kind).length > 0 ? Object.keys(kind)[0] : segment.slice(1).toLowerCase()
        }
        else {
          kind = branch.constant
          key = segment.toLowerCase()
        }
        if (!branch.generic) {
          if (!kind.hasOwnProperty(key)) {
            kind[key] = { constant: {}, parameter: {}, route: null }
          }
          branch = kind[key]
        }
      }, this)
    }
    this.routes.push(branch.route = {
      method: _method,
      pattern: _pattern,
      handler: _handler,
      param: _param || {}
    })
  },
  parse: function (_method, _url) {
    var method = (_method || '').toLowerCase()
    if (method === 'del') {
      method = 'delete'
    }
    var param = {}
    var branch = null
    var path = []
    if (this.tree.hasOwnProperty(method)) {
      branch = this.tree[method]
      var url = (_url || '').replace(/^\/?/, '').replace(/\/?$/, '')
      if (url.length > 0) {
        //        var segments = url.split('/')
        var segments = url.split(/([\)\/|\/|\(])/).filter((segment) => segment !== '')
        var nextIsParam = false
        var previousConst = ''
        segments.forEach(function (segment) {
          if (branch) {
            if (segment === "(") {
              nextIsParam = true
            }
            else {
              if (segment !== ")" && segment !== "/") {
                var uSegment = (segment || '').toLowerCase()
                if (branch.generic) {
                  if (nextIsParam) {
                    var key = previousConst + '#'
                    if (param.hasOwnProperty(key)) {
                      var i = 1
                      while (param.hasOwnProperty(key = previousConst + i + '#')) { i++ }
                    }
                    param[key] = segment
                    path.push({ name: previousConst + '#', type: 'param', value: segment })
                  }
                  else {
                    previousConst = segment
                    path.push({ name: segment, type: 'const' })
                  }
                }
                else if (branch.constant.hasOwnProperty(uSegment)) {
                  branch = branch.constant[uSegment]
                  path.push({ name: uSegment, type: 'const' })
                  previousConst = segment
                }
                else if (Object.keys(branch.parameter).length > 0) {
                  var key = Object.keys(branch.parameter)[0]
                  if (param.hasOwnProperty(key)) {
                    var i = 1
                    while (param.hasOwnProperty(key + i)) { i++ }
                    key = key + i
                  }
                  param[key] = segment
                  param[key] = segment
                  branch = branch.parameter[key]
                  path.push({ name: key, type: 'param', value: param[key] })
                }
                else {
                  branch = null
                }
              }
              nextIsParam = false
            }
          }
        }, this)
      }
    }
    if (branch && branch.route) {
      return {
        param: Object.assign({}, branch.route.param, param),
        handler: branch.route.handler,
        route: branch.route,
        path: path
      }
    }
    else {
      return {}
    }
  }
}
