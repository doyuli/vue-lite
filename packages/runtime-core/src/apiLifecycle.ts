import type { ComponentInstance } from './component'
import {
  getCurrentInstance,
  setCurrentInstance,
  unsetCurrentInstance,
} from './component'

export enum LifecycleHooks {
  // 挂载
  BEFORE_MOUNT = 'bm',
  MOUNTED = 'm',
  // 更新
  BEFORE_UPDATE = 'bu',
  UPDATED = 'u',
  // 卸载
  BEFORE_UNMOUNT = 'bum',
  UNMOUNTED = 'um',
}

function createHook(type: LifecycleHooks) {
  return (hook: () => void, target = getCurrentInstance()) => {
    injectHook(target, hook, type)
  }
}

function injectHook(
  target: ComponentInstance,
  hook: () => void,
  type: LifecycleHooks,
) {
  const hooks = target[type] || (target[type] = [])
  hooks.push(hook)
}

export function triggerHooks(
  instance: ComponentInstance,
  type: LifecycleHooks,
) {
  const hooks = instance[type]
  if (hooks) {
    // 确保生命周期中用户可以获取到 currentInstance
    setCurrentInstance(instance)
    try {
      hooks.forEach((hook: () => void) => hook())
    }
    finally {
      unsetCurrentInstance()
    }
  }
}

export const onBeforeMount = createHook(LifecycleHooks.BEFORE_MOUNT)
export const onMounted = createHook(LifecycleHooks.MOUNTED)
export const onBeforeUpdate = createHook(LifecycleHooks.BEFORE_UPDATE)
export const onUpdated = createHook(LifecycleHooks.UPDATED)
export const onBeforeUnmount = createHook(LifecycleHooks.BEFORE_UNMOUNT)
export const onUnmounted = createHook(LifecycleHooks.UNMOUNTED)
