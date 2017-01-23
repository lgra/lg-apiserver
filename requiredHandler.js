module.exports = function requiredHandler (_param, _context) {
  return new Promise(function (resolve, reject) {
    if (_param && !_param.id) {
      _context.status = 501
      reject("not yet implemented")
    }
    else {
      resolve({ from: 'required promise T', param: _param, route: _context.route, path: _context.path})
    }
  })
}
