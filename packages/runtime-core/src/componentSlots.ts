import type { ComponentInstance } from './component'
import type { VNode } from './vnode'
import { hasOwn, ShapeFlags } from '@vue/shared'

export function initSlots(instance: ComponentInstance) {
  const { slots, vnode } = instance
  // 只有 slots children 才需要初始化插槽
  if (vnode.shapeFlag & ShapeFlags.SLOTS_CHILDREN) {
    const { children } = vnode

    // 把插槽挂载在 instance 上
    for (const key in children) {
      slots[key] = children[key]
    }
  }
}

export function updateSlots(instance: ComponentInstance, nextVNode: VNode) {
  const { slots } = instance
  // 只有 slots children 才需要初始化插槽
  if (nextVNode.shapeFlag & ShapeFlags.SLOTS_CHILDREN) {
    const { children } = nextVNode

    // 更新 slots
    for (const key in children) {
      slots[key] = children[key]
    }

    // 之前有的，现在没有，需要删掉
    for (const key in slots) {
      if (!hasOwn(children, key)) {
        delete slots[key]
      }
    }
  }
}
