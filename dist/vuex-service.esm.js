/*!
 * vuex-service v0.1.0 
 * (c) 2017 james kim
 * Released under the MIT License.
 */
import { chain, forEach, get, isObject, isString, isUndefined, merge, set } from 'lodash';

// 1. 기본 mutation를 각 store 파일에 추가
function addMutation(storeDir) {
  var mutations = {
    set: function set$1(state, ref) {
      var prop = ref.prop;
      var value = ref.value;

      set(state, prop, value);
    },
    add: function add(state, ref) {
      var prop = ref.prop;
      var value = ref.value;

      get(state, prop).push(value);
    },
    update: function update(state, ref) {
      var value = ref.value;
      var patch = ref.patch;

      merge(value, patch);
      delete value.__patch;
    },
    remove: function remove(state, ref) {
      var prop = ref.prop;
      var value = ref.value;

      get(state, prop).splice(get(state, prop).indexOf(value), 1);
    }
  };

  function appendMutation(obj) {
    merge(obj.mutations, mutations);
    if (obj.modules) {
      forEach(obj.modules, function (module) { return appendMutation(module); });
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
  chain(keys)
    .filter(function (key) { return regex.test(key); })
    .map(function (key) {
      var property = key.replace(regex, '').split('/').join('.');
      set(service, property, getters[key]);
    })
    .value();

  // actions
  var actions = this.$store ? this.$store._actions : this._actions;
  keys = Object.keys(actions);
  chain(keys)
    .filter(function (key) { return regex.test(key); })
    .map(function (key) {
      var property = key.replace(regex, '').split('/').join('.');
      var isExist = get(service, property);
      if (isExist) { throw new Error('duplicate key') }
      var self = this$1.$store ? this$1.$store : this$1;
      set(service, property, function (payload, patch) {
        patch && (payload.__patch = patch);
        self.dispatch(key, payload);
      });
    })
    .value();

  // mutations
  var mutations = this.$store ? this.$store._mutations : this._mutations;
  keys = Object.keys(mutations);
  chain(keys)
    .filter(function (key) { return regex.test(key); })
    .map(function (key) {
      var property = key.replace(regex, '').split('/').join('.');
      var self = this$1.$store ? this$1.$store : this$1;
      set(service.m, property, function (prop, payload) {
        var data = {};
        if (isString(prop) && !isUndefined(payload)) {
          // string any
          data.prop = prop;
          data.value = payload;
        } else if (!payload) {
          // any
          data = prop;
        } else if (isObject(prop) && isObject(payload)) {
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

export default plugin;
