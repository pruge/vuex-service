// import _ from 'lodash'
import chain from 'lochain'
import set from 'lodash.set'
import get from 'lodash.get'
import merge from 'lodash.merge'
import forEach from 'lodash.foreach'

const defaultMutations = {
  set(state, { prop, value }) {
    // _.set(state, prop, value)
    set(state, prop, value)
  },
  add(state, { prop, value }) {
    // _.get(state, prop).push(value)
    get(state, prop).push(value)
  },
  update(state, { prop, value }) {
    // if (_.isString(prop)) {
    if (typeof prop === 'string') {
      // _.set(state, prop, value)
      set(state, prop, value)
    } else {
      // _.merge(prop, value)
      merge(prop, value)
    }
  },
  remove(state, { prop, value }) {
    // _.get(state, prop).splice(_.get(state, prop).indexOf(value), 1)
    get(state, prop).splice(get(state, prop).indexOf(value), 1)
  }
}

export default function addMutation(store) {
  // _.set(store, 'mutations', _.merge(store.mutations, defaultMutations))
  set(store, 'mutations', merge(store.mutations, defaultMutations))
  if (store.modules) {
    // _.forEach(store.modules, (module) => addMutation(module))
    forEach(store.modules, (module) => addMutation(module))
  }
}

export { defaultMutations }
