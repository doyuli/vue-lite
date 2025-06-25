import { Link, startTracking, endTracking } from "./system";

export let activeSub: any = null

class ReactiveEffect {

  // 依赖项链表头节点
  deps: Link | undefined

  // 依赖项链表尾节点
  depsTail: Link | undefined

  constructor(public fn: Function) { }

  run() {
    // 保存上一次执行的 effect，处理嵌套逻辑
    const prevSub = activeSub

    activeSub = this
    startTracking(this)
    try {
      return this.fn()
    } finally {
      activeSub = prevSub
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
