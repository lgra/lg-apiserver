module.exports = {
  routes: [],
  tree: {},
  add: function (_method, _pattern, _handler) {
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
        if (segment[0] === ':') {
          kind = branch.parameter
          key = Object.keys(kind).length > 0 ? Object.keys(kind)[0] : segment.slice(1).toLowerCase()
        }
        else {
          kind = branch.constant
          key = segment.toLowerCase()
        }
        if (!kind.hasOwnProperty(key)) {
          kind[key] = { constant: {}, parameter: {}, route: null }
        }
        branch = kind[key]
      }, this)
    }
    this.routes.push(branch.route = {
      method: _method,
      pattern: _pattern,
      handler: _handler
    })
  },
  parse: function (_method, _url) {
    var method = (_method || '').toLowerCase()
    if (method === 'del') {
      method = 'delete'
    }
    var param = {}
    var branch = null
    if (this.tree.hasOwnProperty(method)) {
      branch = this.tree[method]
      var url = (_url || '').replace(/^\/?/, '').replace(/\/?$/, '')
      if (url.length > 0) {
//        var segments = url.split('/')
        var segments = url.split(/[\)\/|\/|\(]/).filter((segment) => segment !== '')
        segments.forEach(function (segment) {
          if (branch) {
            var uSegment = (segment || '').toLowerCase()
            if (branch.constant.hasOwnProperty(uSegment)) {
              branch = branch.constant[uSegment]
            }
            else if (Object.keys(branch.parameter).length > 0) {
              var key = Object.keys(branch.parameter)[0]
              param[key] = segment
              branch = branch.parameter[key]
            }
            else {
              branch = null
            }
          }
        }, this)
      }
    }
    if (branch && branch.route) {
      return { param: param, handler: branch.route.handler, route: branch.route }
    }
    else {
      return {}
    }
  }
}





