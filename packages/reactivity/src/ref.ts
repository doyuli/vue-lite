import type { Link } from './system'
import { hasChanged, isObject } from '@vue/shared'
import { activeSub } from './effect'
import { reactive } from './reactive'
import { link, propagate } from './system'

export enum ReactiveFlags {
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
    this._value = isObject(value) ? reactive(value) : value
  }

  get value() {
    trackRef(this)
    return this._value
  }

  set value(newValue) {
    if (hasChanged(newValue, this._value)) {
      this._value = isObject(newValue) ? reactive(newValue) : newValue
      triggerRef(this)
    }
  }
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

export function ref(value: any) {
  return new RefImpl(value)
}

export function isRef(value: unknown) {
  return !!(value && value[ReactiveFlags.IS_REF])
}

export function unref(value: any) {
  return isRef(value) ? value.value : value
}

/**
 * toRef Dependency
 */
class ObjectRefImpl {
  [ReactiveFlags.IS_REF] = true

  constructor(public _object: object, public _key: string) {}

  get value() {
    return this._object[this._key]
  }

  set value(newValue) {
    this._object[this._key] = newValue
  }
}

export function toRef(target: object, key: string) {
  return new ObjectRefImpl(target, key)
}

export function toRefs(target: object) {
  const result = {}
  for (const key in target) {
    result[key] = new ObjectRefImpl(target, key)
  }
  return result
}

/**
 * 解包 ref
 * @param target
 */
export function proxyRefs(target: object) {
  const proxy = new Proxy(target, {
    get(target, key, receiver) {
      const result = Reflect.get(target, key, receiver)
      return unref(result)
    },
    set(target, key, newValue, receiver) {
      const oldValue = target[key]

      /** 原值是个 ref，新值不是，直接走 ref 更新逻辑 */
      if (isRef(oldValue) && !isRef(newValue)) {
        oldValue.value = newValue
        return true
      }

      return Reflect.set(target, key, newValue, receiver)
    },
  })

  return proxy
}
