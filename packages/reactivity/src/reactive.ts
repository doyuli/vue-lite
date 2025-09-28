import type { Dep } from './dep'
import { isObject } from '@vue/shared'
import { mutableHandlers } from './baseHandlers'

export const targetMap = new WeakMap<object, Map<unknown, Dep>>()
export const reactiveMap = new WeakMap()
const reactiveSet = new WeakSet()

export function reactive<T extends object>(target: T): T {
  return createReactiveObject(target)
}

enum TargetType {
  // 不可响应式处理（如 DOM、Window、冻结对象等）
  INVALID = 0,
  // 普通对象或数组，使用 reactive 响应式代理
  COMMON = 1,
  // 集合类型（Map/Set/WeakMap/WeakSet）
  COLLECTION = 2,
}

function toRawType(value: object) {
  return Object.prototype.toString.call(value).slice(8, -1)
}

function getTargetType(target: object) {
  // 是否可扩展，比如 Object.freeze()
  if (!Object.isExtensible(target)) {
    return TargetType.INVALID
  }

  const rawType = toRawType(target)

  switch (rawType) {
    // 普通对象和数组
    case 'Object':
    case 'Array':
      return TargetType.COMMON
    // 集合类型
    case 'Map':
    case 'Set':
    case 'WeakMap':
    case 'WeakSet':
      return TargetType.COLLECTION
    // 其他类型（如 HTMLDivElement、Window、Date 等）
    default:
      return TargetType.INVALID
  }
}

function createReactiveObject<T extends object>(target: T): T {
  // 不是一个对象，直接返回
  if (!isObject(target)) {
    return target
  }

  // 处理已经是一个 proxy
  if (isReactive(target)) {
    return target
  }

  // 有效性检查，确保 target 可以被代理
  const targetType = getTargetType(target)
  if (targetType === TargetType.INVALID) {
    return target
  }

  // 处理同一个对象被重复代理
  const existingProxy = reactiveMap.get(target)
  if (existingProxy) {
    return existingProxy
  }

  const porxy = new Proxy(target, mutableHandlers)

  // 保存 target 和 proxy 关联关系
  reactiveMap.set(target, porxy)
  // 保存所有 proxy
  reactiveSet.add(porxy)

  return porxy
}

export function isReactive(target: any) {
  return reactiveSet.has(target)
}
