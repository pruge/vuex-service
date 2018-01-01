import _ from 'lodash'

export default function addMutation(store) {
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

  appendMutation(store)
}

function appendMutation(obj) {
  _.set(obj, 'mutations', _.merge(obj.mutations, mutations))
  if (obj.modules) {
    _.forEach(obj.modules, (module) => appendMutation(module))
  }
}
