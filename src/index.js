import _ from 'lodash'
import Vuex from 'vuex'

// 1. 기본 mutation를 각 store 파일에 추가
function addMutation(store) {
  const mutations = {
    set(state, { prop, value }) {
      _.set(state, prop, value)
    },
    add(state, { prop, value }) {
      _.get(state, prop).push(value)
    },
    update(state, { value, patch }) {
      _.merge(value, patch)
      delete value.__patch
    },
    remove(state, { prop, value }) {
      _.get(state, prop).splice(_.get(state, prop).indexOf(value), 1)
    }
  }

  function appendMutation(obj) {
    _.merge(obj.mutations, mutations)
    if (obj.modules) {
      _.forEach(obj.modules, (module) => appendMutation(module))
    }
  }
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
  _(keys)
    .filter(key => regex.test(key))
    .map(key => {
      const property = key.replace(regex, '').split('/').join('.')
      _.set(service, property, getters[key])
    })
    .value()

  // actions
  const actions = this.$store ? this.$store._actions : this._actions
  keys = Object.keys(actions)
  _(keys)
    .filter(key => regex.test(key))
    .map(key => {
      const property = key.replace(regex, '').split('/').join('.')
      const isExist = _.get(service, property)
      if (isExist) throw new Error('duplicate key')
      const self = this.$store ? this.$store : this
      _.set(service, property, (payload, patch) => {
        patch && (payload.__patch = patch)
        self.dispatch(key, payload)
      })
    })
    .value()

  // mutations
  const mutations = this.$store ? this.$store._mutations : this._mutations
  keys = Object.keys(mutations)
  _(keys)
    .filter(key => regex.test(key))
    .map(key => {
      const property = key.replace(regex, '').split('/').join('.')
      const self = this.$store ? this.$store : this
      _.set(service.m, property, (prop, payload) => {
        let data = {}
        if (_.isString(prop) && !_.isUndefined(payload)) {
          // string any
          data.prop = prop
          data.value = payload
        } else if (!payload) {
          // any
          data = prop
        } else if (_.isObject(prop) && _.isObject(payload)) {
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
        return Store
      }
    })
    Vuex.Store.prototype[key] = Store
  }
}

plugin.version = '__VERSION__'

export default plugin
