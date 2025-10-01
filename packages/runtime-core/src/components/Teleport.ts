import type { ComponentInstance } from '../component'
import type { RendererElement } from '../renderer'
import type { VNode } from '../vnode'

export const isTeleport = (type: any) => type?.__isTeleport

export const Teleport = {
  name: 'Teleport',
  __isTeleport: true,
  props: {
    to: {
      type: String,
    },
    disabled: {
      type: Boolean,
    },
  },
  process(n1: VNode, n2: VNode, container: RendererElement, anchor: RendererElement, parentComponent: ComponentInstance, internals: any) {
    const { to, disabled } = n2.props
    const { mountChildren, patchChildren, options: { querySelector, insert } } = internals

    if (n1 == null) {
      // 挂载
      const target = disabled ? container : querySelector(to)

      if (target) {
        n2.target = target
        mountChildren(n2.children, target, parentComponent)
      }
    }
    else {
      // 更新
      patchChildren(n1, n2, n1.target, parentComponent)
      n2.target = n1.target

      const prevProps = n1.props

      if (prevProps.to !== to || prevProps.disabled !== disabled) {
        // props 发生变化
        const target = disabled ? container : querySelector(to)
        // 将原来的子节点移动到 target 上
        for (const child of n2.children) {
          insert(child.el, target, anchor)
        }
        // 更新 target
        n2.target = target
      }
    }
  },
}
