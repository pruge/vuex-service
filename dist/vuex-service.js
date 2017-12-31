/*!
 * vuex-service v0.1.0 
 * (c) 2017 james kim
 * Released under the MIT License.
 */
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('lodash')) :
  typeof define === 'function' && define.amd ? define(['lodash'], factory) :
  (global.VuexService = factory(global.lodash));
}(this, (function (lodash) { 'use strict';

// 1. 기본 mutation를 각 store 파일에 추가
function addMutation(storeDir) {
  var mutations = {
    set: function set$1(state, ref) {
      var prop = ref.prop;
      var value = ref.value;

      lodash.set(state, prop, value);
    },
    add: function add(state, ref) {
      var prop = ref.prop;
      var value = ref.value;

      lodash.get(state, prop).push(value);
    },
    update: function update(state, ref) {
      var value = ref.value;
      var patch = ref.patch;

      lodash.merge(value, patch);
      delete value.__patch;
    },
    remove: function remove(state, ref) {
      var prop = ref.prop;
      var value = ref.value;

      lodash.get(state, prop).splice(lodash.get(state, prop).indexOf(value), 1);
    }
  };

  function appendMutation(obj) {
    lodash.merge(obj.mutations, mutations);
    if (obj.modules) {
      lodash.forEach(obj.modules, function (module) { return appendMutation(module); });
    }
  }
  var store = require('~/store');
  appendMutation(store);
}

// 2. store를 service 객체 처럼 변환
function Store(name) {
  var this$1 = this;

  var service = { m: {} };
  // getters
  // console.log(this.$store.getters)
  var getters = this.$store ? this.$store.getters : this.getters;
  var keys = Object.keys(getters);
  var regex = new RegExp('^' + name + '/');
  lodash.chain(keys)
    .filter(function (key) { return regex.test(key); })
    .map(function (key) {
      var property = key.replace(regex, '').split('/').join('.');
      lodash.set(service, property, getters[key]);
    })
    .value();

  // actions
  var actions = this.$store ? this.$store._actions : this._actions;
  keys = Object.keys(actions);
  lodash.chain(keys)
    .filter(function (key) { return regex.test(key); })
    .map(function (key) {
      var property = key.replace(regex, '').split('/').join('.');
      var isExist = lodash.get(service, property);
      if (isExist) { throw new Error('duplicate key') }
      var self = this$1.$store ? this$1.$store : this$1;
      lodash.set(service, property, function (payload, patch) {
        patch && (payload.__patch = patch);
        self.dispatch(key, payload);
      });
    })
    .value();

  // mutations
  var mutations = this.$store ? this.$store._mutations : this._mutations;
  keys = Object.keys(mutations);
  lodash.chain(keys)
    .filter(function (key) { return regex.test(key); })
    .map(function (key) {
      var property = key.replace(regex, '').split('/').join('.');
      var self = this$1.$store ? this$1.$store : this$1;
      lodash.set(service.m, property, function (prop, payload) {
        var data = {};
        if (lodash.isString(prop) && !lodash.isUndefined(payload)) {
          // string any
          data.prop = prop;
          data.value = payload;
        } else if (!payload) {
          // any
          data = prop;
        } else if (lodash.isObject(prop) && lodash.isObject(payload)) {
          // obj obj
          data.value = prop;
          data.patch = payload;
        } else {
          throw new Error('Incorrect arguements.')
        }

        // console.log(property, prop, payload, data)
        self.commit(key, data);
      });
    })
    .value();

  // console.log(service)
  return service
}

/*  */
function plugin (Vue, options) {
  if ( options === void 0 ) options = {};

  var storeDir = options.store || './store';
  var flgMutation = options.mutation || true;

  flgMutation && addMutation(storeDir);
  Vue.prototype.$$store = Store;
}

plugin.version = '0.1.0';

if (typeof window !== 'undefined' && window.Vue) {
  window.Vue.use(plugin);
}

return plugin;

})));
