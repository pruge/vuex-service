/*!
 * vuex-service v0.1.0 
 * (c) 2017 james kim
 * Released under the MIT License.
 */
import _ from 'lodash';
import Vuex from 'vuex';

// 1. 기본 mutation를 각 store 파일에 추가
function addMutation(store) {
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
      var value = ref.value;
      var patch = ref.patch;

      _.merge(value, patch);
      delete value.__patch;
    },
    remove: function remove(state, ref) {
      var prop = ref.prop;
      var value = ref.value;

      _.get(state, prop).splice(_.get(state, prop).indexOf(value), 1);
    }
  };

  function appendMutation(obj) {
    _.merge(obj.mutations, mutations);
    if (obj.modules) {
      _.forEach(obj.modules, function (module) { return appendMutation(module); });
    }
  }
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
  _(keys)
    .filter(function (key) { return regex.test(key); })
    .map(function (key) {
      var property = key.replace(regex, '').split('/').join('.');
      _.set(service, property, getters[key]);
    })
    .value();

  // actions
  var actions = this.$store ? this.$store._actions : this._actions;
  keys = Object.keys(actions);
  _(keys)
    .filter(function (key) { return regex.test(key); })
    .map(function (key) {
      var property = key.replace(regex, '').split('/').join('.');
      var isExist = _.get(service, property);
      if (isExist) { throw new Error('duplicate key') }
      var self = this$1.$store ? this$1.$store : this$1;
      _.set(service, property, function (payload, patch) {
        patch && (payload.__patch = patch);
        self.dispatch(key, payload);
      });
    })
    .value();

  // mutations
  var mutations = this.$store ? this.$store._mutations : this._mutations;
  keys = Object.keys(mutations);
  _(keys)
    .filter(function (key) { return regex.test(key); })
    .map(function (key) {
      var property = key.replace(regex, '').split('/').join('.');
      var self = this$1.$store ? this$1.$store : this$1;
      _.set(service.m, property, function (prop, payload) {
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

  var store = options.store;
  var flgMutation = options.mutation || true;

  if (!store) {
    throw new Error('Not defined store')
  }

  flgMutation && addMutation(store);
  // Vue.prototype.$Store = Store
  // Vuex.Store.prototype.$$store = Store
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

export default plugin;
