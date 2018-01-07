# vuex-service

[![Coverage Status](https://coveralls.io/repos/github/pruge/vuex-service/badge.svg?branch=dev)](https://coveralls.io/github/pruge/vuex-service?branch=dev)

[![npm](https://img.shields.io/npm/v/vuex-service.svg)](https://www.npmjs.com/package/vuex-service)
[![vue2](https://img.shields.io/badge/vue-2.x-brightgreen.svg)](https://vuejs.org/)

Use vuex like angular service
```js
const Root = this.$$store()
const Todo = this.$$store('Todo')
const {Member, Todo} = this.$$store('Todo, Member')
// import { Store } from 'vuex-service'
// const Todo = Store('Todo', store) // store is vuex store isntance
Todo.todos // state
Todo.all // getters
Todo.actives
Todo.completed
Todo.update() // actions
Todo.m.update() // mutations
Todo.$on('hello.*', fn)
Todo.$emit('hello.world', data)
Todo.$once('hello.world', fn)
Todo.$broadcast('hello.world', data)
Todo.$off('hello.world', fn)
Todo.$off('hello.world') // remove all
```

## :exclamation:
```js
// this.$store.dispatch('Todo/update', arg1)
Todo.update(arg1)
update({ commit }, name) {
  console.log(name)
}
// this.$store.dispatch('Todo/update', [ arg1, arg2, ... ])
Todo.update(arg1, arg2, ...)
update({ commit }, [ name, name2, ... ]) {
  console.log(name, name2, ...)
}
```


<!-- ## :book: Documentation -->
<!-- See [here](http://pruge.github.io/vuex-service/) -->
## Getting Started

### NPM

    $ npm install vuex-service

### Yarn

    $ yarn add vuex-service

When used with a module system, you must explicitly install the `vuex-service` via `Vue.use()`:

```javascript
// ~/plugins/vuex-service.js
import Vue from 'vue'
import vuexService, { Store } from 'vuex-service'

Vue.use(vuexService)

// nuxt
export default ({ app }, inject) => {
  inject('$store', Store)
}
```

## how to use

### store actions
```js
// ~/store/Todo.js
import { defaultMutations } from 'vuex-service'

export const state = () => ({
  todos: [],
  hello: {
    world: '123'
  }
})

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

export const mutations = {
  ...defaultMutations // set, add, update, remove
}

export const actions = {
  add ({ commit }, todo) {
    const Todo = this.$$store('Todo')
    // commit('Todo/add', [ 'todos', todo ])
    Todo.m.add('todos', todo)
  },
  update ({ commit }, [ todo, patch ]) {
    const Todo = this.$$store('Todo')
    // commit('Todo/update', [ todo, patch ])
    Todo.m.update(todo, patch)
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
      const data = [ todo, {completed: e.target.checked} ]
      // this.dispatch('Todo/update', data)
      Todo.update(data)
      // or
      // this.dispatch('Todo/update', [ todo, {completed: e.target.checked} ])
      Todo.update(todo, {completed: e.target.checked})
      // or
      Todo.m.update(todo, { completed: e.target.checked })
    },
  }
}
```

### vuex store instance
```js
// ~/store/Locale.js
import { defaultMutations } from 'vuex-service'

export const state = () => ({
  locales: ['en', 'kr'],
  locale: 'en'
})
export const mutations = {
  ...defaultMutations // set, add, update, remove
}

// ~/middleware/i18n.js
import { Store } from 'vuex-service'
export default function ({ isHMR, app, store, route, params, error, redirect }) {
  const Locale = Store('Locale', store)
  console.log(Locale.locales, Locale.locale)
  ...
}
```

### default mutations - set, add, remove, update
```js
// ~/store/Todo.js
import { defaultMutations } from 'vuex-service'

export const state = () => ({
  todos: [],
  hello: {
    world: '123',
    heart: []
  }
})
export const mutations = {
  ...defaultMutations // set, add, update, remove
}
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
4. update (src, patch)
```js
const Todo = this.$$store('Todo')
// Todo.m.update(src, patch)
// if src is string, call m.set(prop, value)
Todo.m.update('todos', {title: 'todo', completed: false})
Todo.m.update('hello.heart', 'one') // [one]
Todo.m.update('hello.heart', ['two', 'three'])  // [two, three]
// or
Todo.m.add('todos', {title: 'hi', completed: false})
const todo = Todo.todos[0]
Todo.m.update(todo, {title: 'hello world'}) // 'hi' --> 'hello world'
```

### When you call custom action/mutations
```js
// If two parameters and more
// deprecated
// Todo.update(arg1, arg2) === this.$store.dispatch('Todo/update', {src: arg1, prop: arg1, value: arg2})
// Todo.m.update(arg1, arg2) === this.$store.commit('Todo/update', {src: arg1, prop: arg1, value: arg2})

// changed
// this.$store.dispatch('Todo/update', arg1)
Todo.update(arg1)
update({ commit }, name) {
  console.log(name)
}
// this.$store.dispatch('Todo/update', [ arg1, arg2, ... ])
Todo.update(arg1, arg2, ...)
update({ commit }, [ name, name2, ... ]) {
  console.log(name, name2, ...)
}
```
```js
// ~/store/Todo.js
import { defaultMutations } from 'vuex-service'

export const state = () => ({
  todos: [],
  hello: {
    world: '123',
    heart: []
  }
})
export const mutations = {
  ...defaultMutations // set, add, update, remove
}
export const actions = {
  update ({ commit }, [ todo, patch ]) {
    const Todo = this.$$store('Todo')
    // commit('Todo/update', [ todo, patch ])
    Todo.m.update(todo, patch)
  }
}
```
```js
// ~/components/list.vue
export default {
  methods {
    doneCheck (todo, e) {
      const Todo = this.$$store('Todo')
      const data = [ todo, {completed: e.target.checked} ]
      Todo.update(data) // this.dispatch('Todo/update', data)
      // or
      Todo.update(todo, {completed: e.target.checked}) // this.dispatch('Todo/update', [ todo, {completed: e.target.checked} ])
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

const Root = this.$$store()
const Todo = this.$$store('Todo')
const comments = this.$$store('Todo/comments')
const { Root, Todo } = this.$$store(' , Todo')
const { Todo, comments } = this.$$store('Todo, Todo/comments')
```

### eventbus
```js
const { Todo, Member } = this.$$store('Todo, Member')

Todo.$on('hello', message => console.log('Todo: ' + message))
Member.$on('hello', message => console.log('Member: ' + message))

Todo.$emit('hello', 'hi')
// Todo: hi

Member.$emit('hello', 'hi')
// Member: hi

Todo.$broadcast('hello', 'hi')
// Todo: hi
// Member: hi

Todo.$on('hello.*', message => console.log('Todo * : ' + message))
Todo.$emit('hello.world', 'hi')
// Todo * : hi
```

### eventbus auto unregister
Alternatively, you can pass a vue scope as the first parameter to on() or once() and the listener will be automatically unregistered if the vue scope is destroyed.
```js
// Passing this will register a this.$on('hook:beforeDestroy) event for you.
// ~/components/todoList.vue
Todo.$on(this, 'hello', fn)
Todo.$once(this, 'hello', fn)
```


## :scroll: Changelog

### v0.2.0

+ Change arguments of two or more function arguments

### v0.1.14

+ return propmise mutation/action

### v0.1.5

+ support event bus

### v0.1.0

+ support vuex like service

## :exclamation: Issues
Please make sure to read the [Issue Reporting Checklist](https://github.com/pruge/vuex-service/blob/dev/CONTRIBUTING.md#issue-reporting-guidelines) before opening an issue. Issues not conforming to the guidelines may be closed immediately.


## :muscle: Contribution
Please make sure to read the [Contributing Guide](https://github.com/pruge/vuex-service/blob/dev/CONTRIBUTING.md) before making a pull request.

## :copyright: License

[MIT](http://opensource.org/licenses/MIT)
