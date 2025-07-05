import type { Dependency, Link, Subscriber } from './system'
import { hasChanged, isFunction } from '@vue/shared'
import { activeSub, setActiveSub } from './effect'
import { ReactiveFlags } from './ref'
import { endTracking, link, startTracking } from './system'

/**
 * implements 关键字用来约束类的实现
 */
export class ComputedRefImpl implements Dependency, Subscriber {
  _value: any
  // 作为 Dependency
  subs: Link | undefined
  subsTail: Link | undefined
  tracking = false
  // 作为 Subscriber
  deps: Link | undefined
  depsTail: Link | undefined

  [ReactiveFlags.IS_REF] = true

  // 缓存的值是否过期（脏值）
  // 在 get 里，只有值脏了，才需要去调用 update 更新
  dirty = true

  constructor(public fn: Function, private setter?: Function) { }

  get value() {
    if (this.dirty) {
      this.update()
    }
    // 和 sub 建立关联关系
    if (activeSub) {
      link(this, activeSub)
    }
    return this._value
  }

  set value(newValue) {
    if (this.setter) {
      this.setter(newValue)
    }
    else {
      // 只读
      console.warn('Write operation failed: computed value is readonly')
    }
  }

  /**
   * 实现 sub 功能
   */
  update() {
    const prevSub = activeSub

    setActiveSub(this)
    startTracking(this)
    try {
      const oldValue = this._value
      this._value = this.fn()
      // 派发更新时判断是否需要通知 subs 重新执行
      return hasChanged(this._value, oldValue)
    }
    finally {
      setActiveSub(prevSub)
      endTracking(this)
    }
  }
}

export function computed(getterOrOptions: any) {
  let getter: any
  let setter: any
  if (isFunction(getterOrOptions)) {
    getter = getterOrOptions
  }
  else {
    /**
     * const c = computed({
     *  get(){ ... }
     *  set(){ ... }
     * })
     */
    getter = getterOrOptions.get
    setter = getterOrOptions.set
  }
  return new ComputedRefImpl(getter, setter)
}
