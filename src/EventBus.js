// reference https://github.com/rubenv/angular-tiny-eventemitter
const key = '$$tinyEventListeners'
class EventBus {
  constructor() {
    this.events = {}
  }

  $on ($scope, event, fn) {
    if (!this[key]) {
      this[key] = {}
    }

    let events = this[key]
    if (!events[event]) {
      events[event] = []
    }

    events[event].push(fn)

    if ($scope && $scope.$on) {
      const self = this
      $scope.$on('hook:beforeDestroy', () => {
        self.$off(event, fn)
      })
    }

    return this
  }

  $once ($scope, event, broadEvent, fn) {
    const self = this
    const cb = function () {
      fn.apply(this, arguments)
      self.$off(event, cb)
      self.$off(broadEvent, cb)
    }

    this.$on($scope, event, cb)
    this.$on($scope, broadEvent, cb)
    return this
  }

  $off(event, fn) {
    if (!this[key] || !this[key][event]) {
      return this
    }

    let events = this[key]
    if (!fn) {
      delete events[event]
    } else {
      let listeners = events[event]
      const index = listeners.indexOf(fn)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
    return this
  }

  getListeners(event) {
    const self = this
    return Object.keys(self[key])
      .filter(function (evt) {
        const regex = new RegExp(evt.replace(/\./g, '\\.').replace(/\*/g, '\.*') + '$')
        return regex.test(event)
      })
      .reduce(function (arr, evt) {
        return arr.concat(self[key][evt])
      }, [])
  }

  $emit(event) {
    if (!this[key]) {
      return
    }

    // Making a copy here to allow `off` in listeners.
    const listeners = this.getListeners.call(this, event)
    const params = [].slice.call(arguments, 1)
    for (let i = 0; i < listeners.length; i++) {
      listeners[i].apply(null, params)
    }
    return this
  }

  getInstance(namespace) {
    const self = this

    if (this.events[namespace]) {
      return this.events[namespace]
    }

    const instance = {
      $emit (event, data) {
        // console.log('$emit', `${namespace}.${event}`)
        self.$emit(`${namespace}.${event}`, data)
      },
      $broadcast (event, data) {
        // console.log('$broadcast', `${event}`)
        self.$emit(`__All__.${event}`, data)
      },
      $on ($scope, event, fn) {
        if (typeof $scope === 'string') {
          fn = event
          event = $scope
          $scope = null
        }
        // console.log('$on', `${namespace}.${event}`)
        self.$on($scope, `${namespace}.${event}`, fn)
        self.$on($scope, `__All__.${event}`, fn)
      },
      $once ($scope, event, fn) {
        if (typeof $scope === 'string') {
          fn = event
          event = $scope
          $scope = null
        }
        // console.log('$once', `${namespace}.${event}`)
        self.$once($scope, `${namespace}.${event}`, `__All__.${event}`, fn)
      },
      $off (event, fn) {
        // console.log('$off', `${namespace}.${event}`)
        self.$off(`${namespace}.${event}`, fn)
        self.$off(`__All__.${event}`, fn)
      }
    }

    this.events[namespace] = instance
    return instance
  }
}

export default new EventBus





