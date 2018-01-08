import Vuex from 'vuex'
import { defaultMutations, default as addMutation } from './addMutation'
import _Store from './makeStoreService'

let Store
function plugin(Vue, options = {}) {
  const hook = options.hook
  const store = options.store
  // const flgMutation = options.mutation || false

  // if (!store) {
  //   throw new Error('Not defined store')
  // }

  // flgMutation && addMutation(store)
  const key = '$$store'
  Store = _Store(options)
  if (!Vue.prototype.hasOwnProperty(key)) {
    Object.defineProperty(Vue.prototype, key, {
      get() {
        return Store
      }
    })
    Vuex.Store.prototype[key] = Store
  }
}

plugin.version = '__VERSION__'

export default plugin
export { Store, defaultMutations }
