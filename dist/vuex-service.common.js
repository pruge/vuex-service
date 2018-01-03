/*!
 * vuex-service v0.1.6 
 * (c) 2018 james kim
 * Released under the MIT License.
 */
'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var Vuex = _interopDefault(require('vuex'));
var _ = _interopDefault(require('lodash'));
var Vue = _interopDefault(require('vue'));

var defaultMutations = {
  set: function set(state, ref) {
    var prop = ref.prop;
    var value = ref.value;

    _.set(state, prop, value);
  },
  add: function add(state, ref) {
    var prop = ref.prop;
    var value = ref.value;

    _.get(state, prop).push(value);
  },
  update: function update(state, ref) {
    var prop = ref.prop;
    var value = ref.value;

    if (_.isString(prop)) {
      _.set(state, prop, value);
    } else {
      _.merge(prop, value);
    }
  },
  remove: function remove(state, ref) {
    var prop = ref.prop;
    var value = ref.value;

    _.get(state, prop).splice(_.get(state, prop).indexOf(value), 1);
  }
};

// reference https://github.com/rubenv/angular-tiny-eventemitter
var key = '$$tinyEventListeners';
var EventBus = function EventBus() {
  this.eventBus = new Vue();
  this.events = {};
};

EventBus.prototype.$on = function $on (event, fn) {
  if (!this[key]) {
    this[key] = {};
  }

  var events = this[key];
  if (!events[event]) {
    events[event] = [];
  }

  events[event].push(fn);

  return this
};

EventBus.prototype.$once = function $once (event, broadEvent, fn) {
  var self = this;
  var cb = function () {
    fn.apply(this, arguments);
    self.$off(event, cb);
    self.$off(broadEvent, cb);
  };

  this.$on(event, cb);
  this.$on(broadEvent, cb);
  return this
};

EventBus.prototype.$off = function $off (event, fn) {
  if (!this[key] || !this[key][event]) {
    return this
  }

  var events = this[key];
  if (!fn) {
    delete events[event];
  } else {
    var listeners = events[event];
    var index = listeners.indexOf(fn);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  }
  return this
};

EventBus.prototype.getListeners = function getListeners (event) {
  var self = this;
  return Object.keys(self[key])
    .filter(function (evt) {
      var regex = new RegExp(evt.replace(/\./g, '\\.').replace(/\*/g, '\.*') + '$');
      return regex.test(event)
    })
    .reduce(function (arr, evt) {
      return arr.concat(self[key][evt])
    }, [])
};

EventBus.prototype.$emit = function $emit (event) {
  if (!this[key]) {
    return
  }

  // Making a copy here to allow `off` in listeners.
  var listeners = this.getListeners.call(this, event);
  var params = [].slice.call(arguments, 1);
  for (var i = 0; i < listeners.length; i++) {
    listeners[i].apply(null, params);
  }
  return this
};

EventBus.prototype.getInstance = function getInstance (namespace) {
  var self = this;

  if (this.events[namespace]) {
    return this.events[namespace]
  }

  var instance = {
    $emit: function $emit (event, data) {
      console.log('$emit', (namespace + "." + event));
      self.$emit((namespace + "." + event), data);
    },
    $broadcast: function $broadcast (event, data) {
      console.log('$broadcast', ("" + event));
      self.$emit(("__All__." + event), data);
    },
    $on: function $on (event, fn) {
      console.log('$on', (namespace + "." + event));
      self.$on((namespace + "." + event), fn);
      self.$on(("__All__." + event), fn);
    },
    $once: function $once (event, fn) {
      console.log('$once', (namespace + "." + event));
      self.$once((namespace + "." + event), ("__All__." + event), fn);
    },
    $off: function $off (event, fn) {
      console.log('$off', (namespace + "." + event));
      self.$off((namespace + "." + event), fn);
      self.$off(("__All__." + event), fn);
    }
  };

  this.events[namespace] = instance;
  return instance
};

var EventBus$1 = new EventBus;

