# Installation

### Direct Download / CDN

https://unpkg.com/vuex-service/dist/vuex-service

[unpkg.com](https://unpkg.com) provides NPM-based CDN links. The above link will always point to the latest release on NPM. You can also use a specific version/tag via URLs like https://unpkg.com/vuex-service@0.1.0/dist/vuex-service.js
 
Include vuex-service after Vue and it will install itself automatically:

```html
<script src="https://unpkg.com/vue/dist/vue.js"></script>
<script src="https://unpkg.com/vuex-service/dist/vuex-service.js"></script>
```

### NPM

    $ npm install vuex-service

### Yarn

    $ yarn add vuex-service

When used with a module system, you must explicitly install the `vuex-service` via `Vue.use()`:

```javascript
import Vue from 'vue'
import VuexService from 'vuex-service'

Vue.use(VuexService)
```

You don't need to do this when using global script tags.

### Dev Build

You will have to clone directly from GitHub and build `vuex-service` yourself if
you want to use the latest dev build.

    $ git clone https://github.com/prugel/vuex-service.git node_modules/vuex-service
    $ cd node_modules/vuex-service
    $ npm install
    $ npm run build
