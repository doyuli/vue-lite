import { Link, Subscriber, startTracking, endTracking } from "./system";

export class ReactiveEffect {

  // 储存追踪的响应式依赖
  deps: Link | undefined
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

  // 当前 effect 是否激活
  active = true

  constructor(public fn: Function) { }

  run() {
    if (!this.active) {
      // 失活状态 直接执行 fn，不走下面的收集依赖流程
      return this.fn()
    }

    // 保存上一次执行的 effect，处理嵌套逻辑
    const prevSub = activeSub

    setActiveSub(this)
    // 开始追踪依赖，处理节点复用
    startTracking(this)
    try {
      return this.fn()
    } finally {

      /**
       * 这里不能直接把 activeSub 设置为 undefined
       * 因为当 effect 嵌套时，内部的 effect 不能正确定位当前活跃的副作用函数
       * 解决方法：这里设置为上一次的 activeSub
       */
      setActiveSub(prevSub)

      /**
      * 结束追踪 清理不必要追踪的依赖
      * const falg = ref(true)
      * const flagTureCount = ref(0)
      * const flagFalseCount = ref(0)
      * 
      * effect(() => {
      *   if(falg.value) {
      *     flagTureCount.value++
      *   } else {
      *     flagFalseCount.value++
      *   }
      * })
      * 
      * falg.vaue = false
      * 这时候 flagTureCount 已经不需要被追踪，要被清理
      */
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

  /**
   * 停止监听
   */
  stop() {
    if (this.active) {
      // 清理所有依赖
      startTracking(this)
      endTracking(this)
      this.active = false
    }
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

  // 把 run 方法 return 出去，绑定 this 指向
  const runner = e.run.bind(e)
  // 挂载 effect 实例
  runner.effect = e

  return runner
}

export let activeSub: Subscriber | undefined = undefined

export function setActiveSub(sub: Subscriber | undefined) {
  activeSub = sub
}
