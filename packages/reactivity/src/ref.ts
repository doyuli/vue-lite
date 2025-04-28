import { activeSub } from './effect'
import { type Link, link, propagate } from './system'

enum ReactiveFlags {
  IS_REF = '__v_isRef', // 只读属性，表示是否是响应式对象
}

export class RefImpl {
  _value: any;

  [ReactiveFlags.IS_REF] = true

  // 订阅者链表的头部
  subs: Link

  // 订阅者链表的尾部
  subsTail: Link

  constructor(value: unknown) {
    this._value = value
  }

  get value() {
    trackRef(this)
    return this._value
  }

  set value(val) {
    this._value = val
    triggerRef(this)
  }
}

export function ref(value) {
  return new RefImpl(value)
}

export function isRef(value: unknown) {
  return !!(value && value[ReactiveFlags.IS_REF])
}

/**
 * 依赖收集 建立链表关系
 */
export function trackRef(dep: RefImpl) {
  if (activeSub) {
    link(dep, activeSub)
  }
}

/**
 * 触发更新
 */
export function triggerRef(dep: RefImpl) {
  if (dep.subs) {
    propagate(dep.subs)
  }
}
