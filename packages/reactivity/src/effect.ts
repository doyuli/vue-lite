import { Link, Subscriber, startTracking, endTracking } from "./system";

class ReactiveEffect {

  // 依赖项链表头节点
  deps: Link | undefined

  // 依赖项链表尾节点
  depsTail: Link | undefined

  // 正在追踪依赖
  tracking = false

  /**
   * 标记当前 effect 是否已经被触发更新，
   * 解决 effect 中多次访问同一个 ref 时，会被多次收集，导致多次触发，
   * 在 propagate 中通过 dirty 判断是否还要通知 effect 执行 
   * 
   * 注意：这里是空间换时间的做法，
   * 在源码中是在 link 函数中，递归遍历 dep.subs，看看link 中的 sub 是否等于当前 sub，
   * 等于的话就不收集了，属于时间换空间的做法
   */
  dirty = false

  constructor(public fn: Function) { }

  run() {
    // 保存上一次执行的 effect，处理嵌套逻辑
    const prevSub = activeSub

    setActiveSub(this)
    startTracking(this)
    try {
      return this.fn()
    } finally {
      setActiveSub(prevSub)
      endTracking(this)
    }
  }

  /**
   * 默认调度
   */
  scheduler() {
    this.run()
  }

  /**
   * 通知更新
   */
  notify() {
    this.scheduler()
  }
}

export function effect(fn: any, options?: any) {

  const e = new ReactiveEffect(fn)

  /**
   * 合并 options 
   * 比如：scheduler
   */
  Object.assign(e, options)

  e.run()

  /**
   * 绑定 effect 实例
   */
  const runner = e.run.bind(e)
  runner.effect = e // 将 effect 实例挂载到 runner 上，方便后续使用

  return runner
}

export let activeSub: Subscriber | undefined = undefined

export function setActiveSub(sub: Subscriber | undefined) {
  activeSub = sub
}