function getters(service, self, name) {
  var getters = self.$store ? self.$store.getters : self.getters;
  var keys = Object.keys(getters);
  var regex = new RegExp('^' + name + '/');
  // service.__getters = getters // getters  변경 이력을 추적하기위해 부모까지 포함
  _(keys)
    .filter(function (key) { return regex.test(key); })
    .map(function (key) {
      var property = key.replace(regex, '').split('/').join('.');
      _.set(service, property, getters[key]);
      // _.set(service, property, service.__getters[key])
      // Object.defineProperty(service, property, { get: function () { return this.__getters[key] } })
    })
    .value();
}

function actions(service, self, name) {
  var actions = self.$store ? self.$store._actions : self._actions;
  var keys = Object.keys(actions);
  var regex = new RegExp('^' + name + '/');
  _(keys)
    .filter(function (key) { return regex.test(key); })
    .map(function (key) {
      var property = key.replace(regex, '').split('/').join('.');
      var isExist = _.get(service, property);
      if (isExist) { throw new Error('duplicate key') }
      var that = self.$store ? self.$store : self;
      _.set(service, property, function (payload, value) {
        var data = payload;
        if (!_.isUndefined(value)) {
          data = {
            prop: payload,
            src: payload,
            value: value
          };
        }
        that.dispatch(key, data);
      });
    })
    .value();
}

function mutations(service, self, name) {
  var mutations = self.$store ? self.$store._mutations : self._mutations;
  var keys = Object.keys(mutations);
  var regex = new RegExp('^' + name + '/');
  _(keys)
    .filter(function (key) { return regex.test(key); })
    .map(function (key) {
      var props = key.replace(regex, '').split('/');
      props.splice(props.length - 1, 0, 'm');
      var property = props.join('.');
      var that = self.$store ? self.$store : self;
      _.set(service, property, function (prop, value) {
        var data = {};
        if (_.isUndefined(value)) {
          data = prop;
        } else {
          data.prop = prop;
          data.src = prop;
          data.value = value;
        }

        // if (_.isString(prop) && !_.isUndefined(payload)) {
        //   // string any
        //   data.prop = prop
        //   data.value = payload
        // } else if (!payload) {
        //   // any
        //   data = prop
        // } else if (_.isObject(prop) && _.isObject(payload)) {
        //   // obj obj
        //   data.prop = prop
        //   data.value = payload
        // } else {
        //   throw new Error('Incorrect arguements.')
        // }

        that.commit(key, data);
      });
    })
    .value();
}

function state(service, self, name) {
  var state = self.$store ? self.$store.state : self.state;
  var key = name.split('/').join('.');
  // service.__state = _.get(state, key) // state  변경 이력을 추적하기위해 부모까지 포함
  exportState(state, key, service);
}

function exportState(state, key, service) {
  var keys = Object.keys(_.get(state, key));
  _(keys)
    .map(function (prop) {
      if (!_.get(service, prop)) {
        _.set(service, prop, _.get(state, key + '.' + prop));
        // _.set(service, prop, _.get(this.__state, prop))
        // Object.defineProperty(service, prop, { get: function () { return this.__state[prop] } })
      } else {
        exportState(_.get(state, key), prop, service[prop]);
      }
    })
    .value();
}

function Store(name, store) {
  var ref = this;
  if (store) { ref = store; }
  var service = {};
  getters(service, ref, name);
  actions(service, ref, name);
  mutations(service, ref, name);
  state(service, ref, name);
  _.merge(service, EventBus$1.getInstance(name));
  return service
}

function plugin (Vue$$1, options) {
  if ( options === void 0 ) options = {};

  // const store = options.store
  // const flgMutation = options.mutation || false

  // if (!store) {
  //   throw new Error('Not defined store')
  // }

  // flgMutation && addMutation(store)
  var key = '$$store';
  if (!Vue$$1.prototype.hasOwnProperty(key)) {
    Object.defineProperty(Vue$$1.prototype, key, {
      get: function get () {
        return Store
      }
    });
    Vuex.Store.prototype[key] = Store;
  }
}

plugin.version = '0.1.6';

exports['default'] = plugin;
exports.Store = Store;
exports.defaultMutations = defaultMutations;
