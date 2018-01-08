import _ from 'lodash'

const defaultMutations = {
  set(state, [prop, value]) {
    _.set(state, prop, value)
  },
  // reset(state, prop) {
  //   const recursiveReset = function(state, prop) {
  //     const data = _.get(state, prop)
  //     if (_.isArray(data)) {
  //       _.set(state, prop, [])
  //     } else if (_.isString(data)) {
  //       _.set(state, prop, undefined)
  //     } else if (_.isBoolean(data)) {
  //       _.set(state, prop, false)
  //     } else {
  //       Object.keys(data).map(function(key) {
  //         recursiveReset(state, prop + '.' + key)
  //       })
  //     }
  //   }
  //   recursiveReset(state, prop)
  // },
  add(state, [prop, value]) {
    _.get(state, prop).push(value)
  },
  update(state, [prop, value]) {
    if (_.isString(prop)) {
      _.set(state, prop, value)
    } else {
      _.merge(prop, value)
    }
  },
  remove(state, [prop, value]) {
    _.get(state, prop).splice(_.get(state, prop).indexOf(value), 1)
  }
}

export default function addMutation(store) {
  _.set(store, 'mutations', _.merge(store.mutations, defaultMutations))
  if (store.modules) {
    _.forEach(store.modules, module => addMutation(module))
  }
}

export { defaultMutations }
