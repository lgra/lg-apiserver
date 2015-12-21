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

api.run(1337, '127.0.0.1')

function demoHandler (_param, _context) {
	return _param
}

function demoCustomHandler (_param, _context) {
	var content = 'a simple text\n'
	content += JSON.stringify(_param)
	_context.headers['Content-Type', 'text/text; charset=utf-8']
	_context.res.writeHead(200, _context.headers)
	_context.res.end(content)
	return true
}
