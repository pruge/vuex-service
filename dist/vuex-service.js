/*!
 * vuex-service v0.1.0 
 * (c) 2018 james kim
 * Released under the MIT License.
 */
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('vuex'), require('lodash')) :
  typeof define === 'function' && define.amd ? define(['vuex', 'lodash'], factory) :
  (global.VuexService = factory(global.Vuex,global._));
}(this, (function (Vuex,_) { 'use strict';

Vuex = 'default' in Vuex ? Vuex['default'] : Vuex;
_ = 'default' in _ ? _['default'] : _;

var mutations = {
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
      delete prop.__patch;
    }
  },
  remove: function remove(state, ref) {
    var prop = ref.prop;
    var value = ref.value;

    _.get(state, prop).splice(_.get(state, prop).indexOf(value), 1);
  }
};

function addMutation(store) {
  _.set(store, 'mutations', _.merge(store.mutations, mutations));
  if (store.modules) {
    _.forEach(store.modules, function (module) { return addMutation(module); });
  }
}

function getters(service, self, name) {
  var getters = self.$store ? self.$store.getters : self.getters;
  var keys = Object.keys(getters);
  var regex = new RegExp('^' + name + '/');
  _(keys)
    .filter(function (key) { return regex.test(key); })
    .map(function (key) {
      var property = key.replace(regex, '').split('/').join('.');
      _.set(service, property, getters[key]);
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
      _.set(service, property, function (payload, patch) {
        patch && (payload.__patch = patch);
        that.dispatch(key, payload);
      });
    })
    .value();
}

function mutations$1(service, self, name) {
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
      _.set(service, property, function (prop, payload) {
        var data = {};
        if (_.isString(prop) && !_.isUndefined(payload)) {
          // string any
          data.prop = prop;
          data.value = payload;
        } else if (!payload) {
          // any
          data = prop;
        } else if (_.isObject(prop) && _.isObject(payload)) {
          // obj obj
          data.prop = prop;
          data.value = payload;
        } else {
          throw new Error('Incorrect arguements.')
        }

        that.commit(key, data);
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
  var keys = Object.keys(_.get(state, key));
  _(keys)
    .map(function (prop) {
      if (!_.get(service, prop)) {
        _.set(service, prop, _.get(state, key + '.' + prop));
      } else {
        exportState(_.get(state, key), prop, service[prop]);
      }
    })
    .value();
}

var cache = {};

function Store(name) {
  if (cache[name]) {
    getters(cache[name], this, name);
    return cache[name]
  }
  var service = {};
  getters(service, this, name);
  actions(service, this, name);
  mutations$1(service, this, name);
  state(service, this, name);
  cache[name] = service;
  return service
}

function plugin (Vue, options) {
  if ( options === void 0 ) options = {};

  var store = options.store;
  var flgMutation = options.mutation || true;

  if (!store) {
    throw new Error('Not defined store')
  }

  flgMutation && addMutation(store);
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

plugin.version = '0.1.0';

return plugin;

})));
