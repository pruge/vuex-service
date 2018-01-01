import _ from 'lodash'

function getters(service, self, name) {
  const getters = self.$store ? self.$store.getters : self.getters
  const keys = Object.keys(getters)
  const regex = new RegExp('^' + name + '/')
  _(keys)
    .filter(key => regex.test(key))
    .map(key => {
      const property = key.replace(regex, '').split('/').join('.')
      _.set(service, property, getters[key])
    })
    .value()
}

function actions(service, self, name) {
  const actions = self.$store ? self.$store._actions : self._actions
  const keys = Object.keys(actions)
  const regex = new RegExp('^' + name + '/')
  _(keys)
    .filter(key => regex.test(key))
    .map(key => {
      const property = key.replace(regex, '').split('/').join('.')
      const isExist = _.get(service, property)
      if (isExist) throw new Error('duplicate key')
      const that = self.$store ? self.$store : self
      _.set(service, property, (payload, patch) => {
        patch && (payload.__patch = patch)
        that.dispatch(key, payload)
      })
    })
    .value()
}

function mutations(service, self, name) {
  const mutations = self.$store ? self.$store._mutations : self._mutations
  const keys = Object.keys(mutations)
  const regex = new RegExp('^' + name + '/')
  _(keys)
    .filter(key => regex.test(key))
    .map(key => {
      const props = key.replace(regex, '').split('/')
      props.splice(props.length - 1, 0, 'm')
      const property = props.join('.')
      const that = self.$store ? self.$store : self
      _.set(service, property, (prop, payload) => {
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
          data.prop = prop
          data.value = payload
        } else {
          throw new Error('Incorrect arguements.')
        }

        that.commit(key, data)
      })
    })
    .value()
}

function state(service, self, name) {
  const state = self.$store ? self.$store.state : self.state;
  const key = name.split('/').join('.')
  exportState(state, key, service)
}

function exportState(state, key, service) {
  const keys = Object.keys(_.get(state, key));
  _(keys)
    .map(function (prop) {
      if (!_.get(service, prop)) {
        _.set(service, prop, _.get(state, key + '.' + prop))
      } else {
        exportState(_.get(state, key), prop, service[prop])
      }
    })
    .value();
}

let cache = {}

export default function Store(name) {
  if (cache[name]) {
    getters(cache[name], this, name)
    return cache[name]
  }
  let service = {}
  getters(service, this, name)
  actions(service, this, name)
  mutations(service, this, name)
  state(service, this, name)
  cache[name] = service
  return service
}