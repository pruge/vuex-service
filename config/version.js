const fs = require('fs')
const pack = require('../package.json')

// update installation.md
const installation = fs
  .readFileSync('./gitbook/installation.md', 'utf-8')
  .replace(
    /https:\/\/unpkg\.com\/vuex-service@[\d.]+.[\d]+\/dist\/vuex-service\.js/,
    'https://unpkg.com/vuex-service@' + pack.version + '/dist/vuex-service.js.'
  )
fs.writeFileSync('./gitbook/installation.md', installation)
