import Vuex from 'vuex'
import addMutation from './addMutation'
import makeStoreService from './makeStoreService'

function plugin (Vue, options = {}) {
  const store = options.store
  const flgMutation = options.mutation || true

  if (!store) {
    throw new Error('Not defined store')
  }

  flgMutation && addMutation(store)
  const key = '$$store'
  if (!Vue.prototype.hasOwnProperty(key)) {
    Object.defineProperty(Vue.prototype, key, {
      get () {
        return makeStoreService
      }
    })
    Vuex.Store.prototype[key] = makeStoreService
  }
}

plugin.version = '__VERSION__'

export default plugin
