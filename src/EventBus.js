import Vue from 'vue'

// reference https://github.com/rubenv/angular-tiny-eventemitter
const key = '$$tinyEventListeners'
class EventBus {
  constructor() {
    this.eventBus = new Vue()
    this.events = {}
  }

  $on (event, fn) {
    if (!this[key]) {
      this[key] = {}
    }

    let events = this[key]
    if (!events[event]) {
      events[event] = []
    }

    events[event].push(fn)

    return this
  }

  $once (event, broadEvent, fn) {
    const self = this
    const cb = function () {
      fn.apply(this, arguments)
      self.$off(event, cb)
      self.$off(broadEvent, cb)
    }

    this.$on(event, cb)
    this.$on(broadEvent, cb)
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
        console.log('$emit', `${namespace}.${event}`)
        self.$emit(`${namespace}.${event}`, data)
      },
      $broadcast (event, data) {
        console.log('$broadcast', `${event}`)
        self.$emit(`__All__.${event}`, data)
      },
      $on (event, fn) {
        console.log('$on', `${namespace}.${event}`)
        self.$on(`${namespace}.${event}`, fn)
        self.$on(`__All__.${event}`, fn)
      },
      $once (event, fn) {
        console.log('$once', `${namespace}.${event}`)
        self.$once(`${namespace}.${event}`, `__All__.${event}`, fn)
      },
      $off (event, fn) {
        console.log('$off', `${namespace}.${event}`)
        self.$off(`${namespace}.${event}`, fn)
        self.$off(`__All__.${event}`, fn)
      }
    }

    this.events[namespace] = instance
    return instance
  }
}

export default new EventBus





