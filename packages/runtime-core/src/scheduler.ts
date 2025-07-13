const resolvePromise = Promise.resolve()

/**
 * 为什么能实现异步更新？
 * 在 system 的 propagate 中
 * 只有 sub.dirty = false，才会去通知副作用函数重新执行
 * 当第一次进来时，会把 sub.dirty 设置成 true
 *
 * effect.run 准备执行完后，在 endTracking 中会重新把 dirty 设置成 false
 *
 * 这里的 job 函数就等于 effect.run.bind(effect)
 * 由于是异步调用的，会在所有同步代码执行完毕后，dirty 才会被设置成 false
 *
 * 所以同一个 effect，有多次更新时只会触发第一次，其余更新会在 propagate 中被拦截
 * 由于 update 是异步执行的，所以执行 update 时获取到的数据是最新的
 * @param job
 */
export function queueJob(job: Function) {
  // 把渲染函数放到异步队列执行
  resolvePromise.then(() => {
    /**
     * 等于 effect.run.bind(effect)
     * 执行完毕后，才会把 sub.dirty 设置成 false
     */
    job()
  })
}

export function nextTick(fn: Function) {
  // call(this) 是为了在调用 nextTick 时保持正确的 this 指向
  resolvePromise.then(() => fn.call(this))
}
