import _ from 'lodash'
import EventBus from './EventBus'
import hooks from './hooks'

function getters(service, self, name) {
  const getters = self.$store ? self.$store.getters : self.getters
  const keys = Object.keys(getters)
  const regex = name ? new RegExp('^' + name + '/') : new RegExp('')
  _(keys)
    .filter(key => regex.test(key))
    .map(key => {
      const property = key
        .replace(regex, '')
        .split('/')
        .join('.')
      _.set(service, property, getters[key])
    })
    .value()
}

function checkExistFn(service, prop, property) {
  if (_.isString(property)) {
    var isFn = _.get(service, property)
    if (!isFn) {
      throw new Error('The function does not exist. ' + prop + '.' + property)
    }
  } else {
    _.forEach(property, (value, key) => {
      var isFn = _.get(service, key)
      if (!isFn) {
        throw new Error('The function does not exist. ' + prop + '.' + key)
      }
    })
  }
}

function actions(service, self, name, prop, isUseHook) {
  const actions = self.$store ? self.$store._actions : self._actions
  const keys = Object.keys(actions)
  const regex = name ? new RegExp('^' + name + '/') : new RegExp('')
  _(keys)
    .filter(key => regex.test(key))
    .map(key => {
      const property = key
        .replace(regex, '')
        .split('/')
        .join('.')
      const isExist = _.get(service, property)
      if (isExist) throw new Error('duplicate key')
      const that = self.$store ? self.$store : self
      const fn = function(payload, value) {
        let data
        const args = Array.prototype.slice.call(arguments)
        if (args.length === 1) {
          data = payload
        } else {
          data = args
        }
        return that.dispatch(key, data)
      }
      if (isUseHook) {
        _.set(service, property, hooks.getHook(prop, property, fn))
        _.set(service, 'hook', function(property) {
          checkExistFn(service, prop, property)
          const hooked = _.partial(hooks.hook, prop).apply(this, [].slice.call(arguments))
          _.set(service, property, hooked)
        })
        _.set(service, 'pre', function() {
          _.partial(hooks.pre, prop).apply(this, [].slice.call(arguments))
          return service
        })
        _.set(service, 'post', function() {
          _.partial(hooks.post, prop).apply(this, [].slice.call(arguments))
          return service
        })
      } else {
        _.set(service, property, fn)
      }
    })
    .value()
}

function mutations(service, self, name, prop, isUseHook) {
  const mutations = self.$store ? self.$store._mutations : self._mutations
  const keys = Object.keys(mutations)
  const regex = name ? new RegExp('^' + name + '/') : new RegExp('')
  _(keys)
    .filter(key => regex.test(key))
    .map(key => {
      const props = key.replace(regex, '').split('/')
      props.splice(props.length - 1, 0, 'm')
      const property = props.join('.')
      const that = self.$store ? self.$store : self
      const fn = function(prop, value) {
        let data = {}
        const args = Array.prototype.slice.call(arguments)
        if (args.length === 1) {
          data = prop
        } else {
          data = args
        }
        return that.commit(key, data)
      }
      if (isUseHook) {
        _.set(service, property, hooks.getHook(prop, property, fn))
        _.set(service, 'hook', function(property) {
          checkExistFn(service, prop, property)
          const hooked = _.partial(hooks.hook, prop).apply(this, [].slice.call(arguments))
          _.set(service, property, hooked)
        })
        // _.set(service, 'pre', _.partial(hooks.pre, prop))
        // _.set(service, 'post', _.partial(hooks.post, prop))
        _.set(service, 'pre', function() {
          _.partial(hooks.pre, prop).apply(this, [].slice.call(arguments))
          return service
        })
        _.set(service, 'post', function() {
          _.partial(hooks.post, prop).apply(this, [].slice.call(arguments))
          return service
        })
      } else {
        _.set(service, property, fn)
      }
    })
    .value()
}

function state(service, self, name) {
  const state = self.$store ? self.$store.state : self.state
  const key = name.split('/').join('.')
  exportState(state, key, service)
}

function exportState(state, key, service) {
  const keys = key ? Object.keys(_.get(state, key)) : Object.keys(state)
  _(keys)
    .map(function(prop) {
      if (!_.get(service, prop)) {
        const prop2 = key ? `${key}.${prop}` : prop
        _.set(service, prop, _.get(state, prop2))
      } else {
        const state2 = key ? _.get(state, key) : state
        exportState(state2, prop, service[prop])
      }
    })
    .value()
}

export default function(options) {
  const isUseHook = options.hook
  return function Store(name = '', store) {
    let ref = this
    if (!_.isString(name)) {
      store = name
      name = ''
    }
    if (store) {
      ref = store
    }
    const names = name
      .trim()
      .replace(' ', '')
      .split(',')
    let group = {}
    let prop
    names.forEach(name => {
      const regex = /.+\/([-_\w\d]+)$/
      prop = (regex.test(name) ? regex.exec(name)[1] : name) || 'Root'

      let service = {}
      getters(service, ref, name)
      actions(service, ref, name, prop, isUseHook)
      mutations(service, ref, name, prop, isUseHook)
      state(service, ref, name)
      _.merge(service, EventBus.getInstance(name))
      group[prop] = service
    })

    return names.length > 1 ? group : group[prop]
  }
}
