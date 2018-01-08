// modified https://github.com/bnoguchi/hooks-js
import _ from 'lodash'

// TODO Add in pre and post skipping options
let _pres = {}
let _posts = {}
let _hooks = {}
class HooK {
  getHook(namespace, name, fn) {
    var hook = _hooks[namespace]
    return (hook && hook[name]) || fn
  }
  /**
   *  Declares a new hook to which you can add pres and posts
   *  @param {String} name of the function
   *  @param {Function} the method
   *  @param {Function} the error handler callback
   */
  hook(namespace, name, fn, errorCb) {
    if (arguments.length === 2 && typeof name === 'object') {
      for (var k in name) {
        // `name` is a hash of hookName->hookFn
        this.hook(namespace, k, name[k])
      }
      return
    }
    var proto = (_hooks[namespace] = _hooks[namespace] || {}),
      $pres = (_pres[namespace] = _pres[namespace] || {}),
      $posts = (_posts[namespace] = _posts[namespace] || {})
    $pres[name] = $pres[name] || []
    $posts[name] = $posts[name] || []

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
            preArgs
          if (_args.length && !(arguments[0] == null && typeof lastArg === 'function'))
            hookArgs = _args
          if (++_current < _total) {
            currPre = pres[_current]
            if (currPre.isAsync && currPre.length < 2)
              throw new Error(
                'Your pre must have next and done arguments -- e.g., function (next, done, ...)'
              )
            if (currPre.length < 1)
              throw new Error('Your pre must have a next argument -- e.g., function (next, ...)')
            preArgs = (currPre.isAsync ? [once(_next), once(_asyncsDone)] : [once(_next)]).concat(
              hookArgs
            )
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
            postArgs

          if (_current === _total) {
            next_ = function() {
              if (arguments[0] instanceof Error) {
                return handleError(arguments[0])
              }
              var args_ = Array.prototype.slice.call(arguments, 1),
                currPost,
                postArgs
              if (args_.length) hookArgs = args_
              if (++current_ < total_) {
                currPost = posts[current_]
                if (currPost.length < 1)
                  throw new Error(
                    'Your post must have a next argument -- e.g., function (next, ...)'
                  )
                postArgs = [once(next_)].concat(hookArgs)
                return currPost.apply(self, postArgs)
              } else if (typeof lastArg === 'function') {
                // All post handlers are done, call original callback function
                return lastArg.apply(self, arguments)
              }
            }

            // We are assuming that if the last argument provided to the wrapped function is a function, it was expecting
            // a callback.  We trap that callback and wait to call it until all post handlers have finished.
            if (typeof lastArg === 'function') {
              args_[args_.length - 1] = once(next_)
            }

            total_ = posts.length
            current_ = -1
            ret = fn.apply(self, args_) // Execute wrapped function, post handlers come afterward

            if (total_ && typeof lastArg !== 'function') return next_() // no callback provided, execute next_() manually
            return ret
          }
        }
      if (_asyncsLeft) {
        function _asyncsDone(err) {
          if (err && err instanceof Error) {
            return handleError(err)
          }
          --_asyncsLeft || _done.apply(self, hookArgs)
        }
      }
      function handleError(err) {
        if ('function' == typeof lastArg) return lastArg(err)
        if (errorCb) return errorCb.call(self, err)
        throw err
      }
      return _next.apply(this, arguments)
    }

    proto[name].numAsyncPres = 0

    return proto[name]
  }

  pre(namespace, name, isAsync, fn, errorCb) {
    if ('boolean' !== typeof arguments[2]) {
      errorCb = fn
      fn = isAsync
      isAsync = false
    }
    var proto = (_hooks[namespace] = _hooks[namespace] || {}),
      pres = (_pres[namespace] = _pres[namespace] || {})

    // var proto = this.prototype || this,
    //   pres = (_pres = _pres || {})

    this._lazySetupHooks(namespace, proto, name, errorCb)

    if ((fn.isAsync = isAsync)) {
      proto[name].numAsyncPres++
    }

    ;(pres[name] = pres[name] || []).push(fn)
    return this
  }

  post(namespace, name, isAsync, fn) {
    if (arguments.length === 3) {
      fn = isAsync
      isAsync = false
    }
    var proto = (_hooks[namespace] = _hooks[namespace] || {}),
      posts = (_posts[namespace] = _posts[namespace] || {})

    this._lazySetupHooks(namespace, proto, name)
    ;(posts[name] = posts[name] || []).push(fn)
    return this
  }

  removePre(namespace, name, fnToRemove) {
    var proto = (_hooks[namespace] = _hooks[namespace] || {}),
      pres = (_pres[namespace] = _pres[namespace] || {})
    // var proto = this.prototype || this,
    //   pres = _pres || (_pres || {})
    if (!pres[name]) return this
    if (arguments.length === 2) {
      // Remove all pre callbacks for hook `name`
      pres[name].length = 0
    } else {
      pres[name] = pres[name].filter(function(currFn) {
        return currFn !== fnToRemove
      })
    }
    return this
  }

  _lazySetupHooks(namespace, proto, methodName, errorCb) {
    if (!proto[methodName]) {
      throw new Error(`The hook is not set. ${namespace}.${methodName}`)
    }
    if ('undefined' === typeof proto[methodName].numAsyncPres) {
      this.hook(methodName, proto[methodName], errorCb)
    }
  }
}

function once(fn, scope) {
  return function fnWrapper() {
    if (fnWrapper.hookCalled) return
    fnWrapper.hookCalled = true
    return fn.apply(scope, arguments)
  }
}

function props(obj) {
  return _.without(Object.getOwnPropertyNames(Object.getPrototypeOf(obj)), 'constructor')
}
const hooks = new HooK()
_.bindAll(hooks, props(hooks))
export default hooks
