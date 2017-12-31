import {
  set,
  get,
  merge,
  chain,
  forEach,
  isString,
  isUndefined,
  isObject
} from 'lodash'

// 1. 기본 mutation를 각 store 파일에 추가
function addMutation(storeDir) {
  const mutations = {
    set(state, { prop, value }) {
      set(state, prop, value)
    },
    add(state, { prop, value }) {
      get(state, prop).push(value)
    },
    update(state, { value, patch }) {
      merge(value, patch)
      delete value.__patch
    },
    remove(state, { prop, value }) {
      get(state, prop).splice(get(state, prop).indexOf(value), 1)
    }
  }

  function appendMutation(obj) {
    merge(obj.mutations, mutations)
    if (obj.modules) {
      forEach(obj.modules, (module) => appendMutation(module))
    }
  }
  const store = require('~/store')
  appendMutation(store)
}

// 2. store를 service 객체 처럼 변환
function Store(name) {
  let service = { m: {} }
  // getters
  // console.log(this.$store.getters)
  const getters = this.$store ? this.$store.getters : this.getters
  let keys = Object.keys(getters)
  const regex = new RegExp('^' + name + '/')
  chain(keys)
    .filter(key => regex.test(key))
    .map(key => {
      const property = key.replace(regex, '').split('/').join('.')
      set(service, property, getters[key])
    })
    .value()

  // actions
  const actions = this.$store ? this.$store._actions : this._actions
  keys = Object.keys(actions)
  chain(keys)
    .filter(key => regex.test(key))
    .map(key => {
      const property = key.replace(regex, '').split('/').join('.')
      const isExist = get(service, property)
      if (isExist) throw new Error('duplicate key')
      const self = this.$store ? this.$store : this
      set(service, property, (payload, patch) => {
        patch && (payload.__patch = patch)
        self.dispatch(key, payload)
      })
    })
    .value()

  // mutations
  const mutations = this.$store ? this.$store._mutations : this._mutations
  keys = Object.keys(mutations)
  chain(keys)
    .filter(key => regex.test(key))
    .map(key => {
      const property = key.replace(regex, '').split('/').join('.')
      const self = this.$store ? this.$store : this
      set(service.m, property, (prop, payload) => {
        let data = {}
        if (isString(prop) && !isUndefined(payload)) {
          // string any
          data.prop = prop
          data.value = payload
        } else if (!payload) {
          // any
          data = prop
        } else if (isObject(prop) && isObject(payload)) {
          // obj obj
          data.value = prop
          data.patch = payload
        } else {
          throw new Error('Incorrect arguements.')
        }

        // console.log(property, prop, payload, data)
        self.commit(key, data)
      })
    })
    .value()

  // console.log(service)
  return service
}

/* @flow */
function plugin (Vue, options = {}) {
  const storeDir = options.store || './store'
  const flgMutation = options.mutation || true

  flgMutation && addMutation(storeDir)
  Vue.prototype.$$store = Store
}

plugin.version = '__VERSION__'

export default plugin

if (typeof window !== 'undefined' && window.Vue) {
  window.Vue.use(plugin)
}
