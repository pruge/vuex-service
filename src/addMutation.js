import _ from 'lodash'

const defaultMutations = {
  set(state, { prop, value }) {
    _.set(state, prop, value)
  },
  add(state, { prop, value }) {
    _.get(state, prop).push(value)
  },
  update(state, { prop, value }) {
    if (_.isString(prop)) {
      _.set(state, prop, value)
    } else {
      _.merge(prop, value)
    }
  },
  remove(state, { prop, value }) {
    _.get(state, prop).splice(_.get(state, prop).indexOf(value), 1)
  }
}

export default function addMutation(store) {
  _.set(store, 'mutations', _.merge(store.mutations, defaultMutations))
  if (store.modules) {
    _.forEach(store.modules, (module) => addMutation(module))
  }
}
