// from https://kentor.me/posts/node-js-hot-reloading-development/

const fs = require('fs')

module.exports = function setLiveReload(_smart) {
  fs.watch(process.cwd(), { recursive: true }, (event, filename) => {
    var reFileName = new RegExp(filename + '$')
    var fileKey = Object.keys(require.cache).find((key) => { return Boolean(key.match(reFileName)) })
    if (fileKey && !fileKey.match(/node_modules/)) {
      if (!_smart) {
        Object.keys(require.cache).forEach(module => {
          if (!module.match(/node_modules/)) {
            delete require.cache[module]
          }
        })
      }
      else {
        console.log('key is ' + fileKey)
        var toBeRemove = [fileKey]
        while (toBeRemove.length > 0) {
          if (require.cache[toBeRemove[0]] && require.cache[toBeRemove[0]].parent && require.cache[toBeRemove[0]].parent.id !== '.') {
            toBeRemove.push(require.cache[toBeRemove[0]].parent.id)
          }
          console.log('removing ' + toBeRemove[0])
          delete require.cache[toBeRemove[0]]
          toBeRemove.shift()
        }
      }
    }
  })
}
