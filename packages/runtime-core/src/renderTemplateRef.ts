import type { RefImpl } from '@vue/reactivity'
import type { ComponentInstance } from './component'
import type { VNode } from './vnode'
import { isRef } from '@vue/reactivity'
import { isString, ShapeFlags } from '@vue/shared'
import { getComponentPublicInstance } from './component'

export function setRef(
  ref: {
    r: RefImpl
    i: ComponentInstance
  },
  vnode: VNode,
) {
  const { r: rawRef, i: instance } = ref

  if (vnode == null) {
    // 清除引用
    if (isRef(rawRef)) {
      rawRef.value = null
    }
    else if (isString(rawRef)) {
      instance.refs[rawRef] = null
    }

    return
  }

  const { shapeFlag } = vnode

  if (isRef(rawRef)) {
    if (shapeFlag & ShapeFlags.COMPONENT) {
      rawRef.value = getComponentPublicInstance(vnode.component)
    }
    else {
      rawRef.value = vnode.el
    }
  }
  else if (isString(rawRef)) {
    if (shapeFlag & ShapeFlags.COMPONENT) {
      instance.refs[rawRef] = getComponentPublicInstance(vnode.component)
    }
    else {
      instance.refs[rawRef] = vnode.el
    }
  }
}
