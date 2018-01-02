# Getting Started

> vuex를 angular service 처럼 사용하게 하기


### vuex store
nuxt example
store 정의시 actions에서 사용 가능
```js
// ~/store/Todo.js
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
  filter (state, {prop, value}) {
    get(state, prop).forEach(todo => {
      todo.completed = value
    })
  }
}

export const actions = {
  add ({ commit }, todo) {
    const Todo = this.$$store('Todo')
    Todo.m.add('todos', todo)
  }
}
```

### JavaScript

```javascript
// If using a module system (e.g. via vue-cli), import Vue and VuexService and then call Vue.use(VuexService).
// import Vue from 'vue'
// import VuexService from 'vuex-service'
//
// Vue.use(VuexService)

// TODO: here the example

// Now the app has started!
new Vue({ }).$mount('#app')
```

Output the following:

```html
<div id="#app">
  <!-- TODO: here the outputs -->
</div>
```
