export let activeSub: any = null

class ReactiveEffect {
  constructor(public fn: Function) {
    this.fn = fn
  }

  run() {
    // 保存上一次执行的 effect，处理嵌套逻辑
    const prevSub = activeSub

    activeSub = this
    try {
      return this.fn()
    } finally {
      activeSub = prevSub
    }
  }
}

export function effect(fn: any) {
  const e = new ReactiveEffect(fn)
  e.run()

  const runner = e.run.bind(e)
  runner.effect = e // 将 effect 实例挂载到 runner 上，方便后续使用

  return runner
}
