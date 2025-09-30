import type { ComponentInstance } from './component'
import type { VNode } from './vnode'
import { ShapeFlags } from '@vue/shared'
import { setCurrentRenderingInstance, unsetCurrentRenderingInstance } from './component'

function hasPropsChanged(prevProps: object, nextProps: object) {
  const nextKeys = Object.keys(nextProps)

  // 属性数量不一致
  if (nextKeys.length !== Object.keys(prevProps).length) {
    return true
  }

  // 属性不一致
  for (const key of nextKeys) {
    if (nextProps[key] !== prevProps[key]) {
      return true
    }
  }

  return false
}

export function shouldUpdateComponent(n1: VNode, n2: VNode) {
  const { props: prevProps, children: prevChildren } = n1
  const { props: nextProps, children: nextChildren } = n2

  // 任意一个有插槽 都需要更新
  if (prevChildren || nextChildren) {
    return true
  }

  // 没有旧的 props，则有新的 props 才需要更新
  if (!prevProps) {
    return !!nextProps
  }

  // 有旧的，没有新的，需要更新
  if (!nextProps) {
    return true
  }

  // 旧的新的都有
  return hasPropsChanged(prevProps, nextProps)
}

export function renderComponentRoot(instance: ComponentInstance) {
  const { vnode } = instance

  if (vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
    setCurrentRenderingInstance(instance)
    // this 指向 instance 的代理对象
    const subTree = instance.render.call(instance.proxy)
    unsetCurrentRenderingInstance()
    return subTree
  }
  // 函数式组件
  return vnode.type(instance.props, {
    // 函数式组件没有 expose
    get attrs() {
      return instance.attrs
    },
    slots: instance.slots,
    emit: instance.emit,
  })
}
