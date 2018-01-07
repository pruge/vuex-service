/*!
 * vuex-service v0.2.2 
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

// modified https://github.com/bnoguchi/hooks-js
// TODO Add in pre and post skipping options
var _pres = {};
var _posts = {};
var _hooks = {};
var HooK = function HooK () {};

HooK.prototype.hook = function hook (namespace, name, fn, errorCb) {
  // if (arguments.length === 1 && typeof name === 'object') {
  // for (var k in name) {
  //   // `name` is a hash of hookName->hookFn
  //   this.hook(k, name[k])
  // }
  // return
  // }
  var proto = (_hooks[namespace] = _hooks[namespace] || {}),
    $pres = (_pres[namespace] = _pres[namespace] || {}),
    $posts = (_posts[namespace] = _posts[namespace] || {});
  $pres[name] = $pres[name] || [];
  $posts[name] = $posts[name] || [];

  if (proto[name]) {
    return proto[name]
  }

  proto[name] = function() {
    var self = this,
      hookArgs, // arguments eventually passed to the hook - are mutable
      lastArg = arguments[arguments.length - 1],
      pres = $pres[name],
      posts = $posts[name],
      _total = pres.length,
      _current = -1,
      _asyncsLeft = proto[name].numAsyncPres,
      _next = function() {
        if (arguments[0] instanceof Error) {
          return handleError(arguments[0])
        }
        var _args = Array.prototype.slice.call(arguments),
          currPre,
          preArgs;
        if (_args.length && !(arguments[0] == null && typeof lastArg === 'function'))
          { hookArgs = _args; }
        if (++_current < _total) {
          currPre = pres[_current];
          if (currPre.isAsync && currPre.length < 2)
            { throw new Error(
              'Your pre must have next and done arguments -- e.g., function (next, done, ...)'
            ) }
          if (currPre.length < 1)
            { throw new Error('Your pre must have a next argument -- e.g., function (next, ...)') }
          preArgs = (currPre.isAsync ? [once(_next), once(_asyncsDone)] : [once(_next)]).concat(
            hookArgs
          );
          return currPre.apply(self, preArgs)
        } else if (!proto[name].numAsyncPres) {
          return _done.apply(self, hookArgs)
        }
      },
      _done = function() {
        var args_ = Array.prototype.slice.call(arguments),
          ret,
          total_,
          current_,
          next_,
          done_,
          postArgs;

        if (_current === _total) {
          next_ = function() {
            if (arguments[0] instanceof Error) {
              return handleError(arguments[0])
            }
            var args_ = Array.prototype.slice.call(arguments, 1),
              currPost,
              postArgs;
            if (args_.length) { hookArgs = args_; }
            if (++current_ < total_) {
              currPost = posts[current_];
              if (currPost.length < 1)
                { throw new Error(
                  'Your post must have a next argument -- e.g., function (next, ...)'
                ) }
              postArgs = [once(next_)].concat(hookArgs);
              return currPost.apply(self, postArgs)
            } else if (typeof lastArg === 'function') {
              // All post handlers are done, call original callback function
              return lastArg.apply(self, arguments)
            }
          };

          // We are assuming that if the last argument provided to the wrapped function is a function, it was expecting
          // a callback.We trap that callback and wait to call it until all post handlers have finished.
          if (typeof lastArg === 'function') {
            args_[args_.length - 1] = once(next_);
          }

          total_ = posts.length;
          current_ = -1;
          ret = fn.apply(self, args_); // Execute wrapped function, post handlers come afterward

          if (total_ && typeof lastArg !== 'function') { return next_() } // no callback provided, execute next_() manually
          return ret
        }
      };
    if (_asyncsLeft) {
      function _asyncsDone(err) {
        if (err && err instanceof Error) {
          return handleError(err)
        }
        --_asyncsLeft || _done.apply(self, hookArgs);
      }
    }
    function handleError(err) {
      if ('function' == typeof lastArg) { return lastArg(err) }
      if (errorCb) { return errorCb.call(self, err) }
      throw err
    }
    return _next.apply(this, arguments)
  };

  proto[name].numAsyncPres = 0;

  return proto[name]
};

HooK.prototype.pre = function pre (namespace, name, isAsync, fn, errorCb) {
  if ('boolean' !== typeof arguments[2]) {
    errorCb = fn;
    fn = isAsync;
    isAsync = false;
  }
  var proto = (_hooks[namespace] = _hooks[namespace] || {}),
    pres = (_pres[namespace] = _pres[namespace] || {});

  // var proto = this.prototype || this,
  // pres = (_pres = _pres || {})

  this._lazySetupHooks(namespace, proto, name, errorCb);

  if ((fn.isAsync = isAsync)) {
    proto[name].numAsyncPres++;
  }

  (pres[name] = pres[name] || []).push(fn);
  return this
};

HooK.prototype.post = function post (namespace, name, isAsync, fn) {
  if (arguments.length === 3) {
    fn = isAsync;
    isAsync = false;
  }
  var proto = (_hooks[namespace] = _hooks[namespace] || {}),
    posts = (_posts[namespace] = _posts[namespace] || {});

  this._lazySetupHooks(namespace, proto, name)
  ;(posts[name] = posts[name] || []).push(fn);
  return this
};

HooK.prototype.removePre = function removePre (namespace, name, fnToRemove) {
  var proto = (_hooks[namespace] = _hooks[namespace] || {}),
    pres = (_pres[namespace] = _pres[namespace] || {});
  // var proto = this.prototype || this,
  // pres = _pres || (_pres || {})
  if (!pres[name]) { return this }
  if (arguments.length === 2) {
    // Remove all pre callbacks for hook `name`
    pres[name].length = 0;
  } else {
    pres[name] = pres[name].filter(function(currFn) {
      return currFn !== fnToRemove
    });
  }
  return this
};

HooK.prototype._lazySetupHooks = function _lazySetupHooks (namespace, proto, methodName, errorCb) {
  if (!proto[methodName]) {
    throw new Error(("There is no " + namespace + "." + methodName + " action/mutation function."))
  }
  if ('undefined' === typeof proto[methodName].numAsyncPres) {
    this.hook(methodName, proto[methodName], errorCb);
  }
};

function once(fn, scope) {
  return function fnWrapper() {
    if (fnWrapper.hookCalled) { return }
    fnWrapper.hookCalled = true;
    return fn.apply(scope, arguments)
  }
}

function props(obj) {
  return _.without(Object.getOwnPropertyNames(Object.getPrototypeOf(obj)), 'constructor')
}
var hooks = new HooK();
_.bindAll(hooks, props(hooks));

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

function actions(service, self, name, prop) {
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
      var fn = function(payload, value) {
        var data;
        var args = Array.prototype.slice.call(arguments);
        if (args.length === 1) {
          data = payload;
        } else {
          data = args;
        }
        return that.dispatch(key, data)
      };
      // _.set(service, property, fn)
      _.set(service, property, hooks.hook(prop, property, fn));
      _.set(service, 'pre', _.partial(hooks.pre, prop));
      _.set(service, 'post', _.partial(hooks.post, prop));
    })
    .value();
}

function mutations(service, self, name, prop) {
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
      var fn = function(prop, value) {
        var data = {};
        var args = Array.prototype.slice.call(arguments);
        if (args.length === 1) {
          data = prop;
        } else {
          data = args;
        }
        return that.commit(key, data)
      };
      // _.set(service, property, fn)
      _.set(service, property, hooks.hook(prop, property, fn));
      _.set(service, 'pre', _.partial(hooks.pre, prop));
      _.set(service, 'post', _.partial(hooks.post, prop));
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
  var group = {};
  var prop;
  names.forEach(function (name) {
    var regex = /.+\/([-_\w\d]+)$/;
    prop = (regex.test(name) ? regex.exec(name)[1] : name) || 'Root';

    var service = {};
    getters(service, ref, name);
    actions(service, ref, name, prop);
    mutations(service, ref, name, prop);
    state(service, ref, name);
    _.merge(service, EventBus$1.getInstance(name));
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

plugin.version = '0.2.2';

exports['default'] = plugin;
exports.Store = Store;
exports.defaultMutations = defaultMutations;

Object.defineProperty(exports, '__esModule', { value: true });

})));
