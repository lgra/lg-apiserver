var api = require('./src/apirunner.js')

api.add('get', '/', true)
api.add('get', '/clients', true)
api.add('post', '/clients', demoHandler)
api.add('del', '/clients', demoCustomHandler)
api.add('get', '/clients/:id', true)
api.add('put', '/clients/:id', true)
api.add('del', '/clients/:id', true)
api.add('get', '/clients/:id/users', true)
api.add('get', '/clients/:id/users/:iduser', true)
api.add('get', '/clients27pdg', demoHandler, {id: 27, iduser: 1})
api.add('get', '/shortcut', true, {id: 27, iduser: 1})
api.add('get', '/clients(:id)/users(:iduser)', demoHandler)
api.add('get', '/clients(:id)/users(:iduser)/address', demoHandler)
api.add('get', '/promises', demoPromiseHandler)
api.add('get', '/promises/:id', demoPromiseHandler)
api.add('get', '/404', demo404)
api.add('get', '/users(:id)/*', demoHandler)

//api.setRoot('toto')
api.run(1339, '127.0.0.1', {log: true})

function demoHandler (_param, _context) {
	return { param: _param, route: _context.route, path: _context.path}
}

function demoCustomHandler (_param, _context) {
	var content = 'a simple text\n'
	content += JSON.stringify(_param)
	_context.headers['Content-Type', 'text/text; charset=utf-8']
	_context.res.writeHead(200, _context.headers)
	_context.res.end(content)
	return true
}

function demoPromiseHandler (_param, _context) {
  return new Promise(function (resolve, reject) {
    if (_param && !_param.id) {
      _context.status = 501
      reject("not yet implemented")
    }
    else {
      resolve({ from: 'promise', param: _param, route: _context.route, path: _context.path})
    }
  })
}

function demo404 (_param, _context) {
  _context.status = 404
	return 'Don\'t know wath you want me to do'
}
