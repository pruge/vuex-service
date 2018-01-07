/*!
 * vuex-service v0.2.1 
 * (c) 2018 james kim
 * Released under the MIT License.
 */
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('vuex'), require('lodash')) :
  typeof define === 'function' && define.amd ? define(['exports', 'vuex', 'lodash'], factory) :
  (factory((global.VuexService = global.VuexService || {}),global.Vuex,global._));
}(this, (function (exports,Vuex,_) { 'use strict';

Vuex = 'default' in Vuex ? Vuex['default'] : Vuex;
_ = 'default' in _ ? _['default'] : _;

var defaultMutations = {
  set: function set(state, ref) {
    var prop = ref[0];
    var value = ref[1];

    _.set(state, prop, value);
  },
  add: function add(state, ref) {
    var prop = ref[0];
    var value = ref[1];

    _.get(state, prop).push(value);
  },
  update: function update(state, ref) {
    var prop = ref[0];
    var value = ref[1];

    if (_.isString(prop)) {
      _.set(state, prop, value);
    } else {
      _.merge(prop, value);
    }
  },
  remove: function remove(state, ref) {
    var prop = ref[0];
    var value = ref[1];

    _.get(state, prop).splice(_.get(state, prop).indexOf(value), 1);
  }
};

// reference https://github.com/rubenv/angular-tiny-eventemitter
var key = '$$tinyEventListeners';
var EventBus = function EventBus() {
  this.events = {};
};

EventBus.prototype.$on = function $on ($scope, event, fn) {
  if (!this[key]) {
    this[key] = {};
  }

  var events = this[key];
  if (!events[event]) {
    events[event] = [];
  }

  events[event].push(fn);

  if ($scope && $scope.$on) {
    var self = this;
    $scope.$on('hook:beforeDestroy', function () {
      self.$off(event, fn);
    });
  }

  return this
};

EventBus.prototype.$once = function $once ($scope, event, broadEvent, fn) {
  var self = this;
  var cb = function() {
    fn.apply(this, arguments);
    self.$off(event, cb);
    self.$off(broadEvent, cb);
  };

  this.$on($scope, event, cb);
  this.$on($scope, broadEvent, cb);
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
    .filter(function(evt) {
      var regex = new RegExp(evt.replace(/\./g, '\\.').replace(/\*/g, '.*') + '$');
      return regex.test(event)
    })
    .reduce(function(arr, evt) {
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
    $emit: function $emit(event, data) {
      // console.log('$emit', `${namespace}.${event}`)
      self.$emit((namespace + "." + event), data);
    },
    $broadcast: function $broadcast(event, data) {
      // console.log('$broadcast', `${event}`)
      self.$emit(("__All__." + event), data);
    },
    $on: function $on($scope, event, fn) {
      if (typeof $scope === 'string') {
        fn = event;
        event = $scope;
        $scope = null;
      }
      // console.log('$on', `${namespace}.${event}`)
      self.$on($scope, (namespace + "." + event), fn);
      self.$on($scope, ("__All__." + event), fn);
    },
    $once: function $once($scope, event, fn) {
      if (typeof $scope === 'string') {
        fn = event;
        event = $scope;
        $scope = null;
      }
      // console.log('$once', `${namespace}.${event}`)
      self.$once($scope, (namespace + "." + event), ("__All__." + event), fn);
    },
    $off: function $off(event, fn) {
      // console.log('$off', `${namespace}.${event}`)
      self.$off((namespace + "." + event), fn);
      self.$off(("__All__." + event), fn);
    }
  };

  this.events[namespace] = instance;
  return instance
};

var EventBus$1 = new EventBus();

function getters(service, self, name) {
  var getters = self.$store ? self.$store.getters : self.getters;
  var keys = Object.keys(getters);
  var regex = name ? new RegExp('^' + name + '/') : new RegExp('');
  _(keys)
    .filter(function (key) { return regex.test(key); })
    .map(function (key) {
      var property = key
        .replace(regex, '')
        .split('/')
        .join('.');
      _.set(service, property, getters[key]);
    })
    .value();
}

function actions(service, self, name) {
  var actions = self.$store ? self.$store._actions : self._actions;
  var keys = Object.keys(actions);
  var regex = name ? new RegExp('^' + name + '/') : new RegExp('');
  _(keys)
    .filter(function (key) { return regex.test(key); })
    .map(function (key) {
      var property = key
        .replace(regex, '')
        .split('/')
        .join('.');
      var isExist = _.get(service, property);
      if (isExist) { throw new Error('duplicate key') }
      var that = self.$store ? self.$store : self;
      _.set(service, property, function(payload, value) {
        var data;
        var args = Array.prototype.slice.call(arguments);
        if (args.length === 1) {
          data = payload;
        } else {
          data = args;
        }
        return that.dispatch(key, data)
      });
    })
    .value();
}

function mutations(service, self, name) {
  var mutations = self.$store ? self.$store._mutations : self._mutations;
  var keys = Object.keys(mutations);
  var regex = name ? new RegExp('^' + name + '/') : new RegExp('');
  _(keys)
    .filter(function (key) { return regex.test(key); })
    .map(function (key) {
      var props = key.replace(regex, '').split('/');
      props.splice(props.length - 1, 0, 'm');
      var property = props.join('.');
      var that = self.$store ? self.$store : self;
      _.set(service, property, function(prop, value) {
        var data = {};
        var args = Array.prototype.slice.call(arguments);
        if (args.length === 1) {
          data = prop;
        } else {
          data = args;
        }
        return that.commit(key, data)
      });
    })
    .value();
}

function state(service, self, name) {
  var state = self.$store ? self.$store.state : self.state;
  var key = name.split('/').join('.');
  exportState(state, key, service);
}

function exportState(state, key, service) {
  var keys = key ? Object.keys(_.get(state, key)) : Object.keys(state);
  _(keys)
    .map(function(prop) {
      if (!_.get(service, prop)) {
        var prop2 = key ? (key + "." + prop) : prop;
        _.set(service, prop, _.get(state, prop2));
      } else {
        var state2 = key ? _.get(state, key) : state;
        exportState(state2, prop, service[prop]);
      }
    })
    .value();
}

// function capitalizeFirstCharacter(str) {
//   return str[0].toUpperCase() + str.substring(1)
// }

function Store(name, store) {
  if ( name === void 0 ) name = '';

  var ref = this;
  if (store) {
    ref = store;
  }
  var names = name
    .trim()
    .replace(' ', '')
    .split(',');
  var group = {},
    prop;
  names.forEach(function (name) {
    var service = {};
    getters(service, ref, name);
    actions(service, ref, name);
    mutations(service, ref, name);
    state(service, ref, name);
    _.merge(service, EventBus$1.getInstance(name));

    var regex = /.+\/([-_\w\d]+)$/;
    prop = (regex.test(name) ? regex.exec(name)[1] : name) || 'Root';
    group[prop] = service;
  });

  return names.length > 1 ? group : group[prop]
}

function plugin (Vue, options) {
  if ( options === void 0 ) options = {};

  // const store = options.store
  // const flgMutation = options.mutation || false

  // if (!store) {
  //   throw new Error('Not defined store')
  // }

  // flgMutation && addMutation(store)
  var key = '$$store';
  if (!Vue.prototype.hasOwnProperty(key)) {
    Object.defineProperty(Vue.prototype, key, {
      get: function get () {
        return Store
      }
    });
    Vuex.Store.prototype[key] = Store;
  }
}

plugin.version = '0.2.1';

exports['default'] = plugin;
exports.Store = Store;
exports.defaultMutations = defaultMutations;

Object.defineProperty(exports, '__esModule', { value: true });

})));
