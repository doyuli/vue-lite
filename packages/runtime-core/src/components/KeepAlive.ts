import type { RendererElement } from '../renderer'
import type { VNode } from '../vnode'

import { ShapeFlags } from '@vue/shared'
import { getCurrentInstance } from '../component'

export const isKeepAlive = (type: any) => type?.__isKeepAlive

export const KeepAlive = {
  name: 'KeepAlive',
  __isKeepAlive: true,
  props: ['max'],
  setup(props: any, { slots }) {
    const cache = new LRUCache(props.max)

    const instance = getCurrentInstance()
    const { options: { createElement, insert }, unmount: _unmount } = instance.ctx.renderer

    // 在内存中持有被缓存的 vnode.el 引用
    const storageContainer = createElement('div')

    instance.ctx.deactivate = (vnode: VNode) => {
      insert(vnode.el, storageContainer)
    }

    instance.ctx.activate = (vnode: VNode, container: RendererElement, anchor: RendererElement) => {
      insert(vnode.el, container, anchor)
    }

    const unmount = (vnode: VNode) => {
      resetShapeFlag(vnode)
      _unmount(vnode)
    }

    return () => {
      const vnode = slots.default()

      const key = vnode.key ? vnode.key : vnode.type

      const cachedVNode = cache.get(key)

      if (cachedVNode) {
        // 检测到 KeepAlive 缓存，打个标记，告诉 renderer => processComponent 不需要挂 载它，使用内部的 activate 方法
        vnode.shapeFlag |= ShapeFlags.COMPONENT_KEPT_ALIVE
        // 复用缓存节点的 el 和 component
        vnode.el = cachedVNode.el
        vnode.component = cachedVNode.component
      }

      const uncached = cache.set(key, vnode)

      if (uncached) {
        // 超出缓存最大数量时，会返回被删除的 vnode，需要卸载
        unmount(uncached)
      }

      // 打个标记，告诉 renderer => unmount 不需要卸载它，使用内部的 deactivate 方法
      vnode.shapeFlag |= ShapeFlags.COMPONENT_SHOULD_KEEP_ALIVE

      return vnode
    }
  },
}

function resetShapeFlag(vnode: VNode) {
  // 不需要缓存的组件，需要清除掉 KeepAlive 的 shapeFlag 标记
  vnode.shapeFlag &= ~ShapeFlags.COMPONENT_KEPT_ALIVE
  vnode.shapeFlag &= ~ShapeFlags.COMPONENT_SHOULD_KEEP_ALIVE
}

class LRUCache {
  cache = new Map()
  max: number
  constructor(max = Infinity) {
    this.max = max
  }

  get(key: any): VNode {
    if (!this.cache.has(key))
      return

    const cached = this.cache.get(key)
    this.cache.delete(key)
    this.cache.set(key, cached)
  }

  set(key: any, vnode: VNode) {
    let uncached: VNode
    if (this.cache.has(key)) {
      this.cache.delete(key)
    }
    else {
      if (this.cache.size >= this.max) {
        const first = this.cache.keys().next().value
        // 不需要缓存的 vnode，需要卸载
        uncached = this.cache.get(first)
        this.cache.delete(first)
      }
    }

    this.cache.set(key, vnode)

    return uncached
  }
}
