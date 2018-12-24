try {
  module.exports = PromiseMy
} catch (e) {}

// Promise构造函数接收一个executor函数，executor函数执行完同步或异步操作后，调用它的两个参数resolve和reject
function PromiseMy(executor) {
  var self = this

  self.status = 'pending' //Promise当前的状态
  self.onResolvedCallback = [] // Promise resolve时的回调函数集，因为在Promise结束之前有可能有多个回调添加到它上面
  self.onRejectedCallback = [] // Promise reject时的回调函数集，因为在Promise结束之前有可能有多个回调添加到它上面

  function resolve(value) {
    if (value instanceof PromiseMy) {
      return value.then(resolve, reject)
    }
    setTimeout(function () {
      if (self.status === 'pending') {
        self.status = 'resolved'
        self.data = value
        for (var i = 0; i < self.onRejectedCallback; i++) {
          self.onRejectedCallback[i](value)
        }
      }
    })
  }

  function reject(reason) {
    setTimeout(function () {
      if (self.status === 'pending') {
        self.status = 'rejected'
        self.data = reason
        for (var i = 0; i < self.onRejectedCallback.length; i++) {
          self.onRejectedCallback[i](reason)
        }
      }
    })
  }

  try {
    executor(resolve, reject)
  } catch(e) {
    reject(e)
  }
}

/*
resolvePromise函数即为根据x的值来决定promise2的状态的函数
也即标准中的[Promise Resolution Procedure](https://promisesaplus.com/#point-47)
x为`promise2 = promise1.then(onResolved, onRejected)`里`onResolved/onRejected`的返回值
`resolve`和`reject`实际上是`promise2`的`executor`的两个实参，因为很难挂在其它的地方，所以一并传进来。
相信各位一定可以对照标准把标准转换成代码，这里就只标出代码在标准中对应的位置，只在必要的地方做一些解释
*/
function resolvePromise(promise2, x, resolve, reject) {
  var then
  var thenCallOrThrow = false

  if (promise2 === x) {
    return reject(new TypeError('Channing cycle detected for promise!'))
  }

  if (x instanceof PromiseMy) {
    if (x.status === 'pending') {
      x.then(function (value) {
        resolvePromise(promise2, value, resolve, reject)
      }, reject)
    } else {
      x.then(resolve, reject)
    }
    return
  }

  if ((x !== null) && ((typeof x === 'object') || (typeof x === 'function'))) {
    try {
      then = x.then
      if (typeof then === 'function') {
        then.call(x, function rs(y) {
          if (thenCallOrThrow) return
          thenCallOrThrow = true
          return resolvePromise(promise2, y, resolve, reject)
        }, function rj(r) {
          if (thenCallOrThrow) return
          thenCallOrThrow = true
          return reject(r)
        })
      } else {
        resolve(x)
      }
    } catch (e) {
      if (thenCallOrThrow) return
      thenCallOrThrow = true
      return reject(e)
    }
  } else {
    resolve(x)
  }
}

PromiseMy.prototype.then = function(onResolved, onRejected) {
  var self = this
  var promise2

  onResolved = typeof onResolved === 'function' ? onResolved : function(value) {return value}
  onRejected = typeof onRejected === 'function' ? onRejected : function(reason) {return reason}

  if (self.status === 'resolved') {
    return promise2 = new PromiseMy(function(resolve, reject) {
      setTimeout(function () {
        try {
          var x = onResolved(self.data)
          resolvePromise(promise2, x, resolve, reject)
        } catch (reason) {
          reject(reason)
        }
      })
    })
  }

  if (self.status === 'rejected') {
    return promise2 = new PromiseMy(function(resolve, reject) {
      setTimeout(function () {
        try {
          var x = onRejected(self.data)
          resolvePromise(promise2, x, resolve, reject)
        } catch (reason) {
          reject(reason)
        }
      })
    })
  }

  if (self.status === 'pending') {
    // 这里之所以没有异步执行，是因为这些函数必然会被resolve或reject调用，而resolve或reject函数里的内容已是异步执行，构造函数里的定义
    return promise2 = new PromiseMy(function(resolve, reject) {
      self.onResolvedCallback.push(function(value) {
        try {
          var x = onResolved(self.data)
          resolvePromise(promise2, x, resolve, reject)
        } catch (r) {
          reject(r)
        }
      })

      self.onRejectedCallback.push(function (reason) {
        try {
          var x = onRejected(self.data)
          resolvePromise(promise2, x, resolve, reject)
        } catch (r) {
          reject(r)
        }
      })
    })
  }
}

PromiseMy.prototype.catch = function(onRejected) {
  return this.then(null, onRejected)
}

PromiseMy.deferred = PromiseMy.defer = function () {
  var dfd = {}
  dfd.promise = new PromiseMy(function (resolve, reject) {
    dfd.resolve = resolve
    dfd.reject = reject
  })
  return dfd
}
