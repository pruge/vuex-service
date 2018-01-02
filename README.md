# vuex-service

[![Coverage Status](https://coveralls.io/repos/github/prugel/vuex-service/badge.svg?branch=dev)](https://coveralls.io/github/prugel/vuex-service?branch=dev)

[![npm](https://img.shields.io/npm/v/vuex-service.svg)](https://www.npmjs.com/package/vuex-service)
[![vue2](https://img.shields.io/badge/vue-2.x-brightgreen.svg)](https://vuejs.org/)

Use vuex like angular service
```js
const Todo = this.$$store('Todo')
Todo.todos
Todo.all
Todo.actives
Todo.completed
Todo.update()
```



<!-- ## :book: Documentation -->
<!-- See [here](http://prugel.github.io/vuex-service/) -->
## Getting Started

### NPM

    $ npm install vuex-service

### Yarn

    $ yarn add vuex-service

When used with a module system, you must explicitly install the `vuex-service` via `Vue.use()`:

```javascript
import Vue from 'vue'
import VuexService from 'vuex-service'
import * as store from '~/store'

Vue.use(vuexService, {store: store, mutation: true})
```

## options
1. store: Vuex Store instance
1. mutation: if true, add mutations 'add, remove, udpate, set', default: fase

## how to use

### store actions
```js
// ~/store/Todo.js
export const state = () => ({
  todos: [],
  hello: {
    world: '123'
  }
})

export const mutations = {
  ADD_TODO (state, todo) {
    state.todos.push(todo)
  },
  UPDATE_TODO (state, data) {
    _.merge(data.src, data.value)
  }
}

export const getters = {
  all (state) {
    return state.todos
  },
  actives (state) {
    return state.todos.filter(todo => !todo.completed)
  },
  completed (state) {
    return state.todos.filter(todo => todo.completed)
  }
}

export const actions = {
  add ({ commit }, todo) {
    const Todo = this.$$store('Todo')
    // commit('ADD_TODO', todo)
    Todo.m.add('todos', todo)
  },
  update ({ commit }, data) {
    const Todo = this.$$store('Todo')
    // commit('UPDATE_TODO', data)
    Todo.m.update(data.src, data.value)
  }
}
```

### vue component
```js
export default {
  computed: {
    todos () {
      const Todo = this.$$store('Todo')
      const filter = this.$route.params.slug || 'all'
      // this.$store.getters['Todo/' + filter]
      return Todo[filter]
    }
  },
  methods: {
    doneCheck (todo, e) {
      const Todo = this.$$store('Todo')
      const data = {src: todo, value: {completed: e.target.checked}}
      Todo.update(data) // this.dispatch('Todo/update', data)
      // or
      Todo.update(todo, {completed: e.target.checked}) // this.dispatch('Todo/update', {src: todo, value: {completed: e.target.checked})
      // or
      Todo.m.update(todo, { completed: e.target.checked })
    },
  }
}
```

### vuex store instance
```js
// ~/store/Locale.js
export const state = () => ({
  locales: ['en', 'kr'],
  locale: 'en'
})

// ~/middleware/i18n.js
import { Store } from 'vue-service'
export default function ({ isHMR, app, store, route, params, error, redirect }) {
  const Locale = Store('Locale', store)
  console.log(Locale.locales, Locale.locale)
  ...
}
```

### default mutations - set, add, remove, update
```js
// ~/store/Todo.js
export const state = () => ({
  todos: [],
  hello: {
    world: '123',
    heart: []
  }
})
```
1. set (prop, value)
```js
const Todo = this.$$store('Todo')
// Todo.m.set(prop, value)
Todo.m.set('todos', [{title: 'todo', completed: false}])
Todo.m.set('hello.world', 'abc') // abc
Todo.m.set('hello.heart', ['two', 'three']) // [two, three]
```
2. add (prop, value)
```js
const Todo = this.$$store('Todo')
// Todo.m.add(prop, value)
Todo.m.add('todos', {title: 'todo', completed: false})
Todo.m.add('hello.heart', 'one') // [one]
Todo.m.add('hello.heart', ...['two', 'three']) // [one, two, three]
```
3. remove (prop, value)
```js
const Todo = this.$$store('Todo')
// Todo.m.remove(prop, value)
Todo.m.add('todos', {title: 'todo', completed: false})
const todo = Todo.todos[0]
Todo.m.remove('todos', todo) // []
```
4. update (src, value)
```js
const Todo = this.$$store('Todo')
// Todo.m.update(src, value)
// if src is string, call m.set(prop, value)
Todo.m.update('todos', {title: 'todo', completed: false})
Todo.m.update('hello.heart', 'one') // [one]
Todo.m.update('hello.heart', ['two', 'three'])  // [two, three]
// or
Todo.add('todos', {title: 'hi', completed: false})
const todo = Todo.todos[0]
Todo.m.update(todo, {title: 'hello world'}) // 'hi' --> 'hello world'
```

### When you call custom action/mutations
- If two parameters
- Todo.update(arg1, arg2) === this.$store.dispatch('Todo/update', {src: arg1, prop: arg1, value: arg2})
- Todo.m.update(arg1, arg2) === this.$store.commit('Todo/update', {src: arg1, prop: arg1, value: arg2})
```js
// ~/store/Todo.js
export const state = () => ({
  todos: [],
  hello: {
    world: '123',
    heart: []
  }
})

export const actions = {
  update ({ commit }, data) {
    const Todo = this.$$store('Todo')
    // commit('UPDATE_TODO', data)
    Todo.m.update(data.src, data.value)
  }
}
```
```js
// ~/components/list.vue
export default {
  methods {
    doneCheck (todo, e) {
      const Todo = this.$$store('Todo')
      const data = {src: todo, value: {completed: e.target.checked}}
      Todo.update(data) // this.dispatch('Todo/update', data)
      // or
      Todo.update(todo, {completed: e.target.checked}) // this.dispatch('Todo/update', {src: todo, value: {completed: e.target.checked})
    }
  }
}
```

### module
```js
// ~/store   : nuxt
store
  ├── Todo
  │    └── comments.js
  ├─ Todo.js
  └─ index.js

const Todo = this.$$store('Todo')
const Comments = this.$$store('Todo/comments')
```


## :scroll: Changelog
Details changes for each release are documented in the [CHANGELOG.md](https://github.com/prugel/vuex-service/blob/dev/CHANGELOG.md).


## :exclamation: Issues
Please make sure to read the [Issue Reporting Checklist](https://github.com/prugel/vuex-service/blob/dev/CONTRIBUTING.md#issue-reporting-guidelines) before opening an issue. Issues not conforming to the guidelines may be closed immediately.


## :muscle: Contribution
Please make sure to read the [Contributing Guide](https://github.com/prugel/vuex-service/blob/dev/CONTRIBUTING.md) before making a pull request.

## :copyright: License

[MIT](http://opensource.org/licenses/MIT)
