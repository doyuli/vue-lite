import { getCurrentInstance } from './component'

export type InjectKey = symbol | number | string

export function provide(key: InjectKey, value: unknown) {
  const instance = getCurrentInstance()

  let provides = instance.provides

  const parentProvides = instance.parent ? instance.parent.provides : instance.appContext.provides

  // 优化（懒初始化）：仅当组件首次 provide 时才创建独立的 provides 原型链对象
  if (provides === parentProvides) {
    provides = instance.provides = Object.create(parentProvides)
  }

  provides[key] = value
}

export function inject(key: InjectKey, defaultValue: unknown) {
  const instance = getCurrentInstance()

  const parentProvides = instance.parent ? instance.parent.provides : instance.appContext.provides

  if (key in parentProvides) {
    return parentProvides[key]
  }

  return defaultValue
}
