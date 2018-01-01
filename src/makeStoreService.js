import _ from 'lodash'

let cache = {}
export default function Store(name) {
  if (cache[name]) {
    getters(cache[name], this)
    return cache[name]
  }
  let service = {}
  const that = this
  // getters
  getters(service, this)
  // console.log(this.$store)
  // const getters = this.$store ? this.$store.getters : this.getters
  // let keys = Object.keys(getters)
  // const regex = new RegExp('^' + name + '/')
  // _(keys)
  //   .filter(key => regex.test(key))
  //   .map(key => {
  //     const property = key.replace(regex, '').split('/').join('.')
  //     _.set(service, property, getters[key])
  //   })
  //   .value()

  // actions
  actions(service, this)
  // const actions = this.$store ? this.$store._actions : this._actions
  // keys = Object.keys(actions)
  // _(keys)
  //   .filter(key => regex.test(key))
  //   .map(key => {
  //     const property = key.replace(regex, '').split('/').join('.')
  //     const isExist = _.get(service, property)
  //     if (isExist) throw new Error('duplicate key')
  //     const self = that.$store ? that.$store : that
  //     _.set(service, property, (payload, patch) => {
  //       patch && (payload.__patch = patch)
  //       self.dispatch(key, payload)
  //     })
  //   })
  //   .value()

  // mutations
  mutations(service, this)
  // const mutations = this.$store ? this.$store._mutations : this._mutations
  // keys = Object.keys(mutations)
  // _(keys)
  //   .filter(key => regex.test(key))
  //   .map(key => {
  //     const props = key.replace(regex, '').split('/')
  //     props.splice(props.length - 1, 0, 'm')
  //     const property = props.join('.')
  //     const self = that.$store ? that.$store : that
  //     _.set(service, property, (prop, payload) => {
  //       let data = {}
  //       if (_.isString(prop) && !_.isUndefined(payload)) {
  //         // string any
  //         data.prop = prop
  //         data.value = payload
  //       } else if (!payload) {
  //         // any
  //         data = prop
  //       } else if (_.isObject(prop) && _.isObject(payload)) {
  //         // obj obj
  //         data.value = prop
  //         data.patch = payload
  //       } else {
  //         throw new Error('Incorrect arguements.')
  //       }

  //       // console.log(property, prop, payload, data)
  //       self.commit(key, data)
  //     })
  //   })
  //   .value()

  // state
  state(serive, this)
  // const state = this.$store ? this.$store.state : this.state;
  // const key = name.split('/').join('.')
  // exportState(state, key, service)
  // function exportState(state, key, service) {
  //   const keys = Object.keys(_.get(state, key));
  //   _(keys)
  //     .map(function (prop) {
  //       if (!_.get(service, prop)) {
  //         _.set(service, prop, _.get(state, key + '.' + prop))
  //       } else {
  //         exportState(_.get(state, key), prop, service[prop])
  //       }
  //     })
  //     .value();
  // }


  // console.log(service)
  cache[name] = service
  return service
}

function getters(service, self) {
  const getters = self.$store ? self.$store.getters : self.getters
  let keys = Object.keys(getters)
  const regex = new RegExp('^' + name + '/')
  _(keys)
    .filter(key => regex.test(key))
    .map(key => {
      const property = key.replace(regex, '').split('/').join('.')
      _.set(service, property, getters[key])
    })
    .value()
}

function mutations(service, self) {
  const actions = self.$store ? self.$store._actions : self._actions
  keys = Object.keys(actions)
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

function actions(service, self) {
  const mutations = self.$store ? self.$store._mutations : self._mutations
  keys = Object.keys(mutations)
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
          data.value = prop
          data.patch = payload
        } else {
          throw new Error('Incorrect arguements.')
        }

        // console.log(property, prop, payload, data)
        that.commit(key, data)
      })
    })
    .value()
}

function state(service, self) {
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
