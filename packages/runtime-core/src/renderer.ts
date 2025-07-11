import type { VNode } from './vnode'
import { ShapeFlags } from '@vue/shared'
import { isSameVNodeType } from './vnode'

/**
 * 创建渲染器
 * @param options
 */
export function createRenderer(options: RendererOptions) {
  // 操作 dom 方法
  const {
    insert: hostInsert,
    remove: hostRemove,
    patchProp: hostPatchProp,
    createElement: hostCreateElement,
    createText: hostCreateText,
    setText: hostSetText,
    setElementText: hostSetElementText,
    parentNode: hostParentNode,
    nextSibling: hostNextSibling,
  } = options

  /**
   * 卸载子节点
   * @param children
   */
  const unmountChildren = (children: VNode['children']) => {
    for (let i = 0; i < children.length; i++) {
      const child = children[i]
      // 递归卸载子节点
      unmount(child)
    }
  }

  /**
   * 卸载
   * @param vnode
   */
  const unmount = (vnode: VNode) => {
    const { shapeFlag, children } = vnode
    if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      // 递归卸载子节点
      unmountChildren(children)
    }
    hostRemove(vnode.el)
  }

  /**
   * 挂载子节点
   * @param children
   * @param el
   */
  const mountChildren = (children: VNode['children'], el: RendererElement) => {
    for (let i = 0; i < children.length; i++) {
      const child = children[i]
      // 递归挂载子节点
      patch(null, child, el)
    }
  }

  /**
   * 挂载
   * @param vnode
   * @param container
   */
  const mountElement = (vnode: VNode, container: RendererElement) => {
    const { type, props, children, shapeFlag } = vnode

    // 创建 dom 元素
    const el = hostCreateElement(type)
    // 更新、卸载时需要用到
    vnode.el = el

    // 设置 props
    if (props) {
      for (const key in props) {
        hostPatchProp(el, key, null, props[key])
      }
    }

    /**
     * 挂载子节点
     * 与运算（二进制）
     */
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      // 文本子节点
      hostSetElementText(el, children)
    }
    else {
      // 数组子节点
      mountChildren(children, el)
    }

    // 把 el 挂载到 container 中
    hostInsert(el, container)
  }

  /**
   * 更新 props
   * @param el
   */
  const patchProps = (el: RendererElement, oldProps: any, newProps: any) => {
    // 删掉老的
    if (oldProps) {
      for (const key in oldProps) {
        hostPatchProp(el, key, oldProps[key], null)
      }
    }

    // 设置新的
    if (newProps) {
      for (const key in oldProps) {
        hostPatchProp(el, key, oldProps?.[key], newProps[key])
      }
    }
  }

  /**
   * 更新子节点
   * @param n1
   * @param n2
   */
  const patchChildren = (n1: VNode, n2: VNode) => {
    const prevShapeFlag = n1.shapeFlag
    const nextShapeFlag = n2.shapeFlag
    const el = n2.el
    /**
     * 这里分为几种情况
     * 1. 新的是文本
     *  1.1 旧的是数组
     *  1.2 旧的也是文本
     * 2. 新的是数组
     *  2.1 旧的是文本
     *  2.2 旧的也是数组
     */
    // 新的是文本
    if (nextShapeFlag & ShapeFlags.TEXT_CHILDREN) {
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        // 旧的是数组 则要卸载旧的
        unmountChildren(n1.children)
      }
      // 旧的也是文本，替换文本
      if (n1.children !== n2.children) {
        // 设置文本
        hostSetElementText(el, n2.children)
      }
    }
    // 新的是数组
    else {
      if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
        // 干掉旧的文本
        hostSetElementText(el, '')
        // 挂载新的节点
        mountChildren(n2.children, el)
      } else {
        // 新的是数组，老的也是数组 全量 diff
      }
    }
  }

  /**
   * 更新节点
   * @param n1
   * @param n2
   */
  const patchElement = (n1: VNode, n2: VNode) => {
    // 复用 dom 元素
    const el = (n2.el = n1.el)
    // 更新 props
    patchProps(el, n1.props, n2.props)
    // 更新 children
    patchChildren(n1, n2)
  }

  /**
   * 挂载和更新函数
   * @param n1 老节点
   * @param n2 新节点
   * @param container 容器
   */
  const patch = (n1: VNode, n2: VNode, container: RendererElement) => {
    if (n1 === n2) {
      return
    }

    if (n1 && !isSameVNodeType(n1, n2)) {
      /**
       * 如果 n1 和 n2 不是同一个类型，则需要卸载掉 n1，直接挂载 n2
       * n1 = null 是为了走下面的挂载逻辑
       * n1 h('div', 'Hello world')
       * n2 h('p', 'Hello world')
       */
      unmount(n1)
      n1 = null
    }

    if (n1 == null) {
      // 挂载
      mountElement(n2, container)
    }
    else {
      // 更新
      patchElement(n1, n2)
    }
  }

  const render = (vnode: VNode, container: RendererElement) => {
    if (vnode == null && container._vnode) {
      /**
       * 卸载
       */
      unmount(container._vnode)
    }
    else {
      /**
       * 挂载 更新
       */
      patch(container._vnode || null, vnode, container)
      // 把 vnode 挂载在 el 上
      container._vnode = vnode
    }
  }

  const createApp = (vnode: VNode, container: Element) => {
    console.log('🚀 ~ render ~ vnode,el:', vnode, container)
  }
  return {
    render,
    createApp,
  }
}

/** https://github.com/vuejs/core/blob/vapor/packages/runtime-dom/src/nodeOps.ts */
export interface RendererNode {
  [key: string | symbol]: any
}

export interface RendererElement extends RendererNode {}

export type ElementNamespace = 'svg' | 'mathml' | undefined

/** Preventing errors */
type ComponentInternalInstance = any
type VNodeProps = any

export interface RendererOptions<HostNode = RendererNode, HostElement = RendererElement> {
  patchProp: (
    el: HostElement,
    key: string,
    prevValue: any,
    nextValue: any,
    namespace?: ElementNamespace,
    parentComponent?: ComponentInternalInstance | null,
  ) => void
  insert: (el: HostNode, parent: HostElement, anchor?: HostNode | null) => void
  remove: (el: HostNode) => void
  createElement: (
    type: string,
    namespace?: ElementNamespace,
    isCustomizedBuiltIn?: string,
    vnodeProps?: (VNodeProps & { [key: string]: any }) | null,
  ) => HostElement
  createText: (text: string) => HostNode
  createComment: (text: string) => HostNode
  setText: (node: HostNode, text: string) => void
  setElementText: (node: HostElement, text: string) => void
  parentNode: (node: HostNode) => HostElement | null
  nextSibling: (node: HostNode) => HostNode | null
  querySelector?: (selector: string) => HostElement | null
  setScopeId?: (el: HostElement, id: string) => void
  cloneNode?: (node: HostNode) => HostNode
  insertStaticContent?: (
    content: string,
    parent: HostElement,
    anchor: HostNode | null,
    namespace: ElementNamespace,
    start?: HostNode | null,
    end?: HostNode | null,
  ) => [HostNode, HostNode]
}
