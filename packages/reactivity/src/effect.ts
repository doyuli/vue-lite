import { Link, Subscriber, startTracking, endTracking } from "./system";

class ReactiveEffect {

  // 依赖项链表头节点
  deps: Link | undefined

  // 依赖项链表尾节点
  depsTail: Link | undefined

  // 正在追踪依赖
  tracking = false

  // 标记当前 effect 是否已经被 dep 收集
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
