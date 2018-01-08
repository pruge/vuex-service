import _ from 'lodash'
import EventBus from './EventBus'
import hooks from './hooks'

function setGetter(service, fnName, getters, field_name) {
  try {
    Object.defineProperty(service, fnName, {
      get: function() {
        return _.get(getters, field_name)
        // return getters[field_name]
      }
      // set: function(newValue) {
      //   getters[field_name] = newValue
      // }
    })
  } catch (e) {}
}

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
      // _.set(service, property, getters[key])
      var fnName = key.replace(/[-_\w\d]+\//, '')
      setGetter(service, fnName, getters, key)
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
          if (_.isObject(hooked)) {
            _.forEach(hooked, (hook, name) => _.set(service, name, hook))
          } else {
            _.set(service, property, hooked)
          }
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
          if (_.isObject(hooked)) {
            _.forEach(hooked, (hook, name) => _.set(service, name, hook))
          } else {
            _.set(service, property, hooked)
          }
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

/**
 *
 * @param {*} service - vuexService 객체
 * @param {*} key - vuex의 모듈 이름
 * @param {*} prop - vuexService 객체에 할당 할 property name
 * @param {*} ref - store reference
 * @param {*} property - 실제 ref에서 참조할 경로
 */
function setStateGetter(service, key, prop, ref, property) {
  const target = key ? _.get(service, key) : service
  try {
    Object.defineProperty(target, prop, {
      get: function() {
        var state = ref.$store ? ref.$store.state : ref.state
        return _.get(state, property)
      },
      set: function(newValue) {
        var state = ref.$store ? ref.$store.state : ref.state
        _.set(state, property, newValue)
      }
    })
  } catch (e) {}
}

/**
 *
 * @param {*} service - vuexService 객체
 * @param {*} self - store reference
 * @param {*} name - vuexService의 요청 이름, Todo, '', Todo/comments
 */
function state(service, self, name) {
  const key = name.split('/').join('.')
  exportState(self, key, '', service)
}

/**
 *
 * @param {*} ref - store reference
 * @param {*} root - vuex의 모듈 이름
 * @param {*} key - 하위 vuex의 모듈 이름
 * @param {*} service - vuexService 객체
 */
function exportState(ref, root, key, service) {
  const state = ref.$store ? ref.$store.state : ref.state
  const keys = root ? Object.keys(_.get(state, root)) : Object.keys(state)
  _(keys)
    .map(function(_key) {
      if (!_.get(service, _key)) {
        const prop = `${root}.${_key}`.replace(/^\./, '')
        // console.log(key, ',', _key, ',', prop)
        setStateGetter(service, key, _key, ref, prop)
      } else {
        // console.log('module =', property, ',', key, ',', _key)
        const prop = `${root}.${_key}`.replace(/^\./, '')
        exportState(ref, prop, _key, service)
      }
    })
    .value()
}

let cache = {}
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

      if (cache[prop]) {
        group[prop] = cache[prop]
        return
      }

      let service = {}
      getters(service, ref, name)
      actions(service, ref, name, prop, isUseHook)
      mutations(service, ref, name, prop, isUseHook)
      state(service, ref, name)
      _.merge(service, EventBus.getInstance(name))
      group[prop] = service
      cache[prop] = service
    })

    return names.length > 1 ? group : group[prop]
  }
}
